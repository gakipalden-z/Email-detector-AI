export type AuthUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "researcher" | "admin";
  createdAt: string;
};

const USERS_KEY = "phishlens.users";
const SESSION_KEY = "phishlens.session";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const auth = {
  list: () => read<AuthUser[]>(USERS_KEY, []),
  current: () => read<AuthUser | null>(SESSION_KEY, null),

  register(input: { name: string; email: string; password: string; role?: AuthUser["role"] }) {
    const users = auth.list();
    const email = input.email.trim().toLowerCase();
    if (users.some((u) => u.email === email)) {
      throw new Error("An account with this email already exists.");
    }
    const user: AuthUser = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      email,
      password: input.password,
      role: input.role ?? "user",
      createdAt: new Date().toISOString(),
    };
    write(USERS_KEY, [...users, user]);
    write(SESSION_KEY, user);
    notify();
    return user;
  },

  login(email: string, password: string) {
    const user = auth.list().find((u) => u.email === email.trim().toLowerCase());
    if (!user || user.password !== password) {
      throw new Error("Invalid email or password.");
    }
    write(SESSION_KEY, user);
    notify();
    return user;
  },

  logout() {
    if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
    notify();
  },
};

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
export function subscribeAuth(cb: () => void) {
  listeners.add(cb);
  if (typeof window !== "undefined") {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY) cb();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => listeners.delete(cb);
}
