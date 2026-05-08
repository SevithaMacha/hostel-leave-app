// File: AuthPage.js
// Login and Registration page for Students, Incharges, and Wardens.
import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", role: "student",
    rollNumber: "", roomNumber: "", hostelBlock: "", phone: "", parentPhone: ""
  });
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const url = isLogin ? "/api/auth/login" : "/api/auth/register";
      const res = await axios.post(url, formData);
      login(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>{isLogin ? "Login" : "Register"}</h2>
        <p style={styles.subtitle}>Hostel Leave Application System</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input style={styles.input} name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
          )}
          <input style={styles.input} name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input style={styles.input} name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          {!isLogin && (
            <>
              <select style={styles.input} name="role" value={formData.role} onChange={handleChange}>
                <option value="student">Student</option>
                <option value="incharge">Incharge</option>
                <option value="warden">Warden</option>
              </select>
              {formData.role === "student" && (
                <>
                  <input style={styles.input} name="rollNumber" placeholder="Roll Number" value={formData.rollNumber} onChange={handleChange} />
                  <input style={styles.input} name="roomNumber" placeholder="Room Number" value={formData.roomNumber} onChange={handleChange} />
                  <input style={styles.input} name="hostelBlock" placeholder="Hostel Block" value={formData.hostelBlock} onChange={handleChange} />
                  <input style={styles.input} name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
                  <input style={styles.input} name="parentPhone" placeholder="Parent Phone Number" value={formData.parentPhone} onChange={handleChange} />
                </>
              )}
            </>
          )}
          <button style={styles.button} type="submit">{isLogin ? "Login" : "Register"}</button>
        </form>
        <p style={styles.toggle}>
          {isLogin ? "No account? " : "Already have an account? "}
          <span style={styles.link} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Register here" : "Login here"}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5" },
  card: { background: "#fff", padding: "2rem", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", width: "100%", maxWidth: "420px" },
  title: { fontSize: "1.8rem", fontWeight: "700", color: "#1a73e8", marginBottom: "4px" },
  subtitle: { color: "#666", marginBottom: "1.2rem", fontSize: "0.9rem" },
  input: { width: "100%", padding: "10px", marginBottom: "12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" },
  button: { width: "100%", padding: "12px", background: "#1a73e8", color: "#fff", border: "none", borderRadius: "4px", fontSize: "16px", cursor: "pointer" },
  error: { background: "#fdecea", color: "#c62828", padding: "10px", borderRadius: "4px", marginBottom: "12px", fontSize: "14px" },
  toggle: { textAlign: "center", marginTop: "1rem", fontSize: "14px", color: "#555" },
  link: { color: "#1a73e8", cursor: "pointer", fontWeight: "600" }
};
