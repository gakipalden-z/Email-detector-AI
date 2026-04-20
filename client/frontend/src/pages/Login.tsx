// src/pages/Login.tsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { auth } from "@/lib/auth";
import { ShieldCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Sign in · PhishLens";
    
    // Check if already logged in
    const token = localStorage.getItem("token");
    if (token) {
      const userRole = localStorage.getItem("userRole");
      redirectByRole(userRole);
    }
  }, []);

  const redirectByRole = (role: string | null) => {
    switch (role) {
      case "admin":
        navigate("/admin");
        break;
      case "researcher":
        navigate("/researcher");
        break;
      case "user":
        navigate("/");
        break;
      default:
        // If no role, stay on login
        break;
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log(response);

      if (!response.ok) {
        throw new Error(data.message || data.error || "Login failed");
      }

      // Store token and user data
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      // Store user role and info
      if (data.user) {
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      toast.success("Login successful! Welcome back!");
      
      // Redirect based on role
      if (data.user?.role === "admin") {
        navigate("/admin");
      } else if (data.user?.role === "researcher") {
        navigate("/researcher");
      } else {
        navigate("/");
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed. Please check your credentials.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-md animate-[var(--animate-fade-up)]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue to PhishLens.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@domain.com" />
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive animate-[var(--animate-fade-in)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>

          <p className="text-center text-xs text-muted-foreground">
            No account?{" "}
            <Link to="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </Shell>
  );
}

function Field({
  label, type, value, onChange, placeholder,
}: { label: string; type: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}