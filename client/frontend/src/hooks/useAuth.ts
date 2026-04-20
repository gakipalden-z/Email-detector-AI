// src/hooks/useAuth.ts (update this)
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "researcher" | "admin";
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
    setReady(true);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    setUser(null);
  };

  return { user, ready, logout };
}