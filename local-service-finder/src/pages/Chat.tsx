import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as signalR from "@microsoft/signalr";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  Send, MessageCircle, ArrowLeft, Loader2, CheckCheck,
  Paperclip, Mic, Phone, Video, PhoneOff,
  PhoneIncoming, FileText, Download, X, StopCircle,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────────── */
interface OtherUser  { id: string; name: string; }
interface LastMsg    { content: string; sentAt: string; senderId: string; messageType?: string; }
interface Conversation {
  id:               string;
  subject:          string;
  otherUser:        OtherUser;
  lastMessage:      LastMsg | null;
  unreadCount:      number;
  createdAt:        string;
  bookingId?:       string;
  jobApplicationId?: string;
}
interface ChatMessage {
  id:          string;
  conversationId: string;
  senderId:    string;
  senderName:  string;
  content:     string;
  sentAt:      string;
  isRead:      boolean;
  messageType: string; // text | audio | image | video | file
  fileUrl?:    string;
  fileName?:   string;
  fileSize?:   number;
}

type CallState = "idle" | "calling" | "ringing" | "active";
interface IncomingCallInfo {
  conversationId: string;
  callType:       "audio" | "video";
  callerId:       string;
  callerName:     string;
}

/* ── Helpers ─────────────────────────────────────────────────── */
function fmt(d: string) {
  const date = new Date(d);
  const now  = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `${hrs}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const BASE_URL = (import.meta.env.VITE_API_URL as string || "")
  .replace(/\/api$/, "");

function isSameUser(id1?: string, id2?: string) {
  if (!id1 || !id2) return false;
  return id1.toLowerCase() === id2.toLowerCase();
}

function signalNavbarChatRead() {
  window.dispatchEvent(new CustomEvent("chatUnreadReset"));
}

// Free public STUN servers for WebRTC NAT traversal
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

/* ── Component ───────────────────────────────────────────────── */
export default function Chat() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv,    setActiveConv]    = useState<Conversation | null>(null);
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [draft,         setDraft]         = useState("");
  const [loadingConvs,  setLoadingConvs]  = useState(true);
  const [loadingMsgs,   setLoadingMsgs]   = useState(false);
  const [connected,     setConnected]     = useState(false);
  const [mobileView,    setMobileView]    = useState<"list" | "chat">("list");
  const [uploading,     setUploading]     = useState(false);

  // Voice recording
  const [recording,    setRecording]    = useState(false);
  const [recSeconds,   setRecSeconds]   = useState(0);
  const [audioBlobURL, setAudioBlobURL] = useState<string | null>(null);
  const [audioBlob,    setAudioBlob]    = useState<Blob | null>(null);
  const mediaRecRef   = useRef<MediaRecorder | null>(null);
  const recTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioChunks   = useRef<Blob[]>([]);

  // WebRTC call state
  const [callState,     setCallState]     = useState<CallState>("idle");
  const [callType,      setCallType]      = useState<"audio" | "video">("audio");
  const [incomingCall,  setIncomingCall]  = useState<IncomingCallInfo | null>(null);
  const peerRef         = useRef<RTCPeerConnection | null>(null);
  const localStreamRef  = useRef<MediaStream | null>(null);
  const localVideoRef   = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef  = useRef<HTMLVideoElement | null>(null);
  // Holds an SDP offer that arrived before acceptCall() finished setting up the peer
  const pendingOfferRef          = useRef<string | null>(null);
  // Buffers ICE candidates that arrive before setRemoteDescription is called
  const pendingIceCandidatesRef  = useRef<RTCIceCandidateInit[]>([]);

  // Tracking refs for call logs
  const callStartTimeRef = useRef<number | null>(null);
  const callConvIdRef    = useRef<string | null>(null);

  // Core refs
  const hubRef        = useRef<signalR.HubConnection | null>(null);
  const activeConvRef = useRef<Conversation | null>(null);
  const userIdRef     = useRef<string | undefined>(user?.id);
  const messagesEnd   = useRef<HTMLDivElement | null>(null);
  const inputRef      = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef  = useRef<HTMLInputElement | null>(null);

  // Sync call start time on state transitions
  useEffect(() => {
    if (callState === "active") {
      callStartTimeRef.current = Date.now();
    } else if (callState === "idle") {
      callStartTimeRef.current = null;
    }
  }, [callState]);

  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);
  useEffect(() => { userIdRef.current     = user?.id;   }, [user?.id]);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  /* ── Fetch conversations ── */
  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.get<Conversation[]>("/Chat/conversations");
      setConversations(data);
    } catch { /* silently fail */ }
    finally  { setLoadingConvs(false); }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  /* ── WebRTC helpers ── */
  const closePeer = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    pendingOfferRef.current         = null; // discard any buffered offer from the previous call
    pendingIceCandidatesRef.current = [];   // discard any buffered ICE candidates
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  const endCall = useCallback(async () => {
    const convId = callConvIdRef.current;
    const hub  = hubRef.current;
    if (convId && hub?.state === signalR.HubConnectionState.Connected) {
      await hub.invoke("EndCall", convId).catch(() => {});

      let status = "Completed";
      let duration = 0;
      if (callState === "calling") {
        status = "Missed";
      } else if (callState === "ringing") {
        status = "Declined";
      } else if (callState === "active" && callStartTimeRef.current) {
        duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
      }

      await hub.invoke("LogCall", convId, callType, status, duration).catch(() => {});
    }
    closePeer();
    setCallState("idle");
    setIncomingCall(null);
    callConvIdRef.current = null;
  }, [closePeer, callState, callType]);

  const createPeer = useCallback((onIce: (c: RTCIceCandidate) => void): RTCPeerConnection => {
    const peer = new RTCPeerConnection(RTC_CONFIG);
    peer.onicecandidate = (e) => { if (e.candidate) onIce(e.candidate); };
    peer.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };
    return peer;
  }, []);

  const startLocalStream = useCallback(async (type: "audio" | "video") => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });
    localStreamRef.current = stream;
    if (localVideoRef.current && type === "video") {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  }, []);

  /* ── Initiate outgoing call ── */
  const startCall = useCallback(async (type: "audio" | "video") => {
    const conv = activeConvRef.current;
    const hub  = hubRef.current;
    if (!conv || !hub) return;

    setCallType(type);
    setCallState("calling");
    callConvIdRef.current = conv.id;

    try {
      const stream = await startLocalStream(type);
      const peer   = createPeer(async (candidate) => {
        await hub.invoke("SendIceCandidate", conv.id, JSON.stringify(candidate)).catch(() => {});
      });
      peerRef.current = peer;
      stream.getTracks().forEach(t => peer.addTrack(t, stream));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      await hub.invoke("InitiateCall", conv.id, type);
      await hub.invoke("SendOffer", conv.id, JSON.stringify(offer));
    } catch {
      closePeer();
      setCallState("idle");
    }
  }, [startLocalStream, createPeer, closePeer]);

  /* ── Accept incoming call ── */
  const acceptCall = useCallback(async () => {
    const info = incomingCall;
    const hub  = hubRef.current;
    if (!info || !hub) return;

    setCallState("active");
    setCallType(info.callType);
    setIncomingCall(null);
    callConvIdRef.current = info.conversationId;

    try {
      const stream = await startLocalStream(info.callType);
      const peer   = createPeer(async (candidate) => {
        await hub.invoke("SendIceCandidate", info.conversationId, JSON.stringify(candidate)).catch(() => {});
      });
      peerRef.current = peer;
      stream.getTracks().forEach(t => peer.addTrack(t, stream));

      // If the SDP offer already arrived before the peer was ready, process it now
      const pendingSdp = pendingOfferRef.current;
      if (pendingSdp) {
        pendingOfferRef.current = null;
        try {
          const offer = JSON.parse(pendingSdp) as RTCSessionDescriptionInit;
          await peer.setRemoteDescription(new RTCSessionDescription(offer));
          // Flush ICE candidates that arrived before remote description was ready
          for (const ic of pendingIceCandidatesRef.current) {
            await peer.addIceCandidate(new RTCIceCandidate(ic)).catch(() => {});
          }
          pendingIceCandidatesRef.current = [];
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          await hub.invoke("SendAnswer", info.conversationId, JSON.stringify(answer));
        } catch { /* ignore */ }
      }
    } catch {
      closePeer();
      setCallState("idle");
    }
  }, [incomingCall, startLocalStream, createPeer, closePeer]);

  /* ── Build SignalR connection ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/chat`, {
        accessTokenFactory: () => localStorage.getItem("token") ?? token,
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // ── Incoming text/media message ──
    conn.on("ReceiveMessage", (msg: ChatMessage) => {
      const currentConv  = activeConvRef.current;
      const currentUid   = userIdRef.current;
      const isActiveConv = currentConv?.id === msg.conversationId;

      setMessages(prev => {
        const withoutOptimistic = prev.filter(m =>
          !(m.id.startsWith("opt-") &&
            isSameUser(m.senderId, msg.senderId) &&
            m.content === msg.content &&
            m.messageType === (msg.messageType || "text"))
        );
        if (withoutOptimistic.some(m => m.id === msg.id)) return withoutOptimistic;
        return [...withoutOptimistic, msg];
      });

      setConversations(prev => prev.map(c => {
        if (c.id !== msg.conversationId) return c;
        const incoming  = !isSameUser(msg.senderId, currentUid);
        const newUnread = incoming && !isActiveConv ? c.unreadCount + 1 : c.unreadCount;
        return {
          ...c,
          lastMessage: { content: msg.content || msg.fileName || "📎 File", sentAt: msg.sentAt, senderId: msg.senderId, messageType: msg.messageType },
          unreadCount: newUnread,
        };
      }));
    });

    // ── Read receipts ──
    conn.on("MessagesRead", ({ conversationId }: { conversationId: string }) => {
      setMessages(prev =>
        prev.map(m => m.conversationId === conversationId ? { ...m, isRead: true } : m)
      );
    });

    // ── WebRTC: Incoming call ──
    conn.on("IncomingCall", (info: IncomingCallInfo) => {
      setIncomingCall(info);
      setCallState("ringing");
      callConvIdRef.current = info.conversationId;
    });

    // ── WebRTC: Receive SDP offer (callee side) ──
    conn.on("ReceiveOffer", async ({ sdpOffer }: { sdpOffer: string }) => {
      const peer  = peerRef.current;
      const hub   = hubRef.current;
      const convId = callConvIdRef.current;

      // If peer isn't ready yet (acceptCall still running), store the offer for later
      if (!peer || !hub || !convId) {
        pendingOfferRef.current = sdpOffer;
        return;
      }

      try {
        const offer = JSON.parse(sdpOffer) as RTCSessionDescriptionInit;
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        // Flush any ICE candidates that arrived before the remote description was ready
        for (const ic of pendingIceCandidatesRef.current) {
          await peer.addIceCandidate(new RTCIceCandidate(ic)).catch(() => {});
        }
        pendingIceCandidatesRef.current = [];
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await hub.invoke("SendAnswer", convId, JSON.stringify(answer));
        setCallState("active");
      } catch { /* ignore */ }
    });

    // ── WebRTC: Receive SDP answer (caller side) ──
    conn.on("ReceiveAnswer", async ({ sdpAnswer }: { sdpAnswer: string }) => {
      const peer = peerRef.current;
      if (!peer) return;
      try {
        const answer = JSON.parse(sdpAnswer) as RTCSessionDescriptionInit;
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        // Flush any ICE candidates that arrived before the remote description was ready
        for (const ic of pendingIceCandidatesRef.current) {
          await peer.addIceCandidate(new RTCIceCandidate(ic)).catch(() => {});
        }
        pendingIceCandidatesRef.current = [];
        setCallState("active");
      } catch { /* ignore */ }
    });

    // ── WebRTC: ICE candidates ──
    conn.on("ReceiveIceCandidate", async ({ candidate }: { candidate: string }) => {
      const peer = peerRef.current;
      if (!peer) return;
      try {
        const ic = JSON.parse(candidate) as RTCIceCandidateInit;
        // Buffer the candidate if remote description isn't set yet
        if (!peer.remoteDescription) {
          pendingIceCandidatesRef.current.push(ic);
        } else {
          await peer.addIceCandidate(new RTCIceCandidate(ic));
        }
      } catch { /* ignore */ }
    });

    // ── WebRTC: Call ended by other side ──
    conn.on("CallEnded", () => {
      closePeer();
      setCallState("idle");
      setIncomingCall(null);
    });

    conn.onreconnected(async () => {
      setConnected(true);
      const conv = activeConvRef.current;
      if (conv) await conn.invoke("JoinConversation", conv.id).catch(() => {});
    });

    conn.onclose(() => setConnected(false));
    hubRef.current = conn;

    conn.start()
      .then(() => setConnected(true))
      .catch(() => setConnected(false));

    return () => { conn.stop(); };
  }, [user?.id, closePeer]);

  /* ── Join conversation group when active changes ── */
  useEffect(() => {
    const hub  = hubRef.current;
    const conv = activeConv;
    if (!hub || !conv || !connected) return;

    const join = async () => {
      await hub.invoke("JoinConversation", conv.id).catch(() => {});
      await hub.invoke("MarkRead", conv.id).catch(() => {});
      signalNavbarChatRead();
    };
    join();

    return () => {
      if (hub.state === signalR.HubConnectionState.Connected) {
        hub.invoke("LeaveConversation", conv.id).catch(() => {});
      }
    };
  }, [activeConv?.id, connected]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Select conversation ── */
  const openConversation = useCallback(async (conv: Conversation) => {
    setActiveConv(conv);
    setMessages([]);
    setLoadingMsgs(true);
    setMobileView("chat");
    setConversations(prev =>
      prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
    );
    signalNavbarChatRead();
    try {
      const { data } = await api.get<ChatMessage[]>(`/Chat/conversations/${conv.id}/messages`);
      setMessages(data);
    } catch { /* silently fail */ }
    finally  { setLoadingMsgs(false); }
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Send text message ── */
  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || !activeConv || !user) return;
    setDraft("");

    const optimisticId = `opt-${Date.now()}`;
    const opt: ChatMessage = {
      id: optimisticId, conversationId: activeConv.id,
      senderId: user.id, senderName: user.name,
      content, sentAt: new Date().toISOString(), isRead: false, messageType: "text",
    };
    setMessages(prev => [...prev, opt]);

    try {
      const hub = hubRef.current;
      if (hub?.state === signalR.HubConnectionState.Connected) {
        await hub.invoke("SendMessage", activeConv.id, content, "text", null, null, null);
      } else {
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        setDraft(content);
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      setDraft(content);
    }
  };

  /* ── Send a media message (after upload) ── */
  const sendMediaMessage = async (
    fileUrl: string,
    messageType: string,
    fileName: string,
    fileSize: number,
    content = "",
  ) => {
    if (!activeConv || !user) return;
    const hub = hubRef.current;
    if (!hub || hub.state !== signalR.HubConnectionState.Connected) return;

    const optimisticId = `opt-${Date.now()}`;
    const opt: ChatMessage = {
      id: optimisticId, conversationId: activeConv.id,
      senderId: user.id, senderName: user.name,
      content, sentAt: new Date().toISOString(), isRead: false,
      messageType, fileUrl, fileName, fileSize,
    };
    setMessages(prev => [...prev, opt]);

    try {
      await hub.invoke("SendMessage", activeConv.id, content, messageType, fileUrl, fileName, fileSize);
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
    }
  };

  /* ── Upload file from picker ── */
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConv) return;
    e.target.value = "";
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post("/Chat/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await sendMediaMessage(data.url, data.resourceType, data.fileName, data.fileSize);
    } catch {
      alert("File upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  /* ── Voice recording ── */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec    = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunks.current = [];

      rec.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioBlobURL(URL.createObjectURL(blob));
      };

      rec.start();
      mediaRecRef.current = rec;
      setRecording(true);
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    } catch {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecRef.current?.stop();
    mediaRecRef.current = null;
    setRecording(false);
    if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null; }
  };

  const cancelVoiceNote = () => {
    setAudioBlob(null);
    if (audioBlobURL) { URL.revokeObjectURL(audioBlobURL); setAudioBlobURL(null); }
  };

  const sendVoiceNote = async () => {
    if (!audioBlob || !activeConv) return;
    cancelVoiceNote();
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", audioBlob, `voice-${Date.now()}.webm`);
      const { data } = await api.post("/Chat/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await sendMediaMessage(data.url, "audio", data.fileName, data.fileSize, "🎤 Voice message");
    } catch {
      alert("Failed to send voice note.");
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* ── Render ── */
  if (!user) return null;

  return (
    <div className="chat-page">
      {/* ── Incoming call overlay ── */}
      {callState === "ringing" && incomingCall && (
        <div className="call-overlay call-overlay--ringing">
          <div className="call-overlay-card">
            <div className="call-avatar-ring">
              <div className="call-avatar">{incomingCall.callerName.charAt(0).toUpperCase()}</div>
            </div>
            <p className="call-name">{incomingCall.callerName}</p>
            <p className="call-subtitle">
              Incoming {incomingCall.callType === "video" ? "video" : "voice"} call…
            </p>
            <div className="call-actions">
              <button
                className="call-btn call-btn--accept"
                onClick={acceptCall}
              >
                {incomingCall.callType === "video" ? <Video size={24} /> : <Phone size={24} />}
              </button>
              <button className="call-btn call-btn--decline" onClick={endCall}>
                <PhoneOff size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active call overlay ── */}
      {(callState === "calling" || callState === "active") && (
        <div className="call-overlay call-overlay--active">
          <div className="call-overlay-card">
            {callType === "video" && (
              <div className="call-video-wrap">
                <video ref={remoteVideoRef} autoPlay playsInline className="call-video-remote" />
                <video ref={localVideoRef} autoPlay playsInline muted className="call-video-local" />
              </div>
            )}
            {callType === "audio" && (
              <div className="call-audio-visual">
                <div className="call-avatar">{activeConv?.otherUser.name.charAt(0).toUpperCase()}</div>
                <p className="call-name">{activeConv?.otherUser.name}</p>
                <p className="call-subtitle">
                  {callState === "calling" ? "Calling…" : "On call"}
                </p>
              </div>
            )}
            <div className="call-actions">
              <button className="call-btn call-btn--decline" onClick={endCall}>
                <PhoneOff size={22} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Conversation Sidebar ── */}
      <aside className={`chat-sidebar ${mobileView === "chat" ? "chat-sidebar--hidden" : ""}`}>
        <div className="chat-sidebar-header">
          <h2 className="chat-sidebar-title">
            <MessageCircle size={20} />
            Messages
          </h2>
          {!connected && (
            <div title="Connecting…">
              <Loader2 size={16} className="chat-spinner" />
            </div>
          )}
        </div>

        {loadingConvs ? (
          <div className="chat-empty-state">
            <Loader2 size={32} className="chat-spinner" style={{ marginBottom: 12 }} />
            <p>Loading conversations…</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="chat-empty-state">
            <MessageCircle size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ fontWeight: 600, marginBottom: 4 }}>No conversations yet</p>
            <p style={{ fontSize: 13, color: "var(--text-faint)" }}>
              Conversations appear when a booking or job application is accepted.
            </p>
          </div>
        ) : (
          <ul className="chat-conv-list">
            {conversations.map(conv => {
              const previewContent = conv.lastMessage
                ? conv.lastMessage.messageType === "audio" ? "🎤 Voice message"
                : conv.lastMessage.messageType === "image" ? "🖼 Image"
                : conv.lastMessage.messageType === "video" ? "🎬 Video"
                : conv.lastMessage.messageType === "file"  ? "📎 File"
                : conv.lastMessage.content
                : conv.subject;
              const previewLabel = conv.lastMessage && isSameUser(conv.lastMessage.senderId, user.id)
                ? `You: ${previewContent}` : previewContent;

              return (
                <li
                  key={conv.id}
                  className={`chat-conv-item ${activeConv?.id === conv.id ? "chat-conv-item--active" : ""}`}
                  onClick={() => openConversation(conv)}
                >
                  <div className="chat-conv-avatar">
                    {conv.otherUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="chat-conv-info">
                    <div className="chat-conv-row">
                      <span className="chat-conv-name">{conv.otherUser.name}</span>
                      <span className="chat-conv-time">
                        {conv.lastMessage ? fmt(conv.lastMessage.sentAt) : fmt(conv.createdAt)}
                      </span>
                    </div>
                    <div className="chat-conv-row">
                      <span className="chat-conv-preview">{previewLabel}</span>
                      {conv.unreadCount > 0 && (
                        <span className="chat-conv-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                    <span className="chat-conv-subject">{conv.subject}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* ── Chat Panel ── */}
      <main className={`chat-panel ${mobileView === "list" ? "chat-panel--hidden" : ""}`}>
        {!activeConv ? (
          <div className="chat-empty-state chat-empty-main">
            <div className="chat-empty-icon"><MessageCircle size={40} /></div>
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the left to start chatting.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="chat-panel-header">
              <button className="chat-back-btn" onClick={() => setMobileView("list")} aria-label="Back">
                <ArrowLeft size={20} />
              </button>
              <div className="chat-panel-avatar">
                {activeConv.otherUser.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div className="chat-panel-name">{activeConv.otherUser.name}</div>
                <div className="chat-panel-subject">{activeConv.subject}</div>
              </div>
              {connected && <span className="chat-online-dot" title="Connected" />}

              {/* Call buttons */}
              {callState === "idle" && connected && (
                <div className="chat-call-btns">
                  <button
                    className="chat-call-btn"
                    title="Voice call"
                    onClick={() => startCall("audio")}
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    className="chat-call-btn"
                    title="Video call"
                    onClick={() => startCall("video")}
                  >
                    <Video size={18} />
                  </button>
                </div>
              )}
              {callState !== "idle" && (
                <button className="chat-call-btn chat-call-btn--active" onClick={endCall} title="End call">
                  <PhoneOff size={18} />
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {loadingMsgs ? (
                <div className="chat-empty-state">
                  <Loader2 size={28} className="chat-spinner" style={{ marginBottom: 8 }} />
                  <p>Loading messages…</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-empty-state">
                  <MessageCircle size={36} style={{ marginBottom: 8, opacity: 0.3 }} />
                  <p>No messages yet — say hello! 👋</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine       = isSameUser(msg.senderId, user.id);
                  const isOptimistic = msg.id.startsWith("opt-");
                  const showAvatar   = idx === 0 || !isSameUser(messages[idx - 1].senderId, msg.senderId);
                  const type         = msg.messageType || "text";

                  return (
                    <div
                      key={msg.id}
                      className={`chat-msg-row ${isMine ? "chat-msg-row--mine" : ""}`}
                      style={{ opacity: isOptimistic ? 0.7 : 1 }}
                    >
                      {!isMine && (
                        <div className="chat-msg-avatar" style={{ visibility: showAvatar ? "visible" : "hidden" }}>
                          {msg.senderName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="chat-msg-bubble-wrap">
                        {showAvatar && !isMine && (
                          <span className="chat-msg-sender">{msg.senderName}</span>
                        )}
                        <div className={`chat-msg-bubble ${isMine ? "chat-msg-bubble--mine" : ""} chat-msg-bubble--${type}`}>
                          {/* ── Text ── */}
                          {type === "text" && msg.content}

                          {/* ── Audio / Voice note ── */}
                          {type === "audio" && (
                            <div className="chat-media-audio">
                              <Mic size={16} style={{ flexShrink: 0 }} />
                              <audio src={msg.fileUrl} controls className="chat-audio-player" />
                            </div>
                          )}

                          {/* ── Image ── */}
                          {type === "image" && (
                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                              <img src={msg.fileUrl} alt={msg.fileName || "image"} className="chat-media-img" />
                            </a>
                          )}

                          {/* ── Video ── */}
                          {type === "video" && (
                            <video src={msg.fileUrl} controls className="chat-media-video" />
                          )}

                          {/* ── Generic file ── */}
                          {type === "file" && (
                            <a
                              href={msg.fileUrl}
                              download={msg.fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="chat-media-file"
                            >
                              <FileText size={24} style={{ flexShrink: 0 }} />
                              <div className="chat-media-file-info">
                                <span className="chat-media-file-name">{msg.fileName}</span>
                                {msg.fileSize && (
                                  <span className="chat-media-file-size">{fmtSize(msg.fileSize)}</span>
                                )}
                              </div>
                              <Download size={16} style={{ flexShrink: 0 }} />
                            </a>
                          )}

                          {/* ── Call Logs ── */}
                          {type.startsWith("call_") && (
                            <div className="chat-media-call">
                              {type === "call_missed" && <PhoneOff size={16} className="chat-call-icon chat-call-icon--missed" />}
                              {type === "call_declined" && <PhoneOff size={16} className="chat-call-icon chat-call-icon--declined" />}
                              {type === "call_completed" && (
                                msg.content.toLowerCase().includes("video") 
                                  ? <Video size={16} className="chat-call-icon chat-call-icon--completed" />
                                  : <Phone size={16} className="chat-call-icon chat-call-icon--completed" />
                              )}
                              <span>{msg.content}</span>
                            </div>
                          )}
                        </div>

                        <div className={`chat-msg-meta ${isMine ? "chat-msg-meta--mine" : ""}`}>
                          <span>{fmtTime(msg.sentAt)}</span>
                          {isMine && !isOptimistic && (
                            <CheckCheck
                              size={13}
                              style={{ color: msg.isRead ? "var(--teal)" : "var(--text-faint)" }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEnd} />
            </div>

            {/* ── Voice note preview ── */}
            {audioBlobURL && !recording && (
              <div className="chat-voice-preview">
                <audio src={audioBlobURL} controls className="chat-audio-player" />
                <button className="chat-voice-cancel" onClick={cancelVoiceNote} title="Cancel">
                  <X size={16} />
                </button>
                <button
                  className="chat-send-btn"
                  onClick={sendVoiceNote}
                  disabled={uploading}
                  title="Send voice note"
                >
                  {uploading ? <Loader2 size={18} className="chat-spinner" /> : <Send size={18} />}
                </button>
              </div>
            )}

            {/* ── Input bar ── */}
            {!audioBlobURL && (
              <div className="chat-input-bar">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="*/*"
                  style={{ display: "none" }}
                  onChange={handleFileSelected}
                />

                {/* Attach button */}
                <button
                  className="chat-toolbar-btn"
                  title="Attach file"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading
                    ? <Loader2 size={18} className="chat-spinner" />
                    : <Paperclip size={18} />
                  }
                </button>

                {/* Text input */}
                <textarea
                  ref={inputRef}
                  className="chat-input"
                  placeholder="Type a message… (Enter to send)"
                  value={draft}
                  rows={1}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                />

                {/* Voice record button */}
                {!draft.trim() && (
                  recording ? (
                    <button
                      className="chat-toolbar-btn chat-toolbar-btn--recording"
                      title={`Recording ${recSeconds}s — click to stop`}
                      onClick={stopRecording}
                    >
                      <StopCircle size={20} />
                      <span className="chat-rec-timer">{recSeconds}s</span>
                    </button>
                  ) : (
                    <button
                      className="chat-toolbar-btn"
                      title="Hold to record voice"
                      onClick={startRecording}
                    >
                      <Mic size={18} />
                    </button>
                  )
                )}

                {/* Send button */}
                {draft.trim() && (
                  <button
                    className="chat-send-btn"
                    onClick={sendMessage}
                    disabled={!draft.trim()}
                    aria-label="Send message"
                  >
                    <Send size={18} />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Incoming call notification (when in sidebar view on mobile) */}
      {callState === "ringing" && incomingCall && mobileView === "list" && (
        <div className="chat-incoming-banner">
          <PhoneIncoming size={18} />
          <span>{incomingCall.callerName} is calling…</span>
          <button className="call-btn call-btn--accept call-btn--sm" onClick={acceptCall}>
            <Phone size={14} />
          </button>
          <button className="call-btn call-btn--decline call-btn--sm" onClick={endCall}>
            <PhoneOff size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
