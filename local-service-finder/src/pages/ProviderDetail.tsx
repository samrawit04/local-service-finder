import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import type { Provider, Review } from "../types";
import { MapPin, Phone, Star, User, Calendar, CheckCircle, ArrowLeft, Tag, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ProviderDetail() {
  const { id }        = useParams<{ id: string }>();
  const navigate      = useNavigate();
  const { user }      = useAuth();

  const [provider, setProvider]         = useState<Provider | null>(null);
  const [reviews, setReviews]           = useState<Review[]>([]);
  const [loading, setLoading]           = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [bookingDate, setBookingDate]   = useState("");

  useEffect(() => { fetchProvider(); fetchReviews(); }, [id]);

  const fetchProvider = async () => {
    try {
      const res = await api.get(`/Providers/${id}`);
      setProvider(res.data);
      if (res.data.services?.length) setSelectedService(res.data.services[0].id);
    } catch { navigate("/providers"); }
    finally   { setLoading(false); }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/Reviews/${id}`);
      setReviews(res.data);
    } catch { /* silent */ }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (user.role !== "Customer") { alert("Only customers can book services."); return; }
    setBookingLoading(true);
    try {
      await api.post("/Bookings", { serviceId: selectedService, date: bookingDate });
      setBookingSuccess(true);
    } catch (err: any) {
      alert(err.response?.data || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) return (
    <div className="page-wrap" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:48, height:48, borderRadius:"50%", border:"3px solid rgba(108,99,255,.2)", borderTopColor:"var(--accent)", animation:"spin-slow .8s linear infinite", margin:"0 auto 16px" }} />
        <p>Loading provider…</p>
      </div>
    </div>
  );

  if (!provider) return null;

  return (
    <div className="page-wrap">
      <div className="container">

        {/* Back link */}
        <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ marginBottom:32, gap:8, padding:"8px 16px" }}>
          <ArrowLeft size={16}/> Back to results
        </button>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:36, alignItems:"start" }} className="grid-2">

          {/* ── LEFT ── */}
          <div>
            {/* Profile hero card */}
            <div className="card" style={{ marginBottom:24, overflow:"hidden" }}>
              {/* Gradient banner */}
              <div style={{ height:110, background:"linear-gradient(135deg, rgba(108,99,255,.35), rgba(162,89,255,.25))", position:"relative" }}>
                <div style={{ position:"absolute", inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236C63FF' fill-opacity='0.08'%3E%3Ccircle cx='30' cy='30' r='28'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
              </div>

              <div className="card-pad" style={{ paddingTop:0, marginTop:-48 }}>
                <div style={{ display:"flex", gap:20, alignItems:"flex-end", marginBottom:20 }}>
                  <img
                    src={provider.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.user?.name||"P")}&background=6C63FF&color=fff&bold=true&size=120`}
                    alt={provider.user?.name}
                    style={{ width:96, height:96, borderRadius:20, objectFit:"cover", border:"3px solid #0e1220", boxShadow:"0 8px 32px rgba(0,0,0,.5)", flexShrink:0 }}
                  />
                  <div style={{ paddingBottom:8 }}>
                    <h1 style={{ fontSize:28, marginBottom:6 }}>{provider.user?.name}</h1>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:12, color:"var(--text-muted)", fontSize:14 }}>
                      {provider.location && <span style={{ display:"flex", alignItems:"center", gap:5 }}><MapPin size={14}/> {provider.location}</span>}
                      {provider.phone    && <span style={{ display:"flex", alignItems:"center", gap:5 }}><Phone size={14}/>  {provider.phone}</span>}
                    </div>
                  </div>
                </div>

                {avgRating && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                    <div style={{ display:"flex", gap:2, color:"var(--gold)" }}>
                      {[...Array(5)].map((_,i) => (
                        <Star key={i} size={16} fill={i < Math.round(+avgRating) ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <span style={{ fontWeight:700, color:"#fff" }}>{avgRating}</span>
                    <span style={{ color:"var(--text-muted)", fontSize:13 }}>({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
                  </div>
                )}

                <p style={{ lineHeight:1.7 }}>{provider.bio || "No bio provided."}</p>
              </div>
            </div>

            {/* Services */}
            <div style={{ marginBottom:36 }}>
              <h2 className="section-heading">
                <span className="section-icon"><Tag size={20}/></span> Services Offered
              </h2>
              {(!provider.services || provider.services.length === 0) ? (
                <p>No services listed yet.</p>
              ) : (
                <div style={{ display:"grid", gap:14 }}>
                  {provider.services.map(svc => (
                    <div key={svc.id} className="card card-pad" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                      <div>
                        <h3 style={{ fontSize:17, marginBottom:6 }}>{svc.title}</h3>
                        <p style={{ fontSize:14, margin:0 }}>{svc.description}</p>
                      </div>
                      <span className="badge badge-accent">{svc.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div>
              <h2 className="section-heading">
                <span className="section-icon"><MessageSquare size={20}/></span>
                Customer Reviews
                {reviews.length > 0 && <span className="badge badge-gold" style={{ fontSize:13 }}>{avgRating} ★</span>}
              </h2>
              {reviews.length === 0 ? (
                <p>No reviews yet — be the first!</p>
              ) : (
                <div style={{ display:"grid", gap:14 }}>
                  {reviews.map((rev, i) => (
                    <div key={rev.id} className={`card card-pad anim-fade anim-delay${Math.min(i+1,4)}`}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,var(--accent),var(--accent-2))", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <User size={18} color="#fff"/>
                          </div>
                          <div>
                            <div style={{ fontWeight:600, color:"#fff", fontSize:14 }}>{rev.customer?.name || "Anonymous"}</div>
                            <div style={{ fontSize:12, color:"var(--text-muted)" }}>
                              {new Date(rev.createdAt).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
                            </div>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:2, color:"var(--gold)" }}>
                          {[...Array(5)].map((_,j) => (
                            <Star key={j} size={14} fill={j < rev.rating ? "currentColor" : "none"} color={j < rev.rating ? "currentColor" : "var(--text-faint)"} />
                          ))}
                        </div>
                      </div>
                      <p style={{ margin:0, fontSize:14 }}>{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Booking widget ── */}
          <div style={{ position:"sticky", top:90 }}>
            <div className="card card-pad" style={{ background:"var(--surface-2)" }}>
              {/* Glowing top bar */}
              <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,var(--teal),var(--accent))", borderRadius:"14px 14px 0 0" }} />

              <h3 style={{ fontSize:20, marginBottom:6, display:"flex", alignItems:"center", gap:8 }}>
                <Calendar size={20} color="var(--accent)"/> Request a Booking
              </h3>
              <p style={{ fontSize:14, marginBottom:24 }}>
                Submit a request — the provider will confirm it shortly.
              </p>

              {bookingSuccess ? (
                <div style={{ textAlign:"center", padding:"32px 0" }} className="anim-fade">
                  <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(16,185,129,.15)", border:"2px solid rgba(16,185,129,.4)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                    <CheckCircle size={32} color="var(--green)"/>
                  </div>
                  <h4 style={{ fontSize:20, marginBottom:8 }}>Booking Requested! 🎉</h4>
                  <p style={{ fontSize:14 }}>The provider will review and confirm your request soon.</p>
                  <button className="btn btn-ghost" style={{ marginTop:20 }} onClick={() => setBookingSuccess(false)}>Book another</button>
                </div>
              ) : (
                <form onSubmit={handleBook}>
                  <div className="form-group">
                    <label className="form-label">Service</label>
                    <select className="form-input" value={selectedService} onChange={e => setSelectedService(e.target.value)} required>
                      {provider.services?.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom:28 }}>
                    <label className="form-label">Preferred date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={bookingDate}
                      onChange={e => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width:"100%", padding:14, fontSize:15 }}
                    disabled={bookingLoading || !provider.services?.length}
                  >
                    {bookingLoading
                      ? <span style={{ display:"flex", gap:8, alignItems:"center" }}><span style={{ width:16, height:16, borderRadius:"50%", border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", animation:"spin-slow .7s linear infinite", display:"inline-block" }} /> Sending…</span>
                      : "Request Booking →"
                    }
                  </button>

                  {!user && <p style={{ fontSize:12, textAlign:"center", marginTop:12, color:"var(--text-muted)" }}>You'll be asked to log in.</p>}
                  {!provider.services?.length && <p style={{ fontSize:12, textAlign:"center", marginTop:12, color:"var(--text-muted)" }}>This provider has no services listed yet.</p>}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
