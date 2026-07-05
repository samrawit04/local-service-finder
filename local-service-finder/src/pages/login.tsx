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
      navigate("/dashboard");
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


          </div>
        </div>
      </div>
    </div>
  );
}