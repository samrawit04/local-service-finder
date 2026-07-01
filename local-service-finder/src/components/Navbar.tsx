import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    LogOut, Home, Compass, LayoutDashboard,
    Settings, UserCircle, UserCog, ChevronDown, Briefcase as BriefcaseIcon
} from "lucide-react";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        navigate("/login");
        setMenuOpen(false);
    };

    const isActive = (path: string) =>
        location.pathname.startsWith(path) ? "nav-link active" : "nav-link";

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                {/* Logo */}
                <Link to={user ? "/providers" : "/"} className="nav-logo" style={{ textDecoration: "none" }}>
                    <div className="nav-logo-icon">
                        <Home size={18} color="#fff" />
                    </div>
                    <span>LocalFinder</span>
                </Link>

                {/* Right-most nav section */}
                <div className="nav-right-container">
                    <div className="nav-links">
                        <Link to="/providers" className={isActive("/providers")}>
                            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Compass size={16} /> <span className="nav-link-text">Browse</span>
                            </span>
                        </Link>
                        {user && (
                            <Link to="/jobs" className={isActive("/jobs")}>
                                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <BriefcaseIcon size={16} /> <span className="nav-link-text">Jobs</span>
                                </span>
                            </Link>
                        )}
                        {user && (
                            <Link to="/dashboard" className={isActive("/dashboard")}>
                                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <LayoutDashboard size={16} /> <span className="nav-link-text">Dashboard</span>
                                </span>
                            </Link>
                        )}

                    </div>

                    <div className="nav-auth-section">
                        {user ? (
                            /* ── Profile dropdown ── */
                            <div ref={menuRef} style={{ position: "relative" }}>
                                <button
                                    onClick={() => setMenuOpen(prev => !prev)}
                                    className="nav-profile-badge"
                                    data-role={user.role.toUpperCase()}
                                    style={{ border: "none" }}
                                >
                                    <div style={{
                                        width: "28px", height: "28px", borderRadius: "50%",
                                        background: "linear-gradient(135deg, #6C63FF, #A259FF)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0
                                    }}>
                                        <UserCircle size={18} color="#fff" />
                                    </div>
                                    <span className="nav-profile-name">{user.name}</span>
                                    <span className="nav-profile-role">{user.role.toUpperCase()}</span>
                                    <ChevronDown
                                        size={14}
                                        className="nav-profile-logout-icon"
                                        style={{ transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}
                                    />
                                </button>

                                {/* Dropdown menu */}
                                {menuOpen && (
                                    <div className="nav-dropdown">
                                        <div className="nav-dropdown-header">
                                            <p className="nav-dropdown-name">{user.name}</p>
                                            <p className="nav-dropdown-email" style={{ color: "var(--text-faint)", fontSize: 12, margin: 0 }}>
                                                {user.role}
                                            </p>
                                        </div>
                                        <div className="nav-dropdown-divider" />
                                        <Link
                                            to="/profile"
                                            className="nav-dropdown-item"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <UserCog size={15} /> Update Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="nav-dropdown-item nav-dropdown-item-danger"
                                        >
                                            <LogOut size={15} /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-ghost" style={{ padding: "8px 18px" }}>Login</Link>
                                <Link to="/register" className="btn btn-primary" style={{ padding: "8px 18px" }}>Get Started</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
