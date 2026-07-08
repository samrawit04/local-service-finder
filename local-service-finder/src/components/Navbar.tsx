import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    LogOut, Home, Compass, LayoutDashboard,
    UserCog, ChevronDown, Briefcase as BriefcaseIcon, MessageSquare
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import api from "../services/api";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [chatUnread, setChatUnread] = useState(0);
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

    // Poll unread chat count every 30s
    useEffect(() => {
        if (!user) return;
        const fetchUnread = async () => {
            try {
                const { data } = await api.get<{ count: number }>("/Chat/unread-count");
                setChatUnread(data.count);
            } catch { /* silently fail */ }
        };
        fetchUnread();
        const timer = setInterval(fetchUnread, 30_000);

        // Chat page fires this event the moment the user reads a conversation,
        // so the badge clears instantly without waiting for the next poll.
        const onChatRead = () => setChatUnread(0);
        window.addEventListener("chatUnreadReset", onChatRead);

        return () => {
            clearInterval(timer);
            window.removeEventListener("chatUnreadReset", onChatRead);
        };
    }, [user]);

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
                        {user && (
                            <Link
                                to="/chat"
                                className={isActive("/chat")}
                                onClick={() => setChatUnread(0)}
                                style={{ position: "relative" }}
                            >
                                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <MessageSquare size={16} />
                                    <span className="nav-link-text">Chat</span>
                                    {chatUnread > 0 && (
                                        <span className="notif-badge" style={{ position: "static", transform: "none" }}>
                                            {chatUnread > 99 ? "99+" : chatUnread}
                                        </span>
                                    )}
                                </span>
                            </Link>
                        )}

                    </div>

                    <div className="nav-auth-section">
                        {user ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                <NotificationBell />
                                {/* ── Profile dropdown ── */}
                                <div ref={menuRef} style={{ position: "relative" }}>
                                    <button
                                        onClick={() => setMenuOpen(prev => !prev)}
                                        className="nav-profile-badge"
                                        data-role={user.role.toUpperCase()}
                                        style={{ border: "none", gap: "6px", padding: "4px 8px 4px 4px" }}
                                        title={`${user.name} (${user.role})`}
                                    >
                                        <div style={{
                                            width: "32px", height: "32px", borderRadius: "50%",
                                            background: "linear-gradient(135deg, #6C63FF, #A259FF)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0, fontSize: "14px", fontWeight: 700, color: "#fff",
                                            letterSpacing: 0
                                        }}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
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
