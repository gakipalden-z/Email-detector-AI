// src/components/Shell.tsx
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

interface User {
  name: string;
  role: string;
  email: string;
}

const getNavForRole = (role?: string) => {
  if (!role) return [];
  
  switch (role) {
    case "admin":
      return [
        // { to: "/", label: "Detector" },
        // { to: "/researcher", label: "Researcher" },
        { to: "/admin", label: "Admin" },
      ];
    case "researcher":
      return [
      { to: "/", label: "Detector" },
        { to: "/researcher", label: "Researcher" },
      ];
    case "user":
      return [
        { to: "/", label: "Detector" },
      ];
    default:
      return [];
  }
};

export function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Failed to parse user", e);
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
    navigate("/login");
  };

  const navItems = user ? getNavForRole(user.role) : [];
  const isLoggedIn = ready && user;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">
              Phish<span className="text-muted-foreground">/</span>Lens
            </span>
          </Link>
          
          <nav className="flex items-center gap-1">
            {/* Only show navigation links when logged in */}
            {isLoggedIn && navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end
                className={({ isActive }) =>
                  isActive
                    ? "rounded-md px-3 py-1.5 text-sm bg-accent text-foreground font-medium"
                    : "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                }
              >
                {n.label}
              </NavLink>
            ))}
            
            <div className="ml-3 flex items-center gap-2 border-l border-border pl-3">
              {isLoggedIn ? (
                <>
                  <div className="hidden text-right sm:block">
                    <div className="text-xs font-medium leading-tight">{user.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{user.role}</div>
                  </div>
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-semibold">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <button
                    onClick={logout}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                    Sign in
                  </Link>
                  <Link to="/register" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        PhishLens · research-grade phishing detection · UI prototype
      </footer>
    </div>
  );
}