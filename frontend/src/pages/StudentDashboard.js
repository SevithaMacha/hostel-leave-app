// File: StudentDashboard.js
// Student dashboard to apply leave and view full status history with timestamps.
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

export default function StudentDashboard() {
  const { user, token, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    reason: "", destination: "", fromDate: "", toDate: "", leaveType: "home"
  });
  const [message, setMessage] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchDashboard();
    fetchLeaves();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await axios.get("/api/dashboard/student", { headers });
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

  async function handleApply(e) {
    e.preventDefault();
    try {
      await axios.post("/api/leave/apply", formData, { headers });
      setMessage("Leave application submitted successfully");
      setShowForm(false);
      setFormData({ reason: "", destination: "", fromDate: "", toDate: "", leaveType: "home" });
      fetchDashboard();
      fetchLeaves();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to apply");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Cancel this leave application?")) return;
    try {
      await axios.delete(`/api/leave/${id}`, { headers });
      setMessage("Leave application cancelled");
      fetchLeaves();
      fetchDashboard();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to cancel");
    }
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <span style={styles.navTitle}>Hostel Leave System</span>
        <div>
          <span style={styles.navUser}>Welcome, {user?.name}</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>

      <div style={styles.container}>
        <h2 style={styles.heading}>Student Dashboard</h2>
        <p style={styles.sub}>Apply for leave and track full decision history with timestamps.</p>

        {message && <div style={styles.msg}>{message}</div>}

        {dashboard && (
          <div style={styles.statsRow}>
            {[
              { label: "Total Applied", value: dashboard.totalApplied },
              { label: "Pending", value: dashboard.pendingLeaves },
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

        <button style={styles.applyBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Apply for Leave"}
        </button>

        {showForm && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>New Leave Application</h3>
            <form onSubmit={handleApply}>
              <select style={styles.input} value={formData.leaveType} onChange={e => setFormData({ ...formData, leaveType: e.target.value })}>
                <option value="home">Home</option>
                <option value="medical">Medical</option>
                <option value="personal">Personal</option>
                <option value="emergency">Emergency</option>
              </select>
              <input style={styles.input} placeholder="Destination" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} required />
              <textarea style={{ ...styles.input, height: "80px" }} placeholder="Reason for leave" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} required />
              <div style={styles.dateRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>From Date</label>
                  <input style={styles.input} type="date" value={formData.fromDate} onChange={e => setFormData({ ...formData, fromDate: e.target.value })} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>To Date</label>
                  <input style={styles.input} type="date" value={formData.toDate} onChange={e => setFormData({ ...formData, toDate: e.target.value })} required />
                </div>
              </div>
              <button style={styles.submitBtn} type="submit">Submit Application</button>
            </form>
          </div>
        )}

        <h3 style={styles.sectionTitle}>My Leave Applications</h3>
        {leaves.length === 0 ? (
          <p style={styles.empty}>No leave applications found.</p>
        ) : (
          <div style={styles.listWrap}>
            {leaves.map((l) => (
              <div key={l._id} style={styles.leaveCard}>
                <div style={styles.cardTop}>
                  <div>
                    <p style={styles.primaryLine}><b>{l.leaveType.toUpperCase()}</b> | {l.destination} | {l.numberOfDays} day(s)</p>
                    <p style={styles.metaLine}>{formatDate(l.fromDate)} to {formatDate(l.toDate)}</p>
                  </div>
                  <span style={{ ...styles.badge, background: STATUS_COLOR[l.status] || "#334155" }}>
                    {STATUS_LABEL[l.status] || l.status}
                  </span>
                </div>

                <p style={styles.reason}><b>Reason:</b> {l.reason}</p>
                <p style={styles.small}><b>Applied At:</b> {formatDateTime(l.createdAt)}</p>
                <p style={styles.small}><b>Incharge Decision:</b> {l.inchargeActionAt ? formatDateTime(l.inchargeActionAt) : "Pending"}</p>
                <p style={styles.small}><b>Warden Decision:</b> {l.wardenActionAt ? formatDateTime(l.wardenActionAt) : "Pending"}</p>

                {l.inchargeComment && <p style={styles.small}><b>Incharge Comment:</b> {l.inchargeComment}</p>}
                {l.wardenComment && <p style={styles.small}><b>Warden Comment:</b> {l.wardenComment}</p>}

                <div style={styles.historyWrap}>
                  <p style={styles.historyTitle}>History</p>
                  <ul style={styles.historyList}>
                    {(l.approvalHistory || []).map((entry, index) => (
                      <li key={`${l._id}-h-${index}`} style={styles.historyItem}>{historyLine(entry)}</li>
                    ))}
                  </ul>
                </div>

                {["pending", "pending_incharge", "pending_warden"].includes(l.status) && (
                  <button onClick={() => handleDelete(l._id)} style={styles.deleteBtn}>Cancel Application</button>
                )}
              </div>
            ))}
          </div>
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
  container: { maxWidth: "1100px", margin: "0 auto", padding: "24px" },
  heading: { fontSize: "1.6rem", fontWeight: "700", color: "#1a73e8" },
  sub: { color: "#666", marginBottom: "20px" },
  msg: { background: "#e8f5e9", color: "#2e7d32", padding: "10px", borderRadius: "4px", marginBottom: "16px" },
  statsRow: { display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" },
  statCard: { flex: 1, minWidth: "120px", background: "#fff", borderRadius: "8px", padding: "20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  statVal: { fontSize: "2rem", fontWeight: "700", color: "#1a73e8" },
  statLabel: { fontSize: "0.85rem", color: "#666", marginTop: "4px" },
  applyBtn: { background: "#1a73e8", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", marginBottom: "20px" },
  formCard: { background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "24px" },
  formTitle: { marginBottom: "16px", color: "#1a73e8" },
  input: { width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", marginBottom: "12px", boxSizing: "border-box" },
  label: { fontSize: "12px", color: "#555", marginBottom: "4px", display: "block" },
  dateRow: { display: "flex", gap: "12px" },
  submitBtn: { background: "#1a73e8", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "4px", cursor: "pointer", fontWeight: "600" },
  sectionTitle: { marginBottom: "12px", color: "#333" },
  empty: { color: "#999", textAlign: "center", padding: "20px" },
  listWrap: { display: "grid", gap: "14px" },
  leaveCard: { background: "#fff", borderRadius: "8px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  cardTop: { display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", marginBottom: "10px" },
  primaryLine: { margin: 0, color: "#111827" },
  metaLine: { margin: "4px 0 0", color: "#6b7280", fontSize: "13px" },
  reason: { margin: "8px 0", color: "#374151" },
  small: { margin: "4px 0", color: "#4b5563", fontSize: "13px" },
  badge: { padding: "4px 12px", borderRadius: "12px", color: "#fff", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap" },
  historyWrap: { marginTop: "10px", background: "#f8fafc", borderRadius: "6px", padding: "10px" },
  historyTitle: { margin: 0, fontWeight: "700", fontSize: "13px", color: "#334155" },
  historyList: { margin: "8px 0 0", paddingLeft: "18px" },
  historyItem: { marginBottom: "4px", color: "#475569", fontSize: "12px" },
  deleteBtn: { marginTop: "10px", background: "#ef4444", color: "#fff", border: "none", padding: "7px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }
};
