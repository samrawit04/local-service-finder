import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as signalR from "@microsoft/signalr";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Send, MessageCircle, ArrowLeft, Loader2, CheckCheck } from "lucide-react";

/* ── Types ──────────────────────────────────────────────────── */
interface OtherUser  { id: string; name: string; }
interface LastMsg    { content: string; sentAt: string; senderId: string; }
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

const BASE_URL = (import.meta.env.VITE_API_URL as string || "")
  .replace(/\/api$/, "");

/** Tell the Navbar to immediately reset its chat unread badge to 0. */
function signalNavbarChatRead() {
  window.dispatchEvent(new CustomEvent("chatUnreadReset"));
}

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

  // Refs — used inside SignalR callbacks to avoid stale closures without
  // rebuilding the connection every time state changes.
  const hubRef          = useRef<signalR.HubConnection | null>(null);
  const activeConvRef   = useRef<Conversation | null>(null);
  const userIdRef       = useRef<string | undefined>(user?.id);
  const messagesEnd     = useRef<HTMLDivElement | null>(null);
  const inputRef        = useRef<HTMLTextAreaElement | null>(null);

  // Keep refs in sync with state
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);
  useEffect(() => { userIdRef.current     = user?.id;   }, [user?.id]);

  /* ── Redirect if not logged in ── */
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

  /* ── Build SignalR connection ONCE per user session ──
     IMPORTANT: activeConv is intentionally NOT in the dependency array.
     Stale closure is avoided by reading activeConvRef.current inside callbacks. */
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

    // ── Incoming message ──
    conn.on("ReceiveMessage", (msg: ChatMessage) => {
      const currentConv  = activeConvRef.current;
      const currentUid   = userIdRef.current;
      const isActiveConv = currentConv?.id === msg.conversationId;

      // Replace any matching optimistic message, or append
      setMessages(prev => {
        const withoutOptimistic = prev.filter(m =>
          !(m.id.startsWith("opt-") &&
            m.senderId === msg.senderId &&
            m.content  === msg.content)
        );
        if (withoutOptimistic.some(m => m.id === msg.id)) return withoutOptimistic;
        return [...withoutOptimistic, msg];
      });

      // Update sidebar preview + unread count
      setConversations(prev => prev.map(c => {
        if (c.id !== msg.conversationId) return c;
        const incoming  = msg.senderId !== currentUid;
        const newUnread = incoming && !isActiveConv ? c.unreadCount + 1 : c.unreadCount;
        return {
          ...c,
          lastMessage: { content: msg.content, sentAt: msg.sentAt, senderId: msg.senderId },
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

    // ── Reconnect: re-join active conversation ──
    conn.onreconnected(async () => {
      setConnected(true);
      const conv = activeConvRef.current;
      if (conv) {
        await conn.invoke("JoinConversation", conv.id).catch(() => {});
      }
    });

    conn.onclose(() => setConnected(false));

    hubRef.current = conn;

    conn.start()
      .then(() => { setConnected(true); })
      .catch(() => { setConnected(false); });

    return () => { conn.stop(); };
  }, [user?.id]); // ← Only rebuilt when user changes, NOT on conversation change

  /* ── Join/leave conversation groups when activeConv changes ── */
  useEffect(() => {
    const hub  = hubRef.current;
    const conv = activeConv;
    if (!hub || !conv) return;

    const joinWhenReady = async () => {
      // Wait until connected (in case this runs during startup)
      if (hub.state !== signalR.HubConnectionState.Connected) return;
      await hub.invoke("JoinConversation", conv.id).catch(() => {});
      await hub.invoke("MarkRead", conv.id).catch(() => {});
      // Tell the Navbar to immediately clear its unread badge
      signalNavbarChatRead();
    };

    joinWhenReady();

    return () => {
      if (hub.state === signalR.HubConnectionState.Connected) {
        hub.invoke("LeaveConversation", conv.id).catch(() => {});
      }
    };
  }, [activeConv?.id]);  // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Select a conversation ── */
  const openConversation = useCallback(async (conv: Conversation) => {
    setActiveConv(conv);
    setMessages([]);
    setLoadingMsgs(true);
    setMobileView("chat");

    // Immediately clear unread count in sidebar
    setConversations(prev =>
      prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
    );

    // Also tell Navbar to reset its badge
    signalNavbarChatRead();

    try {
      const { data } = await api.get<ChatMessage[]>(`/Chat/conversations/${conv.id}/messages`);
      setMessages(data);
    } catch { /* silently fail */ }
    finally  { setLoadingMsgs(false); }
  }, []);

  /* ── Scroll to bottom when messages change ── */
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Send message with optimistic UI ── */
  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || !activeConv || !user) return;

    setDraft("");

    // Add optimistic message immediately so it appears without waiting for server
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id:             optimisticId,
      conversationId: activeConv.id,
      senderId:       user.id,
      senderName:     user.name,
      content,
      sentAt:         new Date().toISOString(),
      isRead:         false,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const hub = hubRef.current;
      if (hub?.state === signalR.HubConnectionState.Connected) {
        await hub.invoke("SendMessage", activeConv.id, content);
        // Server will broadcast ReceiveMessage which replaces the optimistic entry
      } else {
        // Hub not connected — remove optimistic and restore draft
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        setDraft(content);
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      setDraft(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ── Render ── */
  if (!user) return null;

  return (
    <div className="chat-page">
      {/* ── Conversation Sidebar ── */}
      <aside className={`chat-sidebar ${mobileView === "chat" ? "chat-sidebar--hidden" : ""}`}>
        <div className="chat-sidebar-header">
          <h2 className="chat-sidebar-title">
            <MessageCircle size={20} />
            Messages
          </h2>
          {!connected && <Loader2 size={16} className="chat-spinner" title="Connecting…" />}
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
            {conversations.map(conv => (
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
                    <span className="chat-conv-preview">
                      {conv.lastMessage
                        ? (conv.lastMessage.senderId === user.id ? "You: " : "") + conv.lastMessage.content
                        : conv.subject}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="chat-conv-badge">{conv.unreadCount}</span>
                    )}
                  </div>
                  <span className="chat-conv-subject">{conv.subject}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* ── Chat Panel ── */}
      <main className={`chat-panel ${mobileView === "list" ? "chat-panel--hidden" : ""}`}>
        {!activeConv ? (
          <div className="chat-empty-state chat-empty-main">
            <div className="chat-empty-icon">
              <MessageCircle size={40} />
            </div>
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the left to start chatting.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="chat-panel-header">
              <button
                className="chat-back-btn"
                onClick={() => setMobileView("list")}
                aria-label="Back to conversations"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="chat-panel-avatar">
                {activeConv.otherUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="chat-panel-name">{activeConv.otherUser.name}</div>
                <div className="chat-panel-subject">{activeConv.subject}</div>
              </div>
              {connected && <span className="chat-online-dot" title="Connected" />}
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
                  const isMine = msg.senderId === user.id;
                  const isOptimistic = msg.id.startsWith("opt-");
                  const showAvatar =
                    idx === 0 || messages[idx - 1].senderId !== msg.senderId;
                  return (
                    <div
                      key={msg.id}
                      className={`chat-msg-row ${isMine ? "chat-msg-row--mine" : ""}`}
                      style={{ opacity: isOptimistic ? 0.7 : 1 }}
                    >
                      {!isMine && (
                        <div
                          className="chat-msg-avatar"
                          style={{ visibility: showAvatar ? "visible" : "hidden" }}
                        >
                          {msg.senderName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="chat-msg-bubble-wrap">
                        {showAvatar && !isMine && (
                          <span className="chat-msg-sender">{msg.senderName}</span>
                        )}
                        <div className={`chat-msg-bubble ${isMine ? "chat-msg-bubble--mine" : ""}`}>
                          {msg.content}
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

            {/* Input */}
            <div className="chat-input-bar">
              <textarea
                ref={inputRef}
                className="chat-input"
                placeholder="Type a message… (Enter to send)"
                value={draft}
                rows={1}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="chat-send-btn"
                onClick={sendMessage}
                disabled={!draft.trim()}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
