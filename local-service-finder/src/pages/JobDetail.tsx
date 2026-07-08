import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  MapPin, Users, ArrowLeft, CheckCircle, XCircle,
  AlertCircle, Phone, FileText, Loader, Paperclip, Star
} from "lucide-react";

interface Application {
  id: string;
  coverNote: string;
  cvUrl?: string;
  status: string;
  appliedAt: string;
  providerId: string;
  providerName: string;
  providerPhone: string;
  providerLocation: string;
  providerBio: string;
}

interface JobDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  location: string;
  status: string;
  createdAt: string;
  customerId: string;
  customerName: string;
  applications: Application[];
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUrl, setCvUrl] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverStar, setHoverStar] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const res = await api.get(`/JobPosts/${id}`);
      setJob(res.data);
    } catch {
      setError("Job not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const isOwner = user?.id === job?.customerId;
  const isProvider = user?.role === "Provider";

  // Check if this provider already applied
  // const myApp = job?.applications.find(
  //   a => a.providerName === user?.name // best proxy we have on frontend
  // );

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setApplyError("CV file must be under 5 MB.");
      return;
    }
    setCvFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCvUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverNote.trim()) return;
    setApplying(true);
    setApplyError("");
    try {
      await api.post(`/JobPosts/${id}/apply`, { coverNote, cvUrl: cvUrl || undefined });
      setApplySuccess("Application submitted! The customer will review it.");
      setCoverNote("");
      setCvFile(null);
      setCvUrl("");
      load();
    } catch (err: any) {
      setApplyError(err.response?.data || "Failed to apply.");
    } finally {
      setApplying(false);
    }
  };

  const handleAccept = async (appId: string) => {
    setActionLoading(appId + "-accept");
    try {
      await api.put(`/JobPosts/${id}/applications/${appId}/accept`);
      load();
    } catch {
      alert("Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (appId: string) => {
    setActionLoading(appId + "-reject");
    try { await api.put(`/JobPosts/${id}/applications/${appId}/reject`); load(); }
    catch { alert("Failed to reject application."); }
    finally { setActionLoading(null); }
  };

  const handleComplete = async (appId: string) => {
    setActionLoading(appId + "-complete");
    try { await api.put(`/JobPosts/${id}/applications/${appId}/complete`); load(); }
    catch { alert("Failed to mark application as completed."); }
    finally { setActionLoading(null); }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/Reviews", { jobPostId: id, rating, comment });
      setReviewingId(null);
      setComment("");
      setRating(5);
      alert("Review submitted! Thank you.");
    } catch (err: any) {
      alert(err.response?.data || "Failed to submit review.");
    }
  };

  const statusColors: Record<string, string> = {
    Open: "var(--green)",
    Closed: "var(--text-faint)",
    Pending: "var(--teal)",
    Accepted: "var(--green)",
    Rejected: "var(--red)",
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric"
  });

  if (loading) return (
    <div className="page-wrap" style={{ display: "flex", justifyContent: "center", paddingTop: 120 }}>
      <Loader size={32} className="spin" style={{ color: "var(--accent)" }} />
    </div>
  );

  if (error || !job) return (
    <div className="page-wrap" style={{ textAlign: "center", paddingTop: 120 }}>
      <AlertCircle size={48} color="var(--red)" style={{ marginBottom: 16 }} />
      <p style={{ color: "var(--text-muted)" }}>{error || "Job not found."}</p>
      <button className="btn btn-ghost" onClick={() => navigate("/jobs")} style={{ marginTop: 16 }}>
        ← Back to Job Board
      </button>
    </div>
  );

  return (
    <div className="page-wrap">
      <div className="container" style={{ maxWidth: 860 }}>

        {/* Back link */}
        <button
          onClick={() => navigate("/jobs")}
          className="btn btn-ghost"
          style={{ padding: "8px 14px", marginBottom: 28, fontSize: 13 }}
        >
          <ArrowLeft size={15} /> Back to Job Board
        </button>

        {/* ── Job header ── */}
        <div className="card card-pad anim-fade" style={{ marginBottom: 24 }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, var(--accent), var(--teal))`, borderRadius: "14px 14px 0 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span className="badge badge-accent" style={{ fontSize: 11 }}>{job.category}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                  background: job.status === "Open" ? "rgba(16,185,129,.12)" : "rgba(255,255,255,.05)",
                  color: statusColors[job.status],
                  border: `1px solid ${statusColors[job.status]}33`
                }}>
                  {job.status}
                </span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{job.title}</h1>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                Posted by <strong style={{ color: "#fff" }}>{job.customerName}</strong> · {fmt(job.createdAt)}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: "var(--accent)" }}>{job.budget || "Negotiable"}</div>
              <div style={{ color: "var(--text-faint)", fontSize: 12, marginTop: 2 }}>Budget</div>
            </div>
          </div>

          {/* Meta row */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13 }}>
              <MapPin size={14} /> {job.location}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13 }}>
              <Users size={14} /> {job.applications.length} applicant{job.applications.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Description */}
          <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
            <p style={{ lineHeight: 1.7, color: "var(--text-muted)", whiteSpace: "pre-wrap", margin: 0 }}>{job.description}</p>
          </div>
        </div>

        {/* ── Provider: Apply form ── */}
        {isProvider && job.status === "Open" && (
          <div className="card card-pad anim-fade" style={{ marginBottom: 24, animationDelay: ".05s" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={18} color="var(--accent)" /> Apply for this Job
            </h2>
            {applySuccess ? (
              <div className="alert alert-success">
                <CheckCircle size={16} style={{ flexShrink: 0 }} /> {applySuccess}
              </div>
            ) : (
              <form onSubmit={handleApply} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {applyError && (
                  <div className="alert alert-error"><AlertCircle size={15} style={{ flexShrink: 0 }} /> {applyError}</div>
                )}
                <div>
                  <label className="form-label">Cover note</label>
                  <textarea
                    className="form-input" rows={4}
                    placeholder="Introduce yourself and explain why you're a great fit for this job…"
                    value={coverNote}
                    onChange={e => setCoverNote(e.target.value)}
                    required style={{ resize: "vertical" }}
                  />
                </div>

                {/* CV Upload */}
                <div>
                  <label className="form-label"><Paperclip size={13} /> CV / Resume (optional)</label>
                  <div
                    style={{
                      border: "1px dashed var(--border)",
                      borderRadius: 10,
                      padding: "14px 16px",
                      background: "rgba(255,255,255,.02)",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      cursor: "pointer"
                    }}
                    onClick={() => cvInputRef.current?.click()}
                  >
                    <Paperclip size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
                    {cvFile ? (
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        ✓ <strong style={{ color: "#fff" }}>{cvFile.name}</strong>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setCvFile(null); setCvUrl(""); }}
                          style={{ background: "none", border: "none", color: "var(--red)", fontSize: 12, cursor: "pointer", marginLeft: 10 }}
                        >
                          Remove
                        </button>
                      </span>
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--text-faint)" }}>Click to attach PDF, DOC or DOCX · Max 5 MB</span>
                    )}
                  </div>
                  <input
                    ref={cvInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    style={{ display: "none" }}
                    onChange={handleCvChange}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "12px 24px", alignSelf: "flex-start" }}
                  disabled={applying}
                >
                  {applying
                    ? <><span className="login-spinner" /> Submitting…</>
                    : "Submit Application →"
                  }
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── Customer: Applications list ── */}
        {isOwner && (
          <div className="anim-fade" style={{ animationDelay: ".07s" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              Applications ({job.applications.length})
            </h2>

            {job.applications.length === 0 ? (
              <div className="card card-pad" style={{ textAlign: "center", padding: 48 }}>
                <Users size={36} color="var(--text-faint)" style={{ marginBottom: 12 }} />
                <p style={{ color: "var(--text-muted)" }}>No applications yet. Share this job to get more visibility!</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {job.applications.map(app => (
                  <div key={app.id} className="card card-pad" style={{ padding: "22px 24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                          background: "linear-gradient(135deg,var(--accent),var(--teal))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 16, fontWeight: 800, color: "#fff"
                        }}>
                          {app.providerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: "#fff", margin: 0, fontSize: 15 }}>{app.providerName}</p>
                          <p style={{ color: "var(--text-faint)", fontSize: 12, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                            <MapPin size={11} /> {app.providerLocation}
                            {app.providerPhone && <> · <Phone size={11} /> {app.providerPhone}</>}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
                          background: app.status === "Accepted" ? "rgba(16,185,129,.12)" : app.status === "Rejected" ? "rgba(244,63,94,.1)" : "rgba(34,211,238,.1)",
                          color: statusColors[app.status],
                          border: `1px solid ${statusColors[app.status]}44`
                        }}>
                          {app.status}
                        </span>
                        <span style={{ color: "var(--text-faint)", fontSize: 11 }}>{fmt(app.appliedAt)}</span>
                      </div>
                    </div>

                    {/* Cover note */}
                    <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                      <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{app.coverNote}</p>
                    </div>

                    {/* Bio */}
                    {app.providerBio && (
                      <p style={{ color: "var(--text-faint)", fontSize: 12, marginBottom: 12, fontStyle: "italic" }}>"{app.providerBio}"</p>
                    )}

                    {/* CV link */}
                    {app.cvUrl && (
                      <div style={{ marginBottom: 12 }}>
                        <a
                          href={app.cvUrl}
                          download={`CV-${app.providerName}.pdf`}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            fontSize: 12, fontWeight: 600,
                            color: "var(--accent)",
                            textDecoration: "none",
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1px solid rgba(108,99,255,.3)",
                            background: "rgba(108,99,255,.08)"
                          }}
                        >
                          <Paperclip size={13} /> View / Download CV
                        </a>
                      </div>
                    )}

                    {/* Actions — only if job is open and app is pending */}
                    {job.status === "Open" && app.status === "Pending" && (
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={() => handleAccept(app.id)}
                          className="btn btn-primary"
                          style={{ padding: "8px 20px", fontSize: 13 }}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === app.id + "-accept"
                            ? <span className="login-spinner" />
                            : <><CheckCircle size={14} /> Accept</>
                          }
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          className="btn btn-ghost"
                          style={{ padding: "8px 20px", fontSize: 13, color: "var(--red)" }}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === app.id + "-reject"
                            ? <span className="login-spinner" />
                            : <><XCircle size={14} /> Reject</>
                          }
                        </button>
                      </div>
                    )}

                    {/* Completion & Review Actions */}
                    {job.status === "Closed" && app.status === "Accepted" && (
                      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                        <button
                          onClick={() => handleComplete(app.id)}
                          className="btn btn-primary"
                          style={{ padding: "8px 20px", fontSize: 13 }}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === app.id + "-complete"
                            ? <span className="login-spinner" />
                            : <><CheckCircle size={14} /> Mark Completed</>
                          }
                        </button>
                      </div>
                    )}

                    {job.status === "Closed" && app.status === "Completed" && (
                      <div style={{ marginTop: 10 }}>
                        <button
                          className="btn btn-ghost"
                          style={{ gap: 6, padding: "8px 20px", fontSize: 13 }}
                          onClick={() => setReviewingId(reviewingId === app.id ? null : app.id)}
                        >
                          <Star size={14} /> Leave Review
                        </button>
                      </div>
                    )}

                    {/* Review Form */}
                    {reviewingId === app.id && (
                      <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border)", animation: "fadeIn .3s ease" }}>
                        <h4 style={{ fontSize: 16, marginBottom: 16 }}>How was the work?</h4>
                        <form onSubmit={e => handleReview(e)}>
                          <div className="form-group">
                            <label className="form-label">Rating</label>
                            <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                              {[1, 2, 3, 4, 5].map(n => (
                                <Star
                                  key={n}
                                  className="star"
                                  size={28}
                                  fill={(hoverStar || rating) >= n ? "#f59e0b" : "none"}
                                  color={(hoverStar || rating) >= n ? "#f59e0b" : "var(--text-faint)"}
                                  onMouseEnter={() => setHoverStar(n)}
                                  onMouseLeave={() => setHoverStar(0)}
                                  onClick={() => setRating(n)}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Comment</label>
                            <textarea
                              className="form-input"
                              rows={3}
                              placeholder="Share your experience…"
                              value={comment}
                              onChange={e => setComment(e.target.value)}
                              required
                              style={{ resize: "vertical" }}
                            />
                          </div>
                          <div style={{ display: "flex", gap: 10 }}>
                            <button type="submit" className="btn btn-primary"><CheckCircle size={15} /> Submit</button>
                            <button type="button" className="btn btn-ghost" onClick={() => setReviewingId(null)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
