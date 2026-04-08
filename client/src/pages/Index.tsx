import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, ShieldCheck, Loader2, Terminal, AlertTriangle } from "lucide-react";
import EmailInput from "@/components/EmailInput";
import AnalysisResult from "@/components/AnalysisResult";
import ScanAnimation from "@/components/ScanAnimation";

export type AnalysisStatus = "idle" | "scanning" | "safe" | "phishing";

export interface AnalysisData {
  status: AnalysisStatus;
  confidence: number;
  flags: string[];
  summary: string;
}




const Index = () => {
  const [analysis, setAnalysis] = useState<AnalysisData>({ status: "idle", confidence: 0, flags: [], summary: "" });

 const handleAnalyze = async (text: string) => {
  console.log("test", text)
  setAnalysis({ status: "scanning", confidence: 0, flags: [], summary: "" });

  try {
    console.log("hsjahvs")
    const res = await fetch("http://127.0.0.1:5000/api/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({email_text: text}), // 👈 send email content
    });

    console.log("scjbacb", res)

    const data = await res.json();

    console.log("API Response:", data);

    // 👉 map backend response to your UI format
    setAnalysis({
      status: data.message.prediction == "Safe Email" ? "Safe Email" : "Phishing Email",
      confidence: data.message.confidence || 90,
      flags: data.message.flags || [],
      summary: data.message || "Analysis completed",
    });

  } catch (error) {
    console.error("API Error:", error);

    setAnalysis({
      status: "Phishing Email",
      confidence: 0,
      flags: [],
      summary: "Failed to connect to detection server.",
    });
  }
};

  const handleReset = () => {
    setAnalysis({ status: "idle", confidence: 0, flags: [], summary: "" });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Scanline overlay */}
      <div className="fixed inset-0 scanline pointer-events-none z-50" />

      {/* Grid background */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(145 80% 42%) 1px, transparent 1px), linear-gradient(90deg, hsl(145 80% 42%) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-mono font-bold text-primary text-glow tracking-tight">
              PHISHGUARD
            </h1>
          </div>
          <p className="font-mono text-muted-foreground text-sm tracking-widest uppercase">
            AI-Powered Email Threat Detection System
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>NLP Engine Online — DistilBERT v2.1</span>
          </div>
        </motion.header>

        {/* Main content */}
        <AnimatePresence mode="wait">
          {analysis.status === "idle" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <EmailInput onAnalyze={handleAnalyze} />
            </motion.div>
          )}

          {analysis.status === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ScanAnimation />
            </motion.div>
          )}

          {(analysis.status == "Phishing Email" || analysis.status === "Safe Email") && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <AnalysisResult data={analysis} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center font-mono text-xs text-muted-foreground"
        >
          <div className="flex items-center justify-center gap-2">
            <Terminal className="w-3 h-3" />
            <span>PhishGuard v1.0 — Client-Side Analysis Module</span>
          </div>
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
