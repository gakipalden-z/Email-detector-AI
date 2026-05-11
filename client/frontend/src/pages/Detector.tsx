import { Shell } from "@/components/Shell";
import { EmailForm } from "@/components/EmailForm";
import { useEffect, useState } from "react";
import TwoFactorSetup from "@/components/TwoFactorSetup";
// DOTENV BACKEND_SERVER
const BACKEND_SERVER = process.env.BACKEND_SERVER;

type Model = {
  filename: string;
  size_kb?: number;
  type?: string;
};

type ModelData = {
  logistic_models: Model[];
  distilbert_models: Model[];
  vectorizers: Model[];
  other_files: string[];
};

export default function Detector() {
  const [modelData, setModelData] = useState<ModelData | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedModelType, setSelectedModelType] = useState<string>("logistic");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "PhishLens — AI-powered phishing detection";
    fetchAvailableModels();
  }, []);

  const fetchAvailableModels = async () => {
    try {
      const res = await fetch(`${BACKEND_SERVER}/models/list`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Fetched models:", data);
      
      if (data.models) {
        setModelData(data.models);
        
        // Auto-select the first available logistic model
        if (data.models.logistic_models && data.models.logistic_models.length > 0) {
          setSelectedModel(data.models.logistic_models[0].filename);
          setSelectedModelType("logistic");
        } 
        // Fallback to distilbert if no logistic models
        else if (data.models.distilbert_models && data.models.distilbert_models.length > 0) {
          setSelectedModel(data.models.distilbert_models[0].filename);
          setSelectedModelType("distilbert");
        }
      }
      
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch models:", err);
      setError("Failed to load models. Make sure the backend server is running.");
      setIsLoading(false);
    }
  };

  const handleModelTypeChange = (type: string) => {
    setSelectedModelType(type);
    
    // Select first model of the chosen type
    if (modelData) {
      if (type === "logistic" && modelData.logistic_models.length > 0) {
        setSelectedModel(modelData.logistic_models[0].filename);
      } else if (type === "distilbert" && modelData.distilbert_models.length > 0) {
        setSelectedModel(modelData.distilbert_models[0].filename);
      }
    }
  };

  const getAvailableModelsCount = () => {
    if (!modelData) return 0;
    return (modelData.logistic_models?.length || 0) + (modelData.distilbert_models?.length || 0);
  };

  const getSelectedModelInfo = () => {
    if (!modelData || !selectedModel) return null;
    
    // Check logistic models
    const logisticModel = modelData.logistic_models.find(m => m.filename === selectedModel);
    if (logisticModel) return { ...logisticModel, type: "logistic" };
    
    // Check distilbert models
    const distilbertModel = modelData.distilbert_models.find(m => m.filename === selectedModel);
    if (distilbertModel) return { ...distilbertModel, type: "distilbert" };
    
    return null;
  };

  const selectedModelInfo = getSelectedModelInfo();
  const availableModelsCount = getAvailableModelsCount();

  return (
    <Shell>
      <section className="mb-10 max-w-3xl animate-[var(--animate-fade-up)]">
        {/* Status Badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : error ? 'bg-destructive' : 'bg-success'}`} />
          {isLoading ? (
            "Loading models..."
          ) : error ? (
            "Connection error"
          ) : (
            `${availableModelsCount} model(s) available`
          )}
        </div>

        <h1 className="font-display text-5xl font-bold tracking-tight md:text-6xl">
          Is this email <span className="italic text-muted-foreground">trying to deceive</span> you?
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Paste an email below. PhishLens analyzes language, structure, and links — then explains exactly why it flagged or cleared the message.
        </p>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive flex items-center gap-2">
              <span>⚠️</span> {error}
            </p>
            <button 
              onClick={fetchAvailableModels}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Retry Connection
            </button>
          </div>
        )}
      </section>

      {/* Model Selection */}
      {!isLoading && !error && availableModelsCount > 0 && (
        <div className="mb-6 max-w-3xl space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Model Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleModelTypeChange("logistic")}
                disabled={!modelData?.logistic_models?.length}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedModelType === "logistic"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-accent"
                } ${!modelData?.logistic_models?.length ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Logistic Regression {modelData?.logistic_models?.length ? `(${modelData.logistic_models.length})` : ""}
              </button>
              <button
                onClick={() => handleModelTypeChange("distilbert")}
                disabled={!modelData?.distilbert_models?.length}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedModelType === "distilbert"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-accent"
                } ${!modelData?.distilbert_models?.length ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                DistilBERT {modelData?.distilbert_models?.length ? `(${modelData.distilbert_models.length})` : ""}
              </button>
            </div>
          </div>

          {/* Model Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Model
              {selectedModelInfo && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({selectedModelInfo.type === "logistic" ? "Fast" : "Deep Learning"})
                </span>
              )}
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="border border-border bg-card rounded-lg px-4 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {selectedModelType === "logistic" && modelData?.logistic_models.map((model) => (
                <option key={model.filename} value={model.filename}>
                  {model.filename.replace('logistic_', '').replace('.pkl', '')} 
                  {model.size_kb ? ` (${model.size_kb} KB)` : ''}
                </option>
              ))}
              {selectedModelType === "distilbert" && modelData?.distilbert_models.map((model) => (
                <option key={model.filename} value={model.filename}>
                  {model.filename.replace('distilbert_', '')}
                </option>
              ))}
            </select>
          </div>

          {/* Model Info */}
          {selectedModelInfo && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-0.5 bg-accent rounded-full">
                {selectedModelInfo.type === "logistic" ? "⚡ Fast" : "🧠 Deep Learning"}
              </span>
              {selectedModelInfo.size_kb && (
                <span className="px-2 py-0.5 bg-accent rounded-full">
                  📦 {selectedModelInfo.size_kb} KB
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && availableModelsCount === 0 && (
        <div className="mb-6 max-w-3xl p-6 bg-accent/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            No trained models available. Train a model first using the API or upload a pre-trained model.
          </p>
        </div>
      )}

      <EmailForm 
        selectedModel={selectedModel} 
        selectedModelType={selectedModelType}
      />
      <TwoFactorSetup />
    </Shell>
  );
}