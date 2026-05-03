import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { Check, X, ShieldCheck, Users, Activity, Lock , Trash, Pause} from "lucide-react";
import toast from "react-hot-toast";
import TwoFactorSetup from "@/components/TwoFactorSetup";

type User = {
  id: string;
  name: string;
  email: string;
  role: "user" | "researcher" | "admin";
  status: "approved" | "pending" | "rejected" |"suspended";
  twoFactorEnabled: boolean;
  createdAt: string;
};

type Role = "user" | "researcher" | "admin";
type Status = "approved" | "pending" | "rejected" | "suspended";

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [dangerUser, setDangerUser] = useState<User | null>(null);
const [dangerAction, setDangerAction] = useState<"delete" | "suspend" | null>(null);

  useEffect(() => {
    document.title = "Admin · PhishLens";

    const fetchUsers = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/users/all");
        const data = await res.json();

        const formatted = data.map((u: any) => ({
          id: u._id,
          name: u.email.split("@")[0],
          email: u.email,
          role: u.role,
          status: u.status === "accepted" ? "approved" : u.status,
          twoFactorEnabled: u.twoFactorEnabled,
          createdAt: new Date(u.createdAt).toLocaleString(),
        }));

        setUsers(formatted);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        toast.error("Failed to load users");
      }
    };

    fetchUsers();
  }, []);

  const update = async (id: string, patch: Partial<User>) => {
    try {
      // STATUS UPDATE
      if (patch.status) {
        const res = await fetch(
          `http://localhost:5000/api/users/status/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status:
                patch.status === "approved"
                  ? "accepted"
                  : patch.status,
            }),
          }
        );

        if (!res.ok) throw new Error("Status update failed");
        toast.success("User status updated");
      }

      // ROLE UPDATE
      if (patch.role) {
        const res = await fetch(
          `http://localhost:5000/api/users/role/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: patch.role }),
          }
        );

        if (!res.ok) throw new Error("Role update failed");
        toast.success("User role updated");
      }

      // UPDATE UI
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
      );
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  const counts = {
    pending: users.filter((u) => u.status === "pending").length,
    approved: users.filter((u) => u.status === "approved").length,
    total: users.length,
  };

  // =======================
