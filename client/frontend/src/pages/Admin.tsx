import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { mock } from "@/lib/mockApi";
import { Check, X } from "lucide-react";

type User = (typeof mock.users)[number];
type Role = "user" | "researcher" | "admin";
type Status = "approved" | "pending" | "rejected";

export default function Admin() {
  const [users, setUsers] = useState<User[]>(mock.users as User[]);

  useEffect(() => {
    document.title = "Admin · PhishLens";
  }, []);

  const update = (id: string, patch: Partial<User>) =>
    setUsers((u) => u.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const counts = {
    pending: users.filter((u) => u.status === "pending").length,
    approved: users.filter((u) => u.status === "approved").length,
    total: users.length,
  };

  return (
    <Shell>
      <header className="mb-10 animate-[var(--animate-fade-up)]">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Admin console</div>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">Users &amp; access control</h1>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total users", value: counts.total },
          { label: "Pending approval", value: counts.pending },
          { label: "Approved", value: counts.approved },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
            <div className="mt-2 font-display text-4xl font-bold">{s.value}</div>
          </div>
        ))}
      </section>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left font-medium">User</th>
              <th className="px-5 py-3 text-left font-medium">Role</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
              <th className="px-5 py-3 text-left font-medium">Created</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 transition-colors hover:bg-accent/50">
                <td className="px-5 py-4">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </td>
                <td className="px-5 py-4">
                  <select
                    value={u.role}
                    onChange={(e) => update(u.id, { role: e.target.value as Role })}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="user">user</option>
                    <option value="researcher">researcher</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-5 py-4">
                  <StatusPill status={u.status as Status} />
                </td>
                <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{u.createdAt}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => update(u.id, { status: "approved" })}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-success transition-colors hover:bg-success hover:text-success-foreground"
                      aria-label="Approve"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => update(u.id, { status: "rejected" })}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      aria-label="Reject"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    approved: "bg-success/15 text-success",
    pending: "bg-warning/20 text-warning-foreground",
    rejected: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${map[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
