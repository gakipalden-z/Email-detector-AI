import { useState, useEffect } from "react";
import { Loader2, Sparkles, Cpu, ChevronDown } from "lucide-react";
import { ResultCard } from "./ResultCard";
import toast from "react-hot-toast";

type Model = {
  id: string;
  name: string;
  type: string; // "logistic" or "distilbert"
  filename: string;
  size_kb?: number;
};

type PredictionResult = {
  input: string;
  prediction: string;
  confidence: number;
  explanation: string;
  model_used?: string;
};

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
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [selectedModelType, setSelectedModelType] = useState<string>("logistic");
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // Fetch available models from backend
  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await fetch("http://localhost:8000/models/list");
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Fetched models:", data);
      
      if (data.models) {
        const formattedModels: Model[] = [];
        
        // Add logistic regression models
        if (data.models.logistic_models && data.models.logistic_models.length > 0) {
          data.models.logistic_models.forEach((m: any) => {
            formattedModels.push({
              id: m.filename,
              name: `Logistic Regression (${m.filename.replace('logistic_', '').replace('.pkl', '')})`,
              type: "logistic",
              filename: m.filename,
              size_kb: m.size_kb,
            });
          });
        }
        
        // Add DistilBERT models
        if (data.models.distilbert_models && data.models.distilbert_models.length > 0) {
          data.models.distilbert_models.forEach((m: any) => {
            formattedModels.push({
              id: m.filename,
              name: `DistilBERT (${m.filename.replace('distilbert_', '')})`,
              type: "distilbert",
              filename: m.filename,
            });
          });
        }
        
        if (formattedModels.length > 0) {
          setModels(formattedModels);
          setSelectedModelId(formattedModels[0].id);
          setSelectedModelType(formattedModels[0].type);
        } else {
          // No models available
          setModels([]);
          toast.error("No models available. Train a model first.");
        }
      }
      
      setIsLoadingModels(false);
    } catch (err) {
      console.error("Failed to fetch models:", err);
      toast.error("Failed to load models. Is the backend running?");
      setIsLoadingModels(false);
    }
  };

  const activeModel = models.find((m) => m.id === selectedModelId);

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    const model = models.find(m => m.id === modelId);
    if (model) {
      setSelectedModelType(model.type);
    }
  };

  const submit = async () => {
    if (!text.trim()) {
      toast.error("Please enter an email to analyze");
      return;
    }
    
    if (!activeModel) {
      toast.error("Please select a model first");
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    // Combine subject, headers, and body
    const fullEmail = [subject, headers, text].filter(Boolean).join("\n");
    
    try {
      // Choose endpoint based on model type
      const endpoint = selectedModelType === "distilbert" 
        ? "http://localhost:8000/predict/distilbert"
        : "http://localhost:8000/predict/logistic";
      
      // Prepare request body
      const requestBody: any = {
        email_text: fullEmail,
      };
      
      // Add model_name for logistic models
      if (selectedModelType === "logistic") {
        requestBody.model_name = activeModel.filename;
      }
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Prediction failed");
      }
      
      const data = await res.json();
      setResult(data);
      toast.success("Analysis complete!");
      
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze email");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getModelInfo = () => {
    if (!activeModel) return { params: "~110M", latency: "~120ms" };
    
    if (activeModel.type === "logistic") {
      return { params: "~500K", latency: "~5ms" };
    } else {
      return { params: "~110M", latency: "~120ms" };
    }
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
                value={selectedModelId}
                onChange={(e) => handleModelChange(e.target.value)}
                className="appearance-none rounded-md border border-border bg-background py-1.5 pl-8 pr-7 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Select model"
                disabled={isLoadingModels || models.length === 0}
              >
                {isLoadingModels ? (
                  <option>Loading models...</option>
                ) : models.length === 0 ? (
                  <option>No models available</option>
                ) : (
                  models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.type === "logistic" ? "⚡" : "🧠"} {m.name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>

            <span className="hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
              {!isLoadingModels && activeModel && (
                <span>
                  {activeModel.type === "logistic" ? "Logistic Regression" : "DistilBERT"} · {getModelInfo().params}
                </span>
              )}
            </span>
          </div>

          <button
            onClick={submit}
            disabled={loading || !text.trim() || !activeModel}
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
            onClick={() => {
              setText(s);
              setSubject("");
              setHeaders("");
            }}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            sample {i + 1}
          </button>
        ))}
      </div>

      {result && <ResultCard result={result} originalText={text} modelType={selectedModelType} />}
    </div>
  );
}