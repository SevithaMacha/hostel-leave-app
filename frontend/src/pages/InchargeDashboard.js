// File: InchargeDashboard.js
// Incharge dashboard for first-level approval and leave history tracking.
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const STATUS_COLOR = {
  pending: "#f59e0b",
  pending_incharge: "#f59e0b",
  pending_warden: "#6366f1",
  approved: "#10b981",
  rejected: "#ef4444",
  cancelled: "#6b7280"
};

const STATUS_LABEL = {
  pending: "Pending Incharge",
  pending_incharge: "Pending Incharge",
  pending_warden: "Pending Warden",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled"
};

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function historyLine(item) {
  const who = item.actor?.name || item.actorRole;
  const action = item.action.replace("_", " ");
  return `${who} ${action} on ${formatDateTime(item.actedAt)}${item.comment ? ` (${item.comment})` : ""}`;
}

export default function InchargeDashboard() {
  const { user, token, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [commentMap, setCommentMap] = useState({});

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchDashboard();
    fetchLeaves();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await axios.get("/api/dashboard/incharge", { headers });
      setDashboard(res.data);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to load dashboard");
    }
  }

  async function fetchLeaves() {
    try {
      const res = await axios.get("/api/leave", { headers });
      setLeaves(res.data.leaves);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to load leaves");
    }
  }

  async function handleStatus(id, status) {
    try {
      await axios.put(
        `/api/leave/${id}/status`,
        { status, comment: commentMap[id] || "" },
        { headers }
      );
      setMessage(`Leave ${status} successfully`);
      fetchDashboard();
      fetchLeaves();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update");
    }
  }

  const filtered = filter === "all" ? leaves : leaves.filter((l) => l.status === filter);

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <span style={styles.navTitle}>Hostel Leave System</span>
        <div>
          <span style={styles.navUser}>Welcome, {user?.name} (Incharge)</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>

      <div style={styles.container}>
        <h2 style={styles.heading}>Incharge Dashboard</h2>
        <p style={styles.sub}>First-level leave approvals before warden decision.</p>

        {message && <div style={styles.msg}>{message}</div>}

        {dashboard && (
          <div style={styles.statsRow}>
            {[
              { label: "Total Students", value: dashboard.totalStudents },
              { label: "Total Leaves", value: dashboard.totalLeaves },
              { label: "Pending Incharge", value: dashboard.pendingLeaves },
              { label: "Forwarded", value: dashboard.forwardedLeaves },
              { label: "Approved", value: dashboard.approvedLeaves },
              { label: "Rejected", value: dashboard.rejectedLeaves },
              { label: "Cancelled", value: dashboard.cancelledLeaves }
            ].map((s) => (
              <div key={s.label} style={styles.statCard}>
                <div style={styles.statVal}>{s.value}</div>
                <div style={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={styles.filterRow}>
          {["all", "pending_incharge", "pending_warden", "approved", "rejected", "cancelled"].map((f) => (
            <button
              key={f}
              style={{
                ...styles.filterBtn,
                background: filter === f ? "#1a73e8" : "#e8eaed",
                color: filter === f ? "#fff" : "#333"
              }}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : STATUS_LABEL[f]}
            </button>
          ))}
        </div>

        <h3 style={styles.sectionTitle}>Leave Applications</h3>
        {filtered.length === 0 ? (
          <p style={styles.empty}>No leave applications found.</p>
        ) : (
          filtered.map((l) => (
            <div key={l._id} style={styles.leaveCard}>
              <div style={styles.cardHeader}>
                <div>
                  <strong>{l.student?.name}</strong>
                  <span style={styles.meta}> | Roll: {l.student?.rollNumber || "-"} | Room: {l.student?.roomNumber || "-"} | Block: {l.student?.hostelBlock || "-"}</span>
                </div>
                <span style={{ ...styles.badge, background: STATUS_COLOR[l.status] || "#334155" }}>
                  {STATUS_LABEL[l.status] || l.status}
                </span>
              </div>

              <div style={styles.cardBody}>
                <p><b>Type:</b> {l.leaveType} | <b>Destination:</b> {l.destination} | <b>Days:</b> {l.numberOfDays}</p>
                <p><b>From:</b> {formatDate(l.fromDate)} to <b>To:</b> {formatDate(l.toDate)}</p>
                <p><b>Reason:</b> {l.reason}</p>
                <p><b>Student Phone:</b> {l.student?.phone || "-"}</p>
                <p><b>Applied At:</b> {formatDateTime(l.createdAt)}</p>
                <p><b>Incharge Action At:</b> {formatDateTime(l.inchargeActionAt)}</p>
                <p><b>Warden Action At:</b> {formatDateTime(l.wardenActionAt)}</p>
                {l.inchargeComment && <p><b>Incharge Comment:</b> {l.inchargeComment}</p>}
                {l.wardenComment && <p><b>Warden Comment:</b> {l.wardenComment}</p>}
              </div>

              <div style={styles.historyWrap}>
                <p style={styles.historyTitle}>History</p>
                <ul style={styles.historyList}>
                  {(l.approvalHistory || []).map((entry, index) => (
                    <li key={`${l._id}-h-${index}`} style={styles.historyItem}>{historyLine(entry)}</li>
                  ))}
                </ul>
              </div>

              {["pending", "pending_incharge"].includes(l.status) && (
                <div style={styles.actionRow}>
                  <input
                    style={styles.commentInput}
                    placeholder="Add comment (optional)"
                    value={commentMap[l._id] || ""}
                    onChange={(e) => setCommentMap({ ...commentMap, [l._id]: e.target.value })}
                  />
                  <button style={styles.approveBtn} onClick={() => handleStatus(l._id, "approved")}>Approve & Forward</button>
                  <button style={styles.rejectBtn} onClick={() => handleStatus(l._id, "rejected")}>Reject</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f5f7fa" },
  nav: { background: "#1a73e8", color: "#fff", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  navTitle: { fontWeight: "700", fontSize: "1.1rem" },
  navUser: { marginRight: "16px", fontSize: "14px" },
  logoutBtn: { background: "#fff", color: "#1a73e8", border: "none", padding: "6px 14px", borderRadius: "4px", cursor: "pointer", fontWeight: "600" },
  container: { maxWidth: "1000px", margin: "0 auto", padding: "24px" },
  heading: { fontSize: "1.6rem", fontWeight: "700", color: "#1a73e8" },
  sub: { color: "#666", marginBottom: "20px" },
  msg: { background: "#e8f5e9", color: "#2e7d32", padding: "10px", borderRadius: "4px", marginBottom: "16px" },
  statsRow: { display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" },
  statCard: { flex: 1, minWidth: "100px", background: "#fff", borderRadius: "8px", padding: "16px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  statVal: { fontSize: "2rem", fontWeight: "700", color: "#1a73e8" },
  statLabel: { fontSize: "0.8rem", color: "#666", marginTop: "4px" },
  filterRow: { display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" },
  filterBtn: { padding: "8px 16px", border: "none", borderRadius: "20px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
  sectionTitle: { marginBottom: "12px", color: "#333" },
  empty: { color: "#999", textAlign: "center", padding: "20px" },
  leaveCard: { background: "#fff", borderRadius: "8px", padding: "16px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "8px" },
  meta: { color: "#666", fontSize: "13px" },
  badge: { padding: "4px 12px", borderRadius: "12px", color: "#fff", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap" },
  cardBody: { fontSize: "14px", color: "#444", lineHeight: "1.8" },
  historyWrap: { marginTop: "10px", background: "#f8fafc", borderRadius: "6px", padding: "10px" },
  historyTitle: { margin: 0, fontWeight: "700", fontSize: "13px", color: "#334155" },
  historyList: { margin: "8px 0 0", paddingLeft: "18px" },
  historyItem: { marginBottom: "4px", color: "#475569", fontSize: "12px" },
  actionRow: { display: "flex", gap: "8px", alignItems: "center", marginTop: "12px", flexWrap: "wrap" },
  commentInput: { flex: 1, minWidth: "220px", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "13px" },
  approveBtn: { background: "#10b981", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontWeight: "600" },
  rejectBtn: { background: "#ef4444", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }
};
