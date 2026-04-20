import { useState } from "react";
import { checkEmail, mock, type EmailResult, type ModelId } from "@/lib/mockApi";
import { ResultCard } from "./ResultCard";
import { Loader2, Sparkles, Cpu, ChevronDown } from "lucide-react";

const SAMPLES = [
  "URGENT: Your account will be suspended. Click here to verify.",
  "Hi team, weekly sync tomorrow 10AM in Room B.",
  "Congratulations! Claim your $1,000 Amazon gift card now: bit.ly/x",
];

export function EmailForm() {
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [showHeaders, setShowHeaders] = useState(false);
  const [headers, setHeaders] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailResult | null>(null);
  const [modelId, setModelId] = useState<ModelId>("distilbert");

  const activeModel = mock.models.find((m) => m.id === modelId)!;

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    const res = await checkEmail([subject, headers, text].join("\n"), modelId);
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="border-b border-border px-6 py-4">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional)"
            className="w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        {showHeaders && (
          <div className="border-b border-border bg-surface px-6 py-3 animate-[var(--animate-fade-in)]">
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              placeholder="From: ...&#10;Return-Path: ...&#10;Received: ..."
              rows={3}
              className="w-full resize-none bg-transparent font-mono text-xs placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the email body here…"
          rows={8}
          className="w-full resize-none bg-transparent px-6 py-5 text-base leading-relaxed placeholder:text-muted-foreground focus:outline-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={showHeaders}
                onChange={(e) => setShowHeaders(e.target.checked)}
                className="h-3.5 w-3.5 accent-foreground"
              />
              Include raw headers
            </label>

            <div className="relative">
              <Cpu className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value as ModelId)}
                className="appearance-none rounded-md border border-border bg-background py-1.5 pl-8 pr-7 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Select model"
              >
                {mock.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {(m.accuracy * 100).toFixed(0)}%
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>

            <span className="hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
              {activeModel.params} · {activeModel.latency}
            </span>
          </div>

          <button
            onClick={submit}
            disabled={loading || !text.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Analyzing…" : "Check Email"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Try a sample:</span>
        {SAMPLES.map((s, i) => (
          <button
            key={i}
            onClick={() => setText(s)}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            sample {i + 1}
          </button>
        ))}
      </div>

      {result && <ResultCard result={result} originalText={text} />}
    </div>
  );
}
