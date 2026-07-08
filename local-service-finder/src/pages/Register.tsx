import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, User, AlertCircle, UserCheck, Briefcase, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"Customer" | "Provider">("Customer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data || "Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  const roleOptions: { value: "Customer" | "Provider"; icon: React.ReactNode; title: string; desc: string }[] = [
    { value: "Customer", icon: <UserCheck size={20} />, title: "Customer", desc: "Browse & book services" },
    { value: "Provider", icon: <Briefcase size={20} />, title: "Provider", desc: "Offer your services" },
  ];

  return (
    <div className="login-page">

      {/* ── Ambient background orbs ── */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      {/* ── Top-left brand mark ── */}
      <Link to="/" className="login-brand">
        <div className="login-brand-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span>LocalFinder</span>
      </Link>

      {/* ── Main content ── */}
      <div className="login-layout">

        {/* Left — editorial copy */}
        <div className="login-copy anim-fade">
          <div className="login-eyebrow">Get started for free</div>
          <h1 className="login-headline">
            Join <span className="login-headline-accent">LocalFinder</span><br />
            today.
          </h1>
          <p className="login-sub">
            Whether you need help around the house, or want to grow your service business — we've got you covered.
          </p>


        </div>

        {/* Right — register card */}
        <div className="login-card-wrap anim-fade" style={{ animationDelay: ".1s", opacity: 0 }}>
          <div className="login-card" style={{ padding: "36px 40px" }}>

            {/* Card header */}
            <div className="login-card-header" style={{ marginBottom: 24 }}>
              <p className="login-card-eyebrow">Sign up</p>
              <h2 className="login-card-title" style={{ fontSize: 26 }}>Create account</h2>
              <p className="login-card-sub">
                Already have one?{" "}
                <Link to="/login" className="login-link">Sign in →</Link>
              </p>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 20 }}>
                <AlertCircle size={17} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            {/* Role selector */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {roleOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  style={{
                    background: role === opt.value ? "rgba(108,99,255,.12)" : "rgba(255,255,255,.02)",
                    border: `1px solid ${role === opt.value ? "rgba(108,99,255,.4)" : "rgba(255,255,255,.06)"}`,
                    borderRadius: 12, padding: "12px 10px", cursor: "pointer", transition: "all .2s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4, font: "inherit"
                  }}
                >
                  <span style={{ color: role === opt.value ? "var(--accent)" : "var(--text-faint)" }}>
                    {opt.icon}
                  </span>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{opt.title}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: 11, textAlign: "center", lineHeight: 1.2 }}>{opt.desc}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Name */}
              <div className="login-field">
                <label className="login-label">Full name</label>
                <div className="form-input-icon-wrap">
                  <User size={17} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="login-field">
                <label className="login-label">Email address</label>
                <div className="form-input-icon-wrap">
                  <Mail size={17} className="input-icon" />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password — with eye toggle */}
              <div className="login-field">
                <label className="login-label">Password</label>
                <div className="form-input-icon-wrap">
                  <Lock size={17} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    style={{ paddingRight: 44 }}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="login-eye-btn"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary login-submit"
                style={{ marginTop: 4 }}
                disabled={loading}
              >
                {loading
                  ? <><span className="login-spinner" /> Registering…</>
                  : `Create ${role} Account →`
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}