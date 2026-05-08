// File: App.js
// Main application with role-based routing for Students, Incharges, and Wardens.
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import StudentDashboard from "./pages/StudentDashboard";
import WardenDashboard from "./pages/WardenDashboard";
import InchargeDashboard from "./pages/InchargeDashboard";

function AppRoutes() {
  const { user } = useAuth();

  if (!user) return <AuthPage />;

  return (
    <Routes>
      <Route path="/" element={
        user.role === "warden"
          ? <WardenDashboard />
          : user.role === "incharge"
            ? <InchargeDashboard />
            : <StudentDashboard />
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
