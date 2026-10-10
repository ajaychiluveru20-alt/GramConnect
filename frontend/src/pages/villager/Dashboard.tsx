import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getComplaints } from "../../services/complaintService";
import { API_BASE_URL, getAuthHeaders } from "../../services/api";

type Complaint = {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string | null;
  status: string;
  createdAt: string;
};

const STATUS_OPTIONS = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

const cellStyle: CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #ddd",
};

export default function Dashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedStatuses, setSelectedStatuses] = useState<
    Record<number, string>
  >({});
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function loadComplaints() {
    setLoading(true);
    setError("");

    try {
      const data: Complaint[] = await getComplaints();
      setComplaints(data);

      setSelectedStatuses(
        Object.fromEntries(
          data.map((complaint) => [
            complaint.id,
            complaint.status,
          ])
        )
      );
    } catch {
      setError("Complaints load avvaledu. Backend check cheyyi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadComplaints();
  }, []);

  async function updateStatus(id: number) {
    const status = selectedStatuses[id];
    if (!status) return;

    setUpdatingId(id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/complaints/${id}/status`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Status update failed");
      }

      const updated: Complaint = await response.json();

      setComplaints((previous) =>
        previous.map((complaint) =>
          complaint.id === id ? updated : complaint
        )
      );

      setSelectedStatuses((previous) => ({
        ...previous,
        [id]: updated.status,
      }));

      setMessage(
        `Complaint #${id} status updated to ${updated.status.replaceAll("_", " ")}.`
      );
    } catch {
      setError("Status update avvaledu. Backend check cheyyi.");
    } finally {
      setUpdatingId(null);
    }
  }

  const countByStatus = (status: string) =>
    complaints.filter(
      (complaint) => complaint.status === status
    ).length;

  const cards = [
    { title: "Total Complaints", count: complaints.length, color: "#2563eb" },
    { title: "Pending", count: countByStatus("PENDING"), color: "#d97706" },
    { title: "Assigned", count: countByStatus("ASSIGNED"), color: "#7c3aed" },
    { title: "In Progress", count: countByStatus("IN_PROGRESS"), color: "#0891b2" },
    { title: "Resolved", count: countByStatus("RESOLVED"), color: "#16a34a" },
    { title: "Closed", count: countByStatus("CLOSED"), color: "#64748b" },
  ];

  const search = searchTerm.trim().toLowerCase();

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch =
      String(complaint.id).includes(search) ||
      complaint.title.toLowerCase().includes(search) ||
      complaint.category.toLowerCase().includes(search) ||
      (complaint.location ?? "").toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "ALL" ||
      complaint.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <main style={{ padding: 24 }}>Loading dashboard...</main>;
  }

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "30px auto",
        padding: 24,
      }}
    >
      <h1>GramConnect Admin Dashboard</h1>
      <p>Village complaints overview</p>

      <button
        type="button"
        onClick={() => void loadComplaints()}
        style={{
          padding: "10px 16px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Refresh Complaints
      </button>

      {error && (
        <p role="alert" style={{ color: "#b91c1c" }}>
          {error}
        </p>
      )}

      {message && (
        <p role="status" style={{ color: "#15803d" }}>
          {message}
        </p>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 16,
          margin: "24px 0",
        }}
      >
        {cards.map((card) => (
          <article
            key={card.title}
            style={{
              padding: 20,
              border: "1px solid #ddd",
              borderTop: `4px solid ${card.color}`,
              borderRadius: 10,
              background: "white",
            }}
          >
            <p>{card.title}</p>
            <h2 style={{ color: card.color, fontSize: 32, margin: 0 }}>
              {card.count}
            </h2>
          </article>
        ))}
      </section>

      <h2>All Complaints</h2>

      {/* Search bar, status filter and clear button */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <input
          type="text"
          aria-label="Search complaints"
          placeholder="Search ID, title, category, location..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          style={{
            padding: 12,
            flex: "1 1 250px",
            minWidth: 200,
            border: "1px solid #ccc",
            borderRadius: 6,
            fontSize: 14,
          }}
        />

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          style={{
            padding: 12,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        >
          <option value="ALL">All Statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => {
            setSearchTerm("");
            setStatusFilter("ALL");
          }}
          style={{
            padding: "10px 16px",
            border: "1px solid #ccc",
            borderRadius: 6,
            background: "#f3f4f6",
            cursor: "pointer",
          }}
        >
          Clear Filters
        </button>
      </div>

      <p>
        Showing {filteredComplaints.length} of {complaints.length} complaints
      </p>

      {filteredComplaints.length === 0 ? (
        <p>
          {complaints.length === 0
            ? "No complaints available."
            : "No matching complaints found. Try another search."}
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 750,
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={cellStyle}>ID</th>
                <th style={cellStyle}>Title</th>
                <th style={cellStyle}>Category</th>
                <th style={cellStyle}>Location</th>
                <th style={cellStyle}>Current Status</th>
                <th style={cellStyle}>Change Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredComplaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td style={cellStyle}>{complaint.id}</td>
                  <td style={cellStyle}>{complaint.title}</td>
                  <td style={cellStyle}>{complaint.category}</td>
                  <td style={cellStyle}>
                    {complaint.location || "Not provided"}
                  </td>
                  <td style={cellStyle}>
                    {complaint.status.replaceAll("_", " ")}
                  </td>
                  <td style={cellStyle}>
                    <select
                      aria-label={`Status for complaint ${complaint.id}`}
                      value={
                        selectedStatuses[complaint.id] ?? complaint.status
                      }
                      disabled={updatingId === complaint.id}
                      onChange={(event) =>
                        setSelectedStatuses((previous) => ({
                          ...previous,
                          [complaint.id]: event.target.value,
                        }))
                      }
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={
                        updatingId === complaint.id ||
                        (selectedStatuses[complaint.id] ?? complaint.status) ===
                          complaint.status
                      }
                      onClick={() => void updateStatus(complaint.id)}
                      style={{
                        marginLeft: 8,
                        padding: "7px 10px",
                        cursor: "pointer",
                      }}
                    >
                      {updatingId === complaint.id ? "Updating..." : "Update"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
