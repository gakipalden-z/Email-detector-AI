import { AlertTriangle, CheckCircle2, Shield, ShieldAlert, Zap, Brain } from "lucide-react";

type PredictionResult = {
  input: string;
  prediction: string;
  confidence: number;
  explanation: string;
  model_used?: string;
};

interface ResultCardProps {
  result: PredictionResult;
  originalText: string;
  modelType?: string;
}

export function ResultCard({ result, originalText, modelType }: ResultCardProps) {
  const isPhish = result.prediction === "Phishing Email";
  const pct = Math.round(result.confidence * 100);

  // Extract keywords from explanation for highlighting
  const getKeywordsFromExplanation = (explanation: string): string[] => {
    const keywords = [];
    const lowerExplanation = explanation.toLowerCase();
    
    if (lowerExplanation.includes("urgent") || lowerExplanation.includes("immediately")) {
      keywords.push("urgent", "immediately", "now", "asap");
    }
    if (lowerExplanation.includes("verify") || lowerExplanation.includes("login")) {
      keywords.push("verify", "login", "password", "account");
    }
    if (lowerExplanation.includes("link") || lowerExplanation.includes("http")) {
      keywords.push("http", "https", "www.", "click", "link");
    }
    if (lowerExplanation.includes("bank") || lowerExplanation.includes("payment")) {
      keywords.push("bank", "payment", "invoice", "transfer");
    }
    if (lowerExplanation.includes("suspended") || lowerExplanation.includes("blocked")) {
      keywords.push("suspended", "blocked", "terminated");
    }
    
    return keywords;
  };

  const highlightTerms = getKeywordsFromExplanation(result.explanation);

  const highlight = (text: string, terms: string[]) => {
    if (!terms.length) return text;
    const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const re = new RegExp(`(${escaped.join("|")})`, "gi");
    const parts = text.split(re);
    return parts.map((p, i) =>
      re.test(p) ? (
        <mark key={i} className="rounded-sm bg-yellow-400/60 px-1 text-yellow-950">
          {p}
        </mark>
      ) : (
        <span key={i}>{p}</span>
      ),
    );
  };

  // Split explanation into bullet points
  const explanationPoints = result.explanation.split("|").map(point => point.trim());

  // Get confidence level color
  const getConfidenceColor = () => {
    if (pct >= 90) return isPhish ? "text-red-600" : "text-green-600";
    if (pct >= 70) return "text-yellow-600";
    return "text-blue-600";
  };

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
        <div className="mt-3 font-display text-5xl font-bold tracking-tight">
          {result.prediction === "Phishing Email" ? "Phishing" : "Safe Email"}
        </div>
        <div className="mt-8">
          <div className="flex items-baseline justify-between text-xs uppercase tracking-widest opacity-80">
            <span>Confidence</span>
            <span className={`font-mono text-base ${getConfidenceColor()}`}>{pct}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/20">
            <div 
              className={`h-full transition-all duration-700 ${
                isPhish ? "bg-white" : "bg-white"
              }`} 
              style={{ width: `${pct}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="md:col-span-3 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-xs text-muted-foreground">
          <span>
            Analyzed by <span className="font-medium text-foreground">PhishLens AI</span>
          </span>
          <span className="flex items-center gap-1.5">
            {modelType === "logistic" ? (
              <>
                <Zap className="h-3 w-3 text-yellow-500" />
                <span className="font-mono">Logistic Regression</span>
              </>
            ) : (
              <>
                <Brain className="h-3 w-3 text-purple-500" />
                <span className="font-mono">DistilBERT v2.1</span>
              </>
            )}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Explanation · AI Analysis</div>
          <ul className="mt-4 space-y-2.5">
            {explanationPoints.map((point, i) => (
              point && (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground" />
                  {point}
                </li>
              )
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Email · highlighted</div>
          <p className="mt-3 whitespace-pre-wrap font-mono text-sm leading-relaxed">
            {highlight(originalText || result.input, highlightTerms)}
          </p>
        </div>

        {/* Model Performance Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {modelType === "logistic" 
              ? "⚡ Fast prediction (~5ms)" 
              : "🧠 Deep analysis (~120ms)"}
          </span>
          {result.model_used && (
            <>
              <span>·</span>
              <span className="font-mono">{result.model_used}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}