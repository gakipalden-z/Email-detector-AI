import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { auth, type AuthUser } from "@/lib/auth";
import { ShieldCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AuthUser["role"]>("user");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Create account · PhishLens";
  }, []);

  const submit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  if (password.length < 6) {
    toast.error("Password must be at least 6 characters");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch("http://localhost:5000/api/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Registration failed");
    }

    // ✅ SUCCESS TOAST
    toast.success("Account created successfully 🎉");

    // optional delay so user sees toast
    setTimeout(() => {
      navigate("/login");
    }, 800);

  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Registration failed";

    // ❌ ERROR TOAST
    toast.error(message);
    setError(message);
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
          <h1 className="font-display text-3xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Start detecting phishing in seconds.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <Field label="Full name" type="text" value={name} onChange={setName} placeholder="Ada Lovelace" />
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@domain.com" />
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" />

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted-foreground">Role</span>
            <div className="grid grid-cols-3 gap-2">
              {(["user", "researcher", "admin"] as const).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                    role === r
                      ? "border-foreground bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </label>

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
            Create account
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Already have one?{" "}
            <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
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
