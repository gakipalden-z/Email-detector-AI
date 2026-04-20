import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { mock } from "@/lib/mockApi";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from "recharts";
import { Database, Play, Rocket } from "lucide-react";

export default function Researcher() {
  const [selected, setSelected] = useState(mock.models[1].id);
  const model = mock.models.find((m) => m.id === selected)!;

  useEffect(() => {
    document.title = "Researcher · PhishLens";
  }, []);

  return (
    <Shell>
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4 animate-[var(--animate-fade-up)]">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Researcher workspace</div>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">Models &amp; evaluation</h1>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-accent">
            <Database className="h-4 w-4" /> Upload dataset
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-accent">
            <Play className="h-4 w-4" /> Train
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90">
            <Rocket className="h-4 w-4" /> Deploy
          </button>
        </div>
      </header>

      <section className="mb-8">
        <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Active model</div>
        <div className="flex flex-wrap gap-2">
          {mock.models.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`rounded-xl border px-4 py-3 text-left transition-all ${
                selected === m.id
                  ? "border-foreground bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <div className="text-sm font-semibold">{m.name}</div>
              <div className="mt-0.5 text-xs opacity-70">{m.params} params · {m.latency}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Accuracy", value: model.accuracy },
          { label: "Precision", value: model.precision },
          { label: "Recall", value: model.recall },
          { label: "F1-score", value: model.f1 },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{m.label}</div>
            <div className="mt-3 font-display text-4xl font-bold tracking-tight">{(m.value * 100).toFixed(1)}<span className="text-xl text-muted-foreground">%</span></div>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-foreground" style={{ width: `${m.value * 100}%` }} />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Confusion matrix</div>
          <div className="mb-4 text-sm text-muted-foreground">{model.name} · validation set</div>
          <div className="grid grid-cols-2 gap-2">
            {mock.confusion.map((c) => {
              const good = c.name === "TP" || c.name === "TN";
              return (
                <div
                  key={c.name}
                  className={`rounded-xl p-5 ${good ? "bg-foreground text-background" : "bg-muted text-foreground"}`}
                >
                  <div className="text-xs uppercase tracking-widest opacity-70">{c.name}</div>
                  <div className="mt-2 font-display text-3xl font-bold">{c.value}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Model comparison</div>
          <div className="mb-4 text-sm text-muted-foreground">F1-score across architectures</div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mock.models.map((m) => ({ name: m.name, f1: +(m.f1 * 100).toFixed(1) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                  cursor={{ fill: "var(--accent)" }}
                />
                <Bar dataKey="f1" radius={[6, 6, 0, 0]}>
                  {mock.models.map((m) => (
                    <Cell key={m.id} fill={m.id === selected ? "var(--foreground)" : "var(--muted-foreground)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </Shell>
  );
}
