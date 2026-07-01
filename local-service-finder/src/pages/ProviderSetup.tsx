import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Settings, Briefcase, Phone,
  AlignLeft, Upload, Globe, MapPin, Home
} from "lucide-react";

// ── Ethiopian cities list ──
const ETHIOPIAN_CITIES = [
  "Addis Ababa", "Dire Dawa", "Mekelle", "Gondar", "Bahir Dar",
  "Hawassa", "Adama (Nazret)", "Dessie", "Jimma", "Jijiga",
  "Shashamane", "Bishoftu (Debre Zeit)", "Sodo", "Arba Minch",
  "Hosaena", "Harar", "Dilla", "Nekemte", "Asella", "Axum",
];

// ── Country list (Ethiopia first, then alphabetical) ──
const COUNTRIES = [
  "Ethiopia",
  "Afghanistan", "Albania", "Algeria", "Angola", "Argentina", "Australia",
  "Austria", "Bahrain", "Bangladesh", "Belgium", "Brazil", "Canada",
  "China", "Colombia", "Croatia", "Czech Republic", "Denmark", "Djibouti",
  "Egypt", "Eritrea", "Finland", "France", "Germany", "Ghana", "Greece",
  "Hungary", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Ivory Coast", "Japan", "Jordan", "Kenya", "Kuwait",
  "Lebanon", "Libya", "Malaysia", "Mali", "Mexico", "Morocco",
  "Netherlands", "New Zealand", "Nigeria", "Norway", "Oman",
  "Pakistan", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Rwanda", "Saudi Arabia", "Senegal",
  "Singapore", "Somalia", "South Africa", "South Korea", "South Sudan",
  "Spain", "Sudan", "Sweden", "Switzerland", "Syria", "Tanzania",
  "Thailand", "Tunisia", "Turkey", "UAE", "Uganda", "UK",
  "Ukraine", "USA", "Vietnam", "Yemen", "Zimbabwe",
];

export default function ProviderSetup() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [loading, setLoading]   = useState(false);

  // ── Profile fields ──
  const [bio, setBio]                 = useState("");
  const [country, setCountry]         = useState("Ethiopia");
  const [city, setCity]               = useState("");
  const [specificAddress, setSpecificAddress] = useState("");
  const [phone, setPhone]             = useState("");

  // ── Profile picture upload ──
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && user.role !== "Provider") navigate("/dashboard");
  }, [user, navigate]);

  // Convert file to base64 for sending to API
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2 MB.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const location = [specificAddress, city, country].filter(Boolean).join(", ");
    // Use base64 data URL as the profile image (or empty)
    const profileImage = imagePreview || "";
    try {
      await api.post("/Providers", { bio, location, phone, profileImage });
      navigate("/providers");
    } catch (err: any) {
      if (err.response?.data?.includes?.("already exists")) {
        navigate("/providers");
      } else {
        alert(err.response?.data || "Failed to save profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap">
      <div className="container" style={{ maxWidth:760 }}>

        {/* ── Header ── */}
        <div style={{ textAlign:"center", marginBottom:48 }} className="anim-fade">
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:64, height:64, borderRadius:20, background:"linear-gradient(135deg,var(--accent),var(--accent-2))", marginBottom:20, boxShadow:"0 0 40px rgba(108,99,255,.4)" }}>
            <Briefcase size={28} color="#fff"/>
          </div>
          <h1 style={{ fontSize:36, fontWeight:800, marginBottom:12 }}>Provider Setup</h1>
          <p>Complete your profile to start receiving bookings.</p>
        </div>

        {/* ── Profile Form ── */}
        <div className="card card-pad anim-fade">
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,var(--accent),var(--accent-2))", borderRadius:"14px 14px 0 0" }} />
          <h2 style={{ fontSize:22, marginBottom:28, display:"flex", alignItems:"center", gap:10 }}>
            <Settings size={22} color="var(--accent)"/> Your Provider Profile
          </h2>

          <form onSubmit={handleProfile}>

            {/* ── Profile Picture Upload ── */}
            <div className="form-group" style={{ marginBottom:28 }}>
              <label className="form-label"><Upload size={13}/> Profile Photo</label>
              <div style={{ display:"flex", alignItems:"center", gap:20 }}>
                {/* Avatar preview */}
                <div
                  style={{
                    width:88, height:88, borderRadius:"50%", flexShrink:0,
                    background: imagePreview ? "none" : "linear-gradient(135deg,var(--accent),var(--accent-2))",
                    border:"3px solid rgba(108,99,255,.3)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    overflow:"hidden", cursor:"pointer", transition:"border-color .2s"
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to upload photo"
                >
                  {imagePreview
                    ? <img src={imagePreview} alt="Preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <Upload size={26} color="rgba(255,255,255,.7)" />
                  }
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-ghost"
                    style={{ padding:"8px 18px", fontSize:13, marginBottom:8 }}
                  >
                    {imageFile ? "Change photo" : "Choose from PC"}
                  </button>
                  {imageFile && (
                    <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:4 }}>
                      ✓ {imageFile.name}
                    </div>
                  )}
                  <p style={{ fontSize:12, color:"var(--text-faint)", lineHeight:1.5, margin:0 }}>
                    JPG, PNG or WebP · Max 2 MB
                  </p>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(""); }}
                      style={{ background:"none", border:"none", color:"var(--red)", fontSize:12, cursor:"pointer", padding:0, marginTop:4 }}
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display:"none" }}
                onChange={handleImageChange}
              />
            </div>

            {/* ── Bio ── */}
            <div className="form-group">
              <label className="form-label"><AlignLeft size={13}/> Bio / About you</label>
              <textarea
                className="form-input" rows={4}
                placeholder="Tell customers about your skills and experience…"
                value={bio} onChange={e => setBio(e.target.value)}
                required style={{ resize:"vertical" }}
              />
            </div>

            {/* ── Location: Country + City + Specific Address ── */}
            <div className="form-group">
              <label className="form-label"><MapPin size={13}/> Location</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                {/* Country */}
                <div style={{ position:"relative" }}>
                  <Globe size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text-faint)", pointerEvents:"none", zIndex:1 }} />
                  <select
                    className="form-input"
                    style={{ paddingLeft:36, appearance:"none", cursor:"pointer" }}
                    value={country}
                    onChange={e => {
                      setCountry(e.target.value);
                      setCity(""); // reset city when country changes
                    }}
                    required
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {/* City — dropdown for Ethiopia, free text otherwise */}
                {country === "Ethiopia" ? (
                  <div style={{ position:"relative" }}>
                    <MapPin size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text-faint)", pointerEvents:"none", zIndex:1 }} />
                    <select
                      className="form-input"
                      style={{ paddingLeft:36, appearance:"none", cursor:"pointer" }}
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      required
                    >
                      <option value="">Select city…</option>
                      {ETHIOPIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                ) : (
                  <div style={{ position:"relative" }}>
                    <MapPin size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text-faint)", pointerEvents:"none", zIndex:1 }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft:36 }}
                      placeholder="City / Town"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>
              {/* Specific address */}
              <div style={{ position:"relative" }}>
                <Home size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text-faint)", pointerEvents:"none" }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft:36 }}
                  placeholder="Specific address (e.g. Bole Road, near Edna Mall)"
                  value={specificAddress}
                  onChange={e => setSpecificAddress(e.target.value)}
                />
              </div>
            </div>

            {/* ── Phone ── */}
            <div className="form-group">
              <label className="form-label"><Phone size={13}/> Phone number</label>
              <div style={{ position:"relative" }}>
                <Phone size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text-faint)", pointerEvents:"none" }} />
                <input
                  type="tel"
                  className="form-input"
                  style={{ paddingLeft:36 }}
                  placeholder="+251 91 234 5678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width:"100%", padding:14, fontSize:15, marginTop:8 }}
              disabled={loading}
            >
              {loading
                ? <span style={{ display:"flex", gap:8, alignItems:"center" }}><span style={{ width:16, height:16, borderRadius:"50%", border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", animation:"spin-slow .7s linear infinite", display:"inline-block" }} /> Saving…</span>
                : "Save Profile & Finish"
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
