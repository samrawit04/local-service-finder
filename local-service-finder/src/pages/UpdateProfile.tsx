import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  User, Mail, Lock, Eye, EyeOff, Upload, Save, CheckCircle,
  AlertCircle, Briefcase, PlusCircle, Tag, AlignLeft, Trash2
} from "lucide-react";

const CATEGORIES = [
  "Plumbing", "Electrical", "Cleaning", "Carpentry",
  "Painting", "Tutoring", "Delivery", "IT & Tech", "Other"
];

interface ServiceItem {
  id: string;
  title: string;
  category: string;
  description: string;
}

export default function UpdateProfile() {
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [name, setName]                   = useState(user?.name || "");
  const [email, setEmail]                 = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]     = useState("");
  const [showCurrent, setShowCurrent]     = useState(false);
  const [showNew, setShowNew]             = useState(false);
  const [imageFile, setImageFile]         = useState<File | null>(null);
  const [imagePreview, setImagePreview]   = useState<string>("");
  
  // Profile loading states
  const [loading, setLoading]             = useState(false);
  const [success, setSuccess]             = useState("");
  const [error, setError]                 = useState("");
  const fileInputRef                      = useRef<HTMLInputElement>(null);

  // Services states
  const [services, setServices]           = useState<ServiceItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [sTitle, setSTitle]               = useState("");
  const [sCat, setSCat]                   = useState("");
  const [sDesc, setSDesc]                 = useState("");
  const [addingService, setAddingService] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role === "Provider") {
      fetchMyServices();
    } else {
      setServicesLoading(false);
    }
  }, [user]);

  const fetchMyServices = async () => {
    try {
      const res = await api.get("/Services/my");
      setServices(res.data);
    } catch {
      // ignore
    } finally {
      setServicesLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2 MB.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const payload: any = { name, email };
      if (imagePreview) payload.profileImageBase64 = imagePreview;
      if (newPassword && currentPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      await api.put("/Auth/profile", payload);
      setSuccess("Profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setError(err.response?.data || "Update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingService(true);
    try {
      const res = await api.post("/Services", { title: sTitle, category: sCat, description: sDesc });
      setServices(prev => [...prev, res.data]);
      setSTitle(""); setSCat(""); setSDesc("");
    } catch (err: any) {
      alert(err.response?.data || "Failed to add service.");
    } finally {
      setAddingService(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await api.delete(`/Services/${id}`);
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert("Failed to delete service.");
    }
  };

  const avatarBg = imagePreview
    ? "none"
    : `linear-gradient(135deg, ${user?.role === "Provider" ? "#22d3ee, #6C63FF" : "#6C63FF, #A259FF"})`;

  const initials = (user?.name || "U")
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="page-wrap">
      <div className="container" style={{ maxWidth: 640 }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }} className="anim-fade">
          <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }}>
            Account Settings
          </p>
          <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1px", marginBottom: 8 }}>Update Profile</h1>
          <p style={{ color: "var(--text-muted)" }}>Change your name, email, photo, or password.</p>
        </div>

        {/* Alerts */}
        {success && (
          <div className="alert alert-success anim-fade" style={{ marginBottom: 24 }}>
            <CheckCircle size={17} style={{ flexShrink: 0 }} /> {success}
          </div>
        )}
        {error && (
          <div className="alert alert-error anim-fade" style={{ marginBottom: 24 }}>
            <AlertCircle size={17} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        <div className="card card-pad anim-fade" style={{ animationDelay: ".05s", marginBottom: 32 }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,var(--accent),var(--accent-2))", borderRadius: "14px 14px 0 0" }} />

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* ── Avatar ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div
                style={{
                  width: 96, height: 96, borderRadius: "50%",
                  background: avatarBg,
                  border: "3px solid rgba(108,99,255,.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", cursor: "pointer", flexShrink: 0,
                  fontSize: 26, fontWeight: 800, color: "#fff"
                }}
                onClick={() => fileInputRef.current?.click()}
                title="Click to change photo"
              >
                {imagePreview
                  ? <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : initials
                }
              </div>
              <div>
                <p style={{ color: "#fff", fontWeight: 600, marginBottom: 4 }}>{user?.name}</p>
                <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 10 }}>{user?.email}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-ghost"
                  style={{ padding: "7px 16px", fontSize: 13 }}
                >
                  <Upload size={14} /> {imageFile ? "Change photo" : "Upload photo"}
                </button>
                {imageFile && (
                  <>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 10 }}>✓ {imageFile.name}</span>
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(""); }}
                      style={{ background: "none", border: "none", color: "var(--red)", fontSize: 12, cursor: "pointer", marginLeft: 10 }}
                    >Remove</button>
                  </>
                )}
                <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6, margin: 0 }}>JPG, PNG or WebP · Max 2 MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handleImageChange}
              />
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

            {/* ── Name ── */}
            <div>
              <label className="form-label"><User size={13} /> Full name</label>
              <div className="form-input-icon-wrap">
                <User size={17} className="input-icon" />
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            {/* ── Email ── */}
            <div>
              <label className="form-label"><Mail size={13} /> Email address</label>
              <div className="form-input-icon-wrap">
                <Mail size={17} className="input-icon" />
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

            {/* ── Change Password (optional) ── */}
            <div>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Change Password <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span></p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="form-label"><Lock size={13} /> Current password</label>
                  <div className="form-input-icon-wrap">
                    <Lock size={17} className="input-icon" />
                    <input
                      type={showCurrent ? "text" : "password"}
                      className="form-input"
                      style={{ paddingRight: 44 }}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="login-eye-btn">
                      {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="form-label"><Lock size={13} /> New password</label>
                  <div className="form-input-icon-wrap">
                    <Lock size={17} className="input-icon" />
                    <input
                      type={showNew ? "text" : "password"}
                      className="form-input"
                      style={{ paddingRight: 44 }}
                      placeholder="Min. 8 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      minLength={newPassword ? 8 : undefined}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="login-eye-btn">
                      {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: 14, fontSize: 15 }}
              disabled={loading}
            >
              {loading
                ? <><span className="login-spinner" /> Saving changes…</>
                : <><Save size={17} /> Save Changes</>
              }
            </button>

          </form>
        </div>

        {/* ── Services Section (Providers Only) ── */}
        {user?.role === "Provider" && (
          <div className="card card-pad anim-fade" style={{ animationDelay: ".1s" }}>
            <h2 style={{ fontSize: 20, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
              <Briefcase size={20} color="var(--accent)" /> My Services
            </h2>

            {servicesLoading ? (
              <p style={{ color: "var(--text-muted)" }}>Loading services...</p>
            ) : (
              <>
                {services.length > 0 && (
                  <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
                    {services.map((s, i) => (
                      <div key={i} style={{ padding: "16px", borderRadius: 12, background: "rgba(255,255,255,.03)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <h4 style={{ fontSize: 15, margin: 0 }}>{s.title}</h4>
                            <span className="badge badge-accent" style={{ fontSize: 11 }}>{s.category}</span>
                          </div>
                          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.description}</p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: 8, color: "var(--red)" }}
                          onClick={() => handleDeleteService(s.id)}
                          title="Delete service"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ padding: 20, borderRadius: 12, border: "1px dashed var(--border)", background: "rgba(255,255,255,.01)" }}>
                  <h3 style={{ fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                    <PlusCircle size={15} color="var(--accent)" /> Add a New Service
                  </h3>
                  <form onSubmit={handleAddService} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div>
                        <label className="form-label"><Briefcase size={12} /> Service title</label>
                        <input className="form-input" placeholder="e.g. Expert Plumbing Repair" value={sTitle} onChange={e => setSTitle(e.target.value)} required />
                      </div>
                      <div>
                        <label className="form-label"><Tag size={12} /> Category</label>
                        <select className="form-input" value={sCat} onChange={e => setSCat(e.target.value)} required style={{ appearance: "none", cursor: "pointer" }}>
                          <option value="">Select category…</option>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="form-label"><AlignLeft size={12} /> Description</label>
                      <textarea className="form-input" rows={2} placeholder="What exactly do you do?" value={sDesc} onChange={e => setSDesc(e.target.value)} required style={{ resize: "vertical" }} />
                    </div>
                    <button type="submit" className="btn btn-ghost" style={{ alignSelf: "flex-start", padding: "10px 20px" }} disabled={addingService}>
                      {addingService ? "Adding…" : "Add Service"}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
