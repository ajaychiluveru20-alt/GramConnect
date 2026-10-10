import { Link } from "react-router-dom";
import { 
  Droplets, 
  Car, 
  Zap, 
  Lightbulb, 
  Trash2, 
  Waves, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  PlusCircle
} from "lucide-react";

export default function Services() {
  const serviceList = [
    {
      title: "Drinking Water & Pipeline Maintenance",
      desc: "Instant reporting for piped water shortages, borewell repairs, pipeline bursts, and water contamination alerts.",
      icon: <Droplets size={26} color="#0284c7" />,
      category: "Water Supply"
    },
    {
      title: "Road Repair & Infrastructure",
      desc: "Pothole patch requests, unpaved road grading, culvert repairs, and obstruction clearing for safe rural transport.",
      icon: <Car size={26} color="#d97706" />,
      category: "Roads"
    },
    {
      title: "Village Electricity & Power Lines",
      desc: "Transformer breakdown complaints, low-voltage problems, loose electrical wires, and public lighting repairs.",
      icon: <Zap size={26} color="#ca8a04" />,
      category: "Electricity"
    },
    {
      title: "Public Streetlight Management",
      desc: "Replacing burnt streetlights, installing new solar lights on unlit pathways, and timer maintenance.",
      icon: <Lightbulb size={26} color="#ea580c" />,
      category: "Street Lights"
    },
    {
      title: "Solid Waste & Garbage Collection",
      desc: "Waste clearing, village dumpster sanitization, organic waste compost inquiries, and cleanliness drives.",
      icon: <Trash2 size={26} color="#dc2626" />,
      category: "Garbage"
    },
    {
      title: "Storm Drainage & Sanitation",
      desc: "Unclogging open drains, mosquito breeding prevention, monsoon flood water diversion, and public toilet upkeep.",
      icon: <Waves size={26} color="#475569" />,
      category: "Drainage"
    },
  ];

  return (
    <main className="container" style={{ maxWidth: 1000 }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 36, fontWeight: 800, margin: "0 0 10px", color: "var(--navy)" }}>
          Village Public Services
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 640, margin: "0 auto" }}>
          GramConnect provides direct civic channels to register issues across all essential panchayat public utility departments.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 40 }}>
        {serviceList.map((s) => (
          <div key={s.title} className="panel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ padding: 10, background: "var(--surface-alt)", borderRadius: "var(--radius-md)" }}>
                {s.icon}
              </div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 700, margin: 0, color: "var(--navy)" }}>
                {s.title}
              </h3>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              {s.desc}
            </p>
            <div style={{ marginTop: "auto", paddingTop: 10 }}>
              <Link 
                className="btn btn-secondary btn-sm" 
                to={`/report?category=${encodeURIComponent(s.category)}`}
                style={{ width: "100%", justifyContent: "center" }}
              >
                <PlusCircle size={14} /> Report in {s.category}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ textAlign: "center", background: "var(--primary-light)", borderColor: "#bbf7d0" }}>
        <ShieldCheck size={36} color="#15803d" style={{ margin: "0 auto 12px" }} />
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: "0 0 8px", color: "var(--primary-text)" }}>
          100% Transparent Citizen Governance
        </h3>
        <p style={{ maxWidth: 600, margin: "0 auto 20px", color: "#166534", fontSize: 14 }}>
          All service requests are timestamped and open for public verification in the Complaints portal.
        </p>
        <Link className="btn btn-primary" to="/complaints">
          View Live Complaints Registry <ArrowRight size={16} />
        </Link>
      </div>
    </main>
  );
}