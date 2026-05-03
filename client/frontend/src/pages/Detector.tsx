import { Shell } from "@/components/Shell";
import { EmailForm } from "@/components/EmailForm";
import { useEffect, useState } from "react";
import TwoFactorSetup from "@/components/TwoFactorSetup";

type Model = {
  name: string;
  model_type: string;
  accuracy: number;
  trained_at: string;
};

export default function Detector() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "PhishLens — AI-powered phishing detection";
    fetchAvailableModels();
  }, []);

  const fetchAvailableModels = async () => {
    try {
      // Fetch from your Node.js backend (port 8000) that has the model list
      const res = await fetch("http://localhost:8000/models/list");
      const data = await res.json();
      console.log("Fetched models:", data);
      
      if (data.models && data.models.length > 0) {
        setModels(data.models);
        setSelectedModel(data.models[0].name);
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch models:", err);
      setIsLoading(false);
    }
  };

  return (
    <Shell>
      <section className="mb-10 max-w-3xl animate-[var(--animate-fade-up)]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {isLoading ? "Loading models..." : `${models.length} model(s) available`}
        </div>
        <h1 className="font-display text-5xl font-bold tracking-tight md:text-6xl">
          Is this email <span className="italic text-muted-foreground">trying to deceive</span> you?
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Paste an email below. PhishLens analyzes language, structure, and links — then explains exactly why it flagged or cleared the message.
        </p>
      </section>

      {/* Model Selector */}
      {models.length > 0 && (
        <div className="mb-6 max-w-3xl">
          <label className="block text-sm font-medium mb-2">Select Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="border rounded-lg px-4 py-2 w-full max-w-md"
          >
            {models.map((model) => (
              <option key={model.name} value={model.name}>
                {model.name} - {(model.accuracy * 100).toFixed(2)}% accuracy
              </option>
            ))}
          </select>
        </div>
      )}

      <EmailForm selectedModel={selectedModel} />
      <TwoFactorSetup />
    </Shell>
  );
}