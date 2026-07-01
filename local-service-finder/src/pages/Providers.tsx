import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import type { Provider } from "../types";
import { MapPin, Search, ArrowRight, Zap, Star, Users, Calendar, Award } from "lucide-react";

export default function Providers() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => { fetchProviders(); }, []);

    const fetchProviders = async (search = "") => {
        setLoading(true);
        try {
            const res = await api.get(`/Providers${search ? `?search=${search}` : ""}`);
            setProviders(res.data);
        } catch { /* empty */ }
        finally { setLoading(false); }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProviders(searchQuery);
    };

    return (
        <div className="page-wrap" style={{ paddingTop: 0 }}>
            {/* ── Full Width Hero Section ── */}
            <div className="hero-bg-section anim-fade" style={{ borderRadius: 0, margin: "0 0 40px 0", borderLeft: "none", borderRight: "none", borderTop: "none" }}>
                <div className="container">
                    <div className="hero-section" style={{ padding: "120px 28px 80px" }}>
                        <div className="hero-pill">
                            <Zap size={14} /> LocalFinder - አሰሪና ሰራተኛ አገናኝ!
                        </div>
                        <h1 className="hero-title">
                            Find the right person<br />
                            <span className="grad-text">for the job.</span>
                        </h1>
                        <p className="hero-sub" style={{ margin: "0 0 44px" }}>
                            Verified plumbers, electricians, cleaners, tutors and more — all across Ethiopia.
                            Book easily, pay fairly, and leave an honest review.
                        </p>

                        {/* Search bar */}
                        <form onSubmit={handleSearch} className="search-bar">
                            <div className="form-input-icon-wrap" style={{ flex: 1 }}>
                                <Search size={18} className="input-icon" />
                                <input
                                    id="universal-search"
                                    type="text"
                                    className="form-input"
                                    placeholder="Search by provider, service, or city..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
                                Search
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="container">

                {/* ── Stats strip ── */}
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 48,
                    margin: "48px auto 64px",
                    flexWrap: "wrap",
                }}>
                    {[
                        { icon: <Users size={20} />, value: "500+", label: "Verified Providers" },
                        { icon: <Calendar size={20} />, value: "10k+", label: "Jobs Completed" },
                        { icon: <Star size={20} />, value: "4.8★", label: "Average Rating" },
                        { icon: <Award size={20} />, value: "24hrs", label: "Avg. Response Time" },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className={`anim-fade anim-delay${i + 1}`}
                            style={{ textAlign: "center", minWidth: 120 }}
                        >
                            <div style={{ color: "var(--accent)", marginBottom: 6, display: "flex", justifyContent: "center" }}>
                                {stat.icon}
                            </div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                                {stat.value}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 5, fontWeight: 500 }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Section label ── */}
                <div style={{ marginBottom: 28 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                        {searchQuery ? `Results for "${searchQuery}"` : "All Providers"}
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                        {providers.length > 0
                            ? `${providers.length} service provider${providers.length !== 1 ? "s" : ""} found`
                            : "No providers found for this search"}
                    </p>
                </div>

                {/* ── Provider Grid ── */}
                {loading ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 24 }}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="card card-pad skeleton" style={{ height: 230, opacity: .5 }} />
                        ))}
                    </div>
                ) : providers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 0" }}>
                        <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
                        <h3 style={{ marginBottom: 8, color: "#fff" }}>No providers found</h3>
                        <p style={{ marginBottom: 24 }}>
                            Try a different search term, or clear the search to see everyone.
                        </p>
                        <button
                            className="btn btn-ghost"
                            onClick={() => { setSearchQuery(""); fetchProviders(""); }}
                        >
                            Show all providers
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 24 }}>
                        {providers.map((provider, idx) => (
                            <Link
                                to={`/providers/${provider.id}`}
                                key={provider.id}
                                style={{ textDecoration: "none", display: "block" }}
                                className={`anim-fade anim-delay${Math.min(idx % 4 + 1, 4)}`}
                            >
                                <div className="card card-pad" style={{ height: "100%", cursor: "pointer" }}>
                                    {/* Top gradient accent bar */}
                                    <div style={{
                                        position: "absolute", top: 0, left: 0, right: 0, height: 3,
                                        background: "linear-gradient(90deg,var(--accent),var(--accent-2))",
                                        borderRadius: "14px 14px 0 0"
                                    }} />

                                    {/* Header row */}
                                    <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
                                        <img
                                            src={provider.profileImage
                                                || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.user?.name || "P")}&background=6C63FF&color=fff&bold=true&size=128`}
                                            alt={provider.user?.name}
                                            className="provider-card-img"
                                        />
                                        <div>
                                            <h3 style={{ margin: "0 0 4px", fontSize: 17, color: "#fff" }}>
                                                {provider.user?.name}
                                            </h3>
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)", fontSize: 13 }}>
                                                <MapPin size={13} />
                                                {provider.location || "Location not specified"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bio — short excerpt */}
                                    <p style={{
                                        fontSize: 13, marginBottom: 16, color: "var(--text-muted)", lineHeight: 1.65,
                                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
                                    }}>
                                        {provider.bio || "This provider hasn't added a bio yet."}
                                    </p>

                                    {/* Service category tags */}
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                                        {provider.services?.slice(0, 3).map(s => (
                                            <span key={s.id} className="badge badge-accent">{s.category}</span>
                                        ))}
                                        {(provider.services?.length ?? 0) > 3 && (
                                            <span className="badge" style={{
                                                background: "rgba(255,255,255,.05)",
                                                color: "var(--text-muted)",
                                                border: "1px solid var(--border)"
                                            }}>
                                                +{provider.services!.length - 3} more
                                            </span>
                                        )}
                                    </div>

                                    {/* Footer — rating + CTA */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--gold)", fontSize: 13, fontWeight: 600 }}>
                                            <Star size={14} fill="currentColor" />
                                            <span>Top Rated</span>
                                        </div>
                                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>
                                            View Profile <ArrowRight size={14} />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
