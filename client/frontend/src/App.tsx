// src/routes/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Detector from "@/pages/Detector";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Researcher from "@/pages/Researcher";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

// Get user role from localStorage
const getUserRole = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.role;
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element; allowedRoles: string[] }) {
  const token = localStorage.getItem("token");
  const userRole = getUserRole();
  
  // Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has required role
  if (userRole && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate page based on role
    if (userRole === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (userRole === "researcher") {
      return <Navigate to="/researcher" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }
  
  return children;
}

// Role-based redirect for root path
function RootRedirect() {
  const token = localStorage.getItem("token");
  const userRole = getUserRole();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (userRole === "admin") {
    return <Navigate to="/admin" replace />;
  } else if (userRole === "researcher") {
    return <Navigate to="/researcher" replace />;
  } else {
    return <Detector />;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route path="/" element={<RootRedirect />} />
        
        <Route path="/detector" element={
          <ProtectedRoute allowedRoles={["user", "researcher"]}>
            <Detector />
          </ProtectedRoute>
        } />
        
        <Route path="/researcher" element={
          <ProtectedRoute allowedRoles={["researcher"]}>
            <Researcher />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Admin />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-right" reverseOrder={false} />
    </BrowserRouter>
  );
}