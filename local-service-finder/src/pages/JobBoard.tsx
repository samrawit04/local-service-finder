import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Briefcase, Search, MapPin, DollarSign, Clock, Users,
  PlusCircle, X, AlertCircle, ChevronRight, Loader,
  Inbox
} from "lucide-react";

const CATEGORIES = [
  "All", "Plumbing", "Electrical", "Cleaning", "Carpentry",
  "Painting", "Tutoring", "Delivery", "IT & Tech", "Other"
];

interface JobCard {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  location: string;
  status: string;
  createdAt: string;
  customerName: string;
  applicationCount: number;
}

export default function JobBoard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);

  // Post job form
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (catFilter !== "All") params.category = catFilter;
      if (search) params.search = search;
      const res = await api.get("/JobPosts", { params });
      setJobs(res.data);
    } catch {
      // keep previous
    } finally {
      setLoading(false);
    }
  }, [catFilter, search]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    setPostError("");
    try {
      await api.post("/JobPosts", { title, description, category, budget, location });
      setTitle(""); setDesc(""); setCategory(""); setBudget(""); setLocation("");
      setShowForm(false);
      loadJobs();
    } catch (err: any) {
      setPostError(err.response?.data || "Failed to post job.");
    } finally {
      setPosting(false);
    }
  };

  const timeAgo = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const isCustomer = user?.role === "Customer";

  return (
    <div className="page-wrap">
      <div className="container">

        {/* ── Page header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 36 }} className="anim-fade">
          <div>
            <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
              Job Board
            </p>
            <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-1px", marginBottom: 8 }}>
              Find Jobs &amp; Post Work
            </h1>
            <p style={{ color: "var(--text-muted)" }}>
              {isCustomer
                ? "Post a job and get applications from verified providers."
                : "Browse open jobs and apply directly."
              }
            </p>
          </div>
          {isCustomer && (
            <button
              className="btn btn-primary"
              style={{ padding: "12px 22px", fontSize: 14 }}
              onClick={() => setShowForm(prev => !prev)}
            >
              {showForm
                ? <><X size={16} /> Cancel</>
                : <><PlusCircle size={16} /> Post a Job</>
              }
            </button>
          )}
        </div>

        {/* ── Post Job inline form (customer only) ── */}
        {showForm && isCustomer && (
          <div className="card card-pad anim-fade" style={{ marginBottom: 32 }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,var(--accent),var(--accent-2))", borderRadius: "14px 14px 0 0" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 22, display: "flex", alignItems: "center", gap: 9 }}>
              <Briefcase size={20} color="var(--accent)" /> Post a New Job
            </h2>
            {postError && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} /> {postError}
              </div>
            )}
            <form onSubmit={handlePost} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Job title *</label>
                <input className="form-input" placeholder="e.g. Need a plumber for pipe repair" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Description *</label>
                <textarea className="form-input" rows={3} placeholder="Describe the work you need done, any requirements, timeframe…" value={description} onChange={e => setDesc(e.target.value)} required style={{ resize: "vertical" }} />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-input" value={category} onChange={e => setCategory(e.target.value)} required style={{ appearance: "none", cursor: "pointer" }}>
                  <option value="">Select category…</option>
                  {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Budget</label>
                <input className="form-input" placeholder="e.g. 500 ETB, Negotiable" value={budget} onChange={e => setBudget(e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="e.g. Bole, Addis Ababa" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              <div style={{ gridColumn: "1/-1", display: "flex", gap: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ padding: "12px 28px" }} disabled={posting}>
                  {posting ? <><span className="login-spinner" /> Posting…</> : "Post Job →"}
                </button>
                <button type="button" className="btn btn-ghost" style={{ padding: "12px 20px" }} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* ── Search + Category filters ── */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 28 }} className="anim-fade">
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)", pointerEvents: "none" }} />
            <input
              className="form-input"
              style={{ paddingLeft: 40 }}
              placeholder="Search jobs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                style={{
                  padding: "7px 16px", borderRadius: 20, border: "1px solid",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", font: "inherit",
                  transition: "all .15s",
                  borderColor: catFilter === c ? "var(--accent)" : "var(--border)",
                  background: catFilter === c ? "rgba(108,99,255,.15)" : "transparent",
                  color: catFilter === c ? "#fff" : "var(--text-muted)"
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ── Job cards grid ── */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
            <Loader size={28} style={{ color: "var(--accent)", animation: "spin-slow .8s linear infinite" }} />
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <Inbox size={52} color="var(--text-faint)" style={{ marginBottom: 16 }} />
            <p style={{ color: "var(--text-muted)", fontSize: 16 }}>No jobs found. {isCustomer && "Be the first to post one!"}</p>
          </div>
        ) : (
          <div className="job-list">
            {jobs.map((job, i) => (
              <div key={job.id}>
                <Link
                  to={`/jobs/${job.id}`}
                  className="job-card anim-fade"
                  style={{ animationDelay: `${i * 0.04}s`, textDecoration: "none", display: "block", padding: "16px 0" }}
                >
                  {/* Status dot */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <span className="badge badge-accent" style={{ fontSize: 11 }}>{job.category}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                      background: job.status === "Open" ? "rgba(16,185,129,.12)" : "rgba(255,255,255,.04)",
                      color: job.status === "Open" ? "var(--green)" : "var(--text-faint)",
                      border: `1px solid ${job.status === "Open" ? "rgba(16,185,129,.3)" : "var(--border)"}`
                    }}>
                      {job.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 8, lineHeight: 1.3 }}>{job.title}</h3>
                  <p style={{
                    color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6, marginBottom: 16,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
                  }}>
                    {job.description}
                  </p>

                  {/* Meta */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {job.budget && (
                      <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--accent)", fontSize: 12, fontWeight: 700 }}>
                        <DollarSign size={12} /> {job.budget}
                      </span>
                    )}
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-faint)", fontSize: 12 }}>
                      <MapPin size={12} /> {job.location || "Remote/Flexible"}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-faint)", fontSize: 12 }}>
                      <Users size={12} /> {job.applicationCount} applied
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-faint)", fontSize: 12 }}>
                      <Clock size={12} /> {timeAgo(job.createdAt)}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--text-faint)", fontSize: 12 }}>by {job.customerName}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--accent)", fontSize: 13, fontWeight: 600 }}>
                      View details <ChevronRight size={14} />
                    </span>
                  </div>
                </Link>
                {i < jobs.length - 1 && (
                  <hr style={{ border: 0, borderBottom: "1px solid rgba(255, 255, 255, 0.08)", margin: "8px 0" }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
