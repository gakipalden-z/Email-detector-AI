import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, AlertTriangle, RotateCcw } from "lucide-react";
import type { AnalysisData } from "@/pages/Index";

interface AnalysisResultProps {
  data: AnalysisData;
  onReset: () => void;
}

const AnalysisResult = ({ data, onReset }: AnalysisResultProps) => {
  console.log("data", data)
  const isPhishing = data.status == "Phishing Email";
  const confidence = data.confidence * 100
  console.log("is phishing", isPhishing)

  return (
    <div className="space-y-6">
      {/* Verdict */}
      <div
        className={`rounded-lg border p-8 text-center ${
          isPhishing
            ? "border-destructive bg-destructive/5 border-glow-danger"
            : "border-primary bg-primary/5 border-glow"
        }`}
      >
        {isPhishing ? (
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4" />
        ) : (
          <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-4" />
        )}
        <h2
          className={`font-mono text-2xl font-bold mb-2 ${
            isPhishing ? "text-destructive text-glow-danger" : "text-primary text-glow"
          }`}
        >
          {isPhishing ? "⚠ PHISHING DETECTED" : "✓ EMAIL IS SAFE"}
        </h2>
        {/* <p className="font-mono text-sm text-muted-foreground">{data.summary}</p> */}
        <p className="font-mono text-sm text-muted-foreground">
  {typeof data.summary === "object" ? (
    <>
      {/* INPUT */}
      <span className="block">
        Input:{" "}
        <span
          className="truncate max-w-[250px] inline-block align-bottom cursor-pointer"
          title={data.summary.input}
        >
          {data.summary.input.length > 30
            ? data.summary.input.slice(0, 30) + "..."
            : data.summary.input}
        </span>
      </span>

      {/* PREDICTION */}
      <br />
      <span>
        Prediction: {data.summary.prediction}
      </span>

      {/* CONFIDENCE */}
      <br />
      <span>
        Confidence: {(data.summary.confidence * 100).toFixed(2)}%
      </span>
    </>
  ) : (
    data.summary
  )}
</p>
      </div>

      {/* Confidence */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            Confidence Score
          </span>
          <span
            className={`font-mono text-lg font-bold ${
              isPhishing ? "text-destructive" : "text-primary"
            }`}
          >
            {confidence}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${isPhishing ? "bg-destructive" : "bg-primary"}`}
          />
        </div>
      </div>

      {/* Flags */}
      {data.flags.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-3">
            Detected Indicators ({data.flags.length})
          </h3>
          <div className="space-y-2">
            {data.flags.map((flag, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2 font-mono text-sm"
              >
                <AlertTriangle
                  className={`w-3.5 h-3.5 flex-shrink-0 ${
                    isPhishing ? "text-destructive" : "text-muted-foreground"
                  }`}
                />
                <span className="text-secondary-foreground">{flag}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Reset */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-border bg-secondary text-secondary-foreground font-mono text-sm uppercase tracking-wider hover:bg-muted transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Analyze Another Email
      </motion.button>
    </div>
  );
};

export default AnalysisResult;