// 🔥 DELETE USER
// =======================
const deleteUser = async (id: string) => {
  try {
    const res = await fetch(
      `http://localhost:5000/api/users/delete/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!res.ok) throw new Error("Delete failed");

    // UI update
    setUsers((prev) => prev.filter((u) => u.id !== id));

    toast.success("User deleted successfully");
  } catch (err) {
    console.error(err);
    toast.error("Delete failed");
  }
};


// =======================
// 🔥 SUSPEND USER
// =======================
const suspendUser = async (id: string) => {
  try {
    const res = await fetch(
      `http://localhost:5000/api/users/suspend/${id}`,
      {
        method: "PUT",
      }
    );

    if (!res.ok) throw new Error("Suspend failed");

    // UI update
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: "suspended" } : u
      )
    );

    toast.success("User suspended successfully");
  } catch (err) {
    console.error(err);
    toast.error("Suspend failed");
  }
};
const handleDangerAction = async () => {
  if (!dangerUser || !dangerAction) return;

  try {
    if (dangerAction === "delete") {
      await deleteUser(dangerUser.id);
    }

    if (dangerAction === "suspend") {
      await suspendUser(dangerUser.id);
    }
  } finally {
    setDangerUser(null);
    setDangerAction(null);
  }
};
console.log("Users with 2FA status:", users);
// ===================================================================================================

  return (
    <Shell>
      {/* HEADER */}
      <header className="mb-10 animate-[var(--animate-fade-up)]">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Admin console
        </div>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">
          Users & access control
        </h1>
      </header>

      {/* ADMIN PRIVILEGES */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-4 rounded-xl border bg-card flex gap-3">
          <Users className="w-5 h-5 text-primary" />
          <div>
            <div className="font-medium">User Management</div>
            <div className="text-xs text-muted-foreground">
              Approve or reject registrations
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-card flex gap-3">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <div>
            <div className="font-medium">Role Control</div>
            <div className="text-xs text-muted-foreground">
              Assign user roles
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-card flex gap-3">
          <Activity className="w-5 h-5 text-primary" />
          <div>
            <div className="font-medium">System Monitoring</div>
            <div className="text-xs text-muted-foreground">
              Monitor logs & usage
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-card flex gap-3">
          <Lock className="w-5 h-5 text-primary" />
          <div>
            <div className="font-medium">Security Policies</div>
            <div className="text-xs text-muted-foreground">
              Enforce 2FA compliance
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total users", value: counts.total },
          { label: "Pending approval", value: counts.pending },
          { label: "Approved", value: counts.approved },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
          >
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-2 font-display text-4xl font-bold">
              {s.value}
            </div>
          </div>
        ))}
      </section>

      {/* TABLE */}
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
              <tr
                key={u.id}
                className="border-b border-border last:border-0 transition-colors hover:bg-accent/50"
              >
                <td className="px-5 py-4">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {u.email}
                  </div>
                </td>

                {/* ROLE */}
                <td className="px-5 py-4">
                  <select
                    value={u.role}
                    onChange={(e) =>
                      update(u.id, { role: e.target.value as Role })
                    }
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="user">user</option>
                    <option value="researcher">researcher</option>
                    <option value="admin">admin</option>
                  </select>
                </td>

                {/* STATUS */}
                <td className="px-5 py-4">
                  <StatusPill status={u.status} />
                </td>

                <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                  {u.createdAt}
                </td>

                {/* ACTIONS */}
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() =>
                        update(u.id, { status: "approved" })
                      }
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-success hover:bg-success hover:text-success-foreground"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() =>
                        update(u.id, { status: "rejected" })
                      }
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        suspendUser(u.id);
                      }}
                      //  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-yellow-500 hover:bg-yellow-500 hover:text-black"
                      // aria-label="Suspend"
                    >
                      <Pause className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        deleteUser(u.id)
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-destructive hover:bg-destructive hover:text-white"
                      aria-label="Delete"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 2 factor  */}
      <section className="mb-8 mt-8 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
  <h2 className="font-display text-xl font-semibold">
    Two-Factor Authentication (2FA)
  </h2>

  <p className="mt-2 text-sm text-muted-foreground">
    Strengthen account security by requiring a second verification step when logging in or performing sensitive actions.
  </p>

{/* users with 2fa */}
  <div className="mt-5">
    <h3 className="text-sm font-medium mb-2">User 2FA Status</h3>

    <div className="space-y-2">
      {users.map((u) => (
        <div
          key={u.email}
          className="flex items-center justify-between rounded-lg border px-4 py-2"
        >
          <div className="text-sm">{u.email}</div>

          <span
            className={`text-xs px-2 py-1 rounded-full ${
              u.twoFactorEnabled
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive"
            }`}
          >
            {u.twoFactorEnabled ? "2FA Enabled" : "2FA Disabled"}
          </span>
        </div>
      ))}
    </div>
  </div>
  <TwoFactorSetup />

  {/* ACTIONS */}
  {/* <div className="mt-5 flex gap-3">
    <button className="rounded-md border px-3 py-1 text-sm hover:bg-accent">
      Require 2FA for All Admins
    </button>

    <button className="rounded-md border px-3 py-1 text-sm hover:bg-accent">
      Reset 2FA for User
    </button>
  </div> */}
</section>
    </Shell>
  );
}

/* STATUS BADGE */
function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    approved: "bg-success/15 text-success",
    pending: "bg-warning/20 text-warning-foreground",
    rejected: "bg-destructive/15 text-destructive",
    suspended: "bg-yellow-500/20 text-yellow-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${map[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}