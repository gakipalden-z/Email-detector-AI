import { Navigate } from "@tanstack/react-router";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
}