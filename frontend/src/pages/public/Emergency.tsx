import { PhoneCall, ShieldAlert, HeartPulse, Flame, AlertTriangle } from "lucide-react";

export default function Emergency() {
  const emergencyHelplines = [
    { title: "National Emergency Number", number: "112", desc: "All-in-one emergency helpline for Police, Fire & Medical.", icon: <ShieldAlert size={24} color="#dc2626" /> },
    { title: "Ambulance / Medical Emergency", number: "108", desc: "Toll-free emergency ambulance response.", icon: <HeartPulse size={24} color="#dc2626" /> },
    { title: "Police Control Room", number: "100", desc: "Direct emergency assistance and law enforcement.", icon: <ShieldAlert size={24} color="#1e3a8a" /> },
    { title: "Fire Station", number: "101", desc: "Fire accidents and search & rescue operations.", icon: <Flame size={24} color="#ea580c" /> },
    { title: "Women Helpline", number: "1091", desc: "24x7 safety and assistance for women.", icon: <HeartPulse size={24} color="#7e22ce" /> },
    { title: "Disaster Management Helpline", number: "1077", desc: "District emergency operation center for floods and disasters.", icon: <AlertTriangle size={24} color="#b45309" /> },
  ];

  return (
    <main className="container" style={{ maxWidth: 860 }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <span className="badge" style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", marginBottom: 12 }}>
          Emergency Contacts
        </span>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 34, fontWeight: 800, margin: "8px 0", color: "var(--navy)" }}>
          Emergency Village Helplines
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 15, maxWidth: 600, margin: "0 auto" }}>
          For life-threatening emergencies, fire, medical distress, or disaster assistance, dial these toll-free numbers immediately.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
        {emergencyHelplines.map((h) => (
          <div key={h.title} className="panel" style={{ borderLeft: "4px solid #dc2626" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ padding: 8, background: "#fee2e2", borderRadius: "var(--radius-sm)" }}>
                {h.icon}
              </div>
              <a 
                href={`tel:${h.number}`} 
                className="btn btn-sm" 
                style={{ background: "#dc2626", color: "#fff", textDecoration: "none" }}
              >
                <PhoneCall size={14} /> Call {h.number}
              </a>
            </div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 700, margin: "0 0 6px", color: "var(--navy)" }}>
              {h.title}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              {h.desc}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}