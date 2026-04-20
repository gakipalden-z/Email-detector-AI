import type { EmailResult } from "@/lib/mockApi";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function ResultCard({ result, originalText }: { result: EmailResult; originalText: string }) {
  const isPhish = result.prediction === "Phishing";
  const pct = Math.round(result.confidence * 100);

  return (
    <div className="grid gap-4 animate-[var(--animate-fade-up)] md:grid-cols-5">
      <div
        className={`md:col-span-2 rounded-2xl border p-6 shadow-[var(--shadow-pop)] ${
          isPhish
            ? "border-destructive/30 bg-destructive text-destructive-foreground"
            : "border-success/30 bg-success text-success-foreground"
        }`}
      >
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80">
          {isPhish ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Prediction
        </div>
        <div className="mt-3 font-display text-5xl font-bold tracking-tight">{result.prediction}</div>
        <div className="mt-8">
          <div className="flex items-baseline justify-between text-xs uppercase tracking-widest opacity-80">
            <span>Confidence</span>
            <span className="font-mono text-base">{pct}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/20">
            <div className="h-full bg-current transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="md:col-span-3 space-y-4">
        {(result.modelName || result.latencyMs) && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-xs text-muted-foreground">
            <span>
              Analyzed by <span className="font-medium text-foreground">{result.modelName}</span>
            </span>
            {result.latencyMs != null && (
              <span className="font-mono">{result.latencyMs} ms</span>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Explanation · Gemini</div>
          <ul className="mt-4 space-y-2.5">
            {result.explanation.map((e, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground" />
                {e}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Email · highlighted</div>
          <p className="mt-3 whitespace-pre-wrap font-mono text-sm leading-relaxed">
            {highlight(originalText || result.text, result.highlights)}
          </p>
        </div>
      </div>
    </div>
  );
}

function highlight(text: string, terms: string[]) {
  if (!terms.length) return text;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(re);
  return parts.map((p, i) =>
    re.test(p) ? (
      <mark key={i} className="rounded-sm bg-warning/60 px-1 text-warning-foreground">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
