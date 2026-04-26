// src/pages/Login.tsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { ShieldCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [requires2FA, setRequires2FA] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Sign in · PhishLens";

    const token = localStorage.getItem("token");
    if (token) {
      const role = localStorage.getItem("userRole");
      redirectByRole(role);
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
    }
  };

  // ---------------- LOGIN ----------------
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      // 🔐 IF 2FA REQUIRED
      if (data.requires2FA) {
        setRequires2FA(true);
        setUserId(data.userId);
        toast("Enter your 2FA code");
        return;
      }

      handleSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- VERIFY 2FA ----------------
  const verify2FA = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        "http://localhost:5000/api/users/2fa/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            token: otp,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid OTP");
      }

      handleSuccess(data);
    } catch (err) {
      toast.error("Invalid 2FA code");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SUCCESS LOGIN ----------------
  const handleSuccess = (data: any) => {
    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    if (data.user) {
      localStorage.setItem("userRole", data.user.role);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    toast.success("Login successful!");
    redirectByRole(data.user?.role);
  };

  // ===================================================================
  return (
    <Shell>
      <div className="mx-auto max-w-md animate-[var(--animate-fade-up)]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue to PhishLens.
          </p>
        </div>

        {/* ================= LOGIN FORM ================= */}
        {!requires2FA ? (
          <form
            onSubmit={submit}
            className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
          >
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@domain.com"
            />

            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>

            <p className="text-center text-xs text-muted-foreground">
              No account?{" "}
              <Link
                to="/register"
                className="font-medium text-foreground underline hover:underline"
              >
                Create one
              </Link>
            </p>
          </form>
        ) : (
          /* ================= 2FA SCREEN ================= */
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-semibold">
              Two-Factor Authentication
            </h2>

            <p className="text-sm text-muted-foreground">
              Enter the code from your authenticator app
            </p>

            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />

            <button
              onClick={verify2FA}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Verify 2FA
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
}

// ================= FIELD COMPONENT =================
function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}