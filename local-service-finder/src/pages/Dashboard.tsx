import { useEffect, useState } from "react";
import api from "../services/api";
import type { Booking } from "../types";
import { useAuth } from "../context/AuthContext";
import { CalendarClock, Check, X, Star, MessageSquare, TrendingUp, ArrowRight, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const [customerBookings, setCustomer] = useState<Booking[]>([]);
  const [providerBookings, setProvider] = useState<Booking[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [myJobPosts, setMyJobPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverStar, setHoverStar] = useState(0);

  useEffect(() => { fetchDashboardData(); }, [user]);

  useEffect(() => {
    if (user && !tab) {
      setTab(user.role === "Customer" ? "requests" : "incoming");
    }
  }, [user, tab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [bookRes, appRes, postRes] = await Promise.all([
        api.get("/Bookings/my"),
        user?.role === "Provider" ? api.get("/JobPosts/my-applications") : Promise.resolve({ data: [] }),
        user?.role === "Customer" ? api.get("/JobPosts/my-posts") : Promise.resolve({ data: [] })
      ]);
      setCustomer(bookRes.data.asCustomer || []);
      setProvider(bookRes.data.asProvider || []);
      setMyApplications(appRes.data || []);
      setMyJobPosts(postRes.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleStatus = async (id: string, status: string) => {
    try { await api.put(`/Bookings/${id}/status`, { status }); fetchDashboardData(); }
    catch { alert("Failed to update booking."); }
  };

  const handleReview = async (e: React.FormEvent, bookingId: string) => {
    e.preventDefault();
    try {
      await api.post("/Reviews", { bookingId, rating, comment });
      setReviewingId(null);
      setComment("");
      setRating(5);
      alert("Review submitted! Thank you.");
    } catch (err: any) {
      alert(err.response?.data || "Failed to submit review.");
    }
  };

  const statusStyle = (s: string): [string, string] => {
    if (s === "Accepted") return ["badge badge-green", s];
    if (s === "Rejected") return ["badge badge-red", s];
    if (s === "Completed") return ["badge badge-accent", s];
    return ["badge badge-gold", s];
  };

  const stats = user?.role === "Provider" ? [
    { icon: <CalendarClock size={20} />, label: "Total Bookings", value: providerBookings.length },
    { icon: <TrendingUp size={20} />, label: "Active Bookings", value: providerBookings.filter(b => b.status === "Accepted").length },
    { icon: <Briefcase size={20} />, label: "Job Applications", value: myApplications.length },
  ] : [
    { icon: <CalendarClock size={20} />, label: "Total Bookings", value: customerBookings.length },
    { icon: <Briefcase size={20} />, label: "Job Posts", value: myJobPosts.length },
    { icon: <Check size={20} />, label: "Accepted Bookings", value: customerBookings.filter(b => b.status === "Accepted").length },
  ];

  if (loading) return (
    <div className="page-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid rgba(108,99,255,.2)", borderTopColor: "var(--accent)", animation: "spin-slow .8s linear infinite", margin: "0 auto 16px" }} />
        <p>Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="page-wrap">
      <div className="container">

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
          <div className="anim-fade">
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
              Welcome back 👋
            </p>
            <h1 style={{ fontSize: 36, fontWeight: 800 }}>Dashboard</h1>
            <p style={{ marginTop: 8 }}>Manage your bookings and track your service history.</p>
          </div>
          {user?.role === "Provider" && (
            <Link to="/profile" className="btn btn-ghost" style={{ gap: 8 }}>
              My Services <ArrowRight size={15} />
            </Link>
          )}
        </div>

        {/* ── Stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 40 }}>
          {stats.map((s, i) => (
            <div key={i} className={`card card-pad anim-fade anim-delay${i + 1}`}
              style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(108,99,255,.12)", border: "1px solid rgba(108,99,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{ marginBottom: 28 }}>
          <div className="tabs">
            {user?.role === "Provider" ? (
              <>
                <button className={`tab${tab === "incoming" ? " active" : ""}`} onClick={() => setTab("incoming")}>
                  Incoming Requests
                </button>
                <button className={`tab${tab === "requests" ? " active" : ""}`} onClick={() => setTab("requests")}>
                  My Bookings
                </button>
                <button className={`tab${tab === "applications" ? " active" : ""}`} onClick={() => setTab("applications")}>
                  Job Applications
                </button>
              </>
            ) : (
              <>
                <button className={`tab${tab === "requests" ? " active" : ""}`} onClick={() => setTab("requests")}>
                  My Bookings
                </button>
                <button className={`tab${tab === "posts" ? " active" : ""}`} onClick={() => setTab("posts")}>
                  My Job Posts
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── My Requests ── */}
        {tab === "requests" && (
          <section style={{ marginBottom: 48 }}>
            <h2 className="section-heading">
              <span className="section-icon"><CalendarClock size={20} /></span>
              {user?.role === "Provider" ? "Bookings I Made" : "My Service Requests"}
            </h2>
            {customerBookings.length === 0 ? (
              <div className="card card-pad" style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <p>You haven't booked any services yet.</p>
                <Link to="/providers" className="btn btn-primary" style={{ marginTop: 20, display: "inline-flex" }}>
                  Browse Providers
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {customerBookings.map((b, i) => (
                  <div key={b.id} className={`card card-pad anim-fade anim-delay${Math.min(i + 1, 4)}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <h3 style={{ fontSize: 17, margin: 0 }}>{b.service?.title}</h3>
                          <span className={statusStyle(b.status)[0]}>{statusStyle(b.status)[1]}</span>
                        </div>
                        <p style={{ fontSize: 14, margin: "0 0 4px" }}>
                          Provider: <span style={{ color: "#fff", fontWeight: 500 }}>{b.provider?.user?.name}</span>
                        </p>
                        <p style={{ fontSize: 13, margin: 0, color: "var(--text-faint)" }}>
                          Scheduled: {new Date(b.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        {b.status === "Accepted" && (
                          <button className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => handleStatus(b.id, "Completed")}>
                            <Check size={14} /> Mark Completed
                          </button>
                        )}
                        {b.status === "Completed" && (
                          <button className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: 13, gap: 6 }} onClick={() => setReviewingId(reviewingId === b.id ? null : b.id)}>
                            <Star size={14} /> Leave Review
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Review form */}
                    {reviewingId === b.id && (
                      <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border)", animation: "fadeIn .3s ease" }}>
                        <h4 style={{ fontSize: 16, marginBottom: 16 }}>How was the service?</h4>
                        <form onSubmit={e => handleReview(e, b.id)}>
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
                            <button type="submit" className="btn btn-primary"><MessageSquare size={15} /> Submit</button>
                            <button type="button" className="btn btn-ghost" onClick={() => setReviewingId(null)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Customer: My Job Posts ── */}
        {user?.role === "Customer" && tab === "posts" && (
          <section style={{ marginBottom: 48 }}>
            <h2 className="section-heading">
              <span className="section-icon"><Briefcase size={20} /></span> My Job Posts
            </h2>
            {myJobPosts.length === 0 ? (
              <div className="card card-pad" style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
                <p>You haven't posted any jobs yet.</p>
                <Link to="/jobs" className="btn btn-primary" style={{ marginTop: 20, display: "inline-flex" }}>
                  Post a Job
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {myJobPosts.map((post: any, i: number) => (
                  <div key={post.id} className={`card card-pad anim-fade anim-delay${Math.min(i + 1, 4)}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <h3 style={{ fontSize: 17, margin: 0 }}>
                            <Link to={`/jobs/${post.id}`} style={{ color: "#fff", textDecoration: "none" }}>
                              {post.title}
                            </Link>
                          </h3>
                          <span className={statusStyle(post.status)[0]}>{statusStyle(post.status)[1]}</span>
                        </div>
                        <p style={{ fontSize: 14, margin: "0 0 4px", color: "var(--text-muted)" }}>
                          Category: <span style={{ color: "#fff" }}>{post.category}</span>
                        </p>
                        <p style={{ fontSize: 13, margin: 0, color: "var(--text-faint)" }}>
                          Posted: {new Date(post.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: 14 }}>
                          {post.applicationCount} Applicants
                        </div>
                        <Link to={`/jobs/${post.id}`} className="btn btn-ghost" style={{ marginTop: 8, padding: "6px 12px", fontSize: 12 }}>
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Provider: Incoming ── */}
        {user?.role === "Provider" && tab === "incoming" && (
          <section>
            <h2 className="section-heading">
              <span className="section-icon"><CalendarClock size={20} /></span> Incoming Booking Requests
            </h2>
            {providerBookings.length === 0 ? (
              <div className="card card-pad" style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
                <p>No bookings yet. Make sure your services are listed.</p>
                <Link to="/profile" className="btn btn-primary" style={{ marginTop: 20, display: "inline-flex" }}>
                  Add Services
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {providerBookings.map((b, i) => (
                  <div key={b.id} className={`card card-pad anim-fade anim-delay${Math.min(i + 1, 4)}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <h3 style={{ fontSize: 17, margin: 0 }}>{b.service?.title}</h3>
                          <span className={statusStyle(b.status)[0]}>{statusStyle(b.status)[1]}</span>
                        </div>
                        <p style={{ fontSize: 14, margin: "0 0 4px" }}>
                          Customer: <span style={{ color: "#fff", fontWeight: 500 }}>{b.customer?.name}</span>
                        </p>
                        <p style={{ fontSize: 13, margin: 0, color: "var(--text-faint)" }}>
                          Requested: {new Date(b.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      {b.status === "Pending" && (
                        <div style={{ display: "flex", gap: 10 }}>
                          <button className="btn btn-success" onClick={() => handleStatus(b.id, "Accepted")}>
                            <Check size={15} /> Accept
                          </button>
                          <button className="btn btn-danger" onClick={() => handleStatus(b.id, "Rejected")}>
                            <X size={15} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Provider: My Applications ── */}
        {user?.role === "Provider" && tab === "applications" && (
          <section>
            <h2 className="section-heading">
              <span className="section-icon"><Briefcase size={20} /></span> My Job Applications
            </h2>
            {myApplications.length === 0 ? (
              <div className="card card-pad" style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💼</div>
                <p>You haven't applied to any jobs yet.</p>
                <Link to="/jobs" className="btn btn-primary" style={{ marginTop: 20, display: "inline-flex" }}>
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {myApplications.map((app, i) => (
                  <div key={app.id} className={`card card-pad anim-fade anim-delay${Math.min(i + 1, 4)}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <h3 style={{ fontSize: 17, margin: 0 }}>
                            <Link to={`/jobs/${app.job.id}`} style={{ color: "#fff", textDecoration: "none" }}>
                              {app.job.title}
                            </Link>
                          </h3>
                          <span className={statusStyle(app.status)[0]}>{statusStyle(app.status)[1]}</span>
                        </div>
                        <p style={{ fontSize: 14, margin: "0 0 4px" }}>
                          Customer: <span style={{ color: "#fff", fontWeight: 500 }}>{app.job.customerName}</span>
                        </p>
                        <p style={{ fontSize: 13, margin: 0, color: "var(--text-faint)" }}>
                          Applied: {new Date(app.appliedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className="badge badge-accent" style={{ fontSize: 11, background: "rgba(108,99,255,.15)" }}>
                          {app.job.category}
                        </span>
                        {app.job.budget && (
                          <div style={{ color: "#22d3ee", fontWeight: 700, fontSize: 14, marginTop: 8 }}>
                            ${app.job.budget}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
