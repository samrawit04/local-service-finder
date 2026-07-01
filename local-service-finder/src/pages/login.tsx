import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const { login }                       = useAuth();
  const navigate                        = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/providers");
    } catch (err: any) {
      setError(err.response?.data || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span>LocalFinder</span>
      </Link>

      {/* ── Main content ── */}
      <div className="login-layout">

        {/* Left — editorial copy */}
        <div className="login-copy anim-fade">
          <div className="login-eyebrow">Trusted in Ethiopia</div>
          <h1 className="login-headline">
            Find the right<br />
            <span className="login-headline-accent">professional,</span><br />
            faster.
          </h1>
          <p className="login-sub">
            Thousands of verified plumbers, electricians, tutors and cleaners — all one tap away.
          </p>

          {/* Social proof row */}
          <div className="login-proof">
            <div className="login-avatars">
              {["AC","RT","HT","SM"].map((initials, i) => (
                <div key={i} className="login-avatar" style={{ background: ["#6C63FF","#A259FF","#22d3ee","#10b981"][i] }}>
                  {initials}
                </div>
              ))}
            </div>
            <div>
              <div className="login-proof-title">500+ verified pros</div>
              <div className="login-proof-sub">rated 4.8★ by your neighbors</div>
            </div>
          </div>
        </div>

        {/* Right — login card */}
        <div className="login-card-wrap anim-fade" style={{ animationDelay: ".1s", opacity: 0 }}>
          <div className="login-card">

            {/* Card header */}
            <div className="login-card-header">
              <p className="login-card-eyebrow">Welcome back</p>
              <h2 className="login-card-title">Sign in</h2>
              <p className="login-card-sub">
                No account yet?{" "}
                <Link to="/register" className="login-link">
                  Create one <ArrowRight size={13} style={{ display:"inline", verticalAlign:"middle" }} />
                </Link>
              </p>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 24 }}>
                <AlertCircle size={17} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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

              {/* Password */}
              <div className="login-field">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <label className="login-label" style={{ margin:0 }}>Password</label>
                  <a href="#" className="login-forgot">Forgot password?</a>
                </div>
                <div className="form-input-icon-wrap">
                  <Lock size={17} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    style={{ paddingRight: 44 }}
                    placeholder="••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
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
                disabled={loading}
              >
                {loading
                  ? <><span className="login-spinner" /> Signing in…</>
                  : <><LogIn size={17} /> Sign in</>
                }
              </button>
            </form>

            {/* Divider */}
            <div className="login-divider"><span>or continue with</span></div>

            {/* OAuth placeholders */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <button className="login-oauth-btn">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google
              </button>
              <button className="login-oauth-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}