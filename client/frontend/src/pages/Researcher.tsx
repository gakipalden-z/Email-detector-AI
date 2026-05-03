import { useEffect, useState, useRef } from "react";
import { Shell } from "@/components/Shell";
import { Database, Terminal, X, ChevronUp, ChevronDown, TrendingUp, TrendingDown, Award, BarChart3, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import TwoFactorSetup from "@/components/TwoFactorSetup";

type Dataset = {
  name: string;
  size: string;
  rows: string;
  status: "uploaded" | "processed" | "training" | "completed";
  training_status?: "pending" | "trained";
};

type LogEntry = {
  id: number;
  timestamp: Date;
  message: string;
  type: "info" | "success" | "error" | "warning";
  datasetName?: string;
};

type TrainingResult = {
  model: string;
  accuracy: number;
  f1_score: number;
  message?: string;
  label_mapping?: any;
};

export default function Researcher() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [trainModalOpen, setTrainModalOpen] = useState(false);
  const [trainingDataset, setTrainingDataset] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // =========================
  // ADD LOG ENTRY
  // =========================
  const addLog = (message: string, type: LogEntry["type"] = "info", datasetName?: string) => {
    const newLog: LogEntry = {
      id: Date.now(),
      timestamp: new Date(),
      message,
      type,
      datasetName,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // =========================
  // FETCH DATASETS
  // =========================
  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchTrainingResults = async (datasetName: string) => {
  addLog(`Fetching training results for ${datasetName}...`, "info", datasetName);
  
  try {
    const res = await fetch(`http://localhost:5000/api/datasets/results/${encodeURIComponent(datasetName)}`);
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to fetch results");
    }
    
    const data = await res.json();
    
    // Set the training result from backend data
    setTrainingResult({
      model: data.model,
      accuracy: data.accuracy,
      f1_score: data.f1_score,
    });
    
    setShowResults(true);
    addLog(`✅ Loaded training results for ${datasetName}`, "success", datasetName);
    
  } catch (err: any) {
    addLog(`❌ Failed to fetch results: ${err.message}`, "error", datasetName);
    toast.error(err.message);
  }
};

 const fetchDatasets = async () => {
  try {
    addLog("Fetching datasets from server...", "info");
    const res = await fetch("http://localhost:5000/api/datasets/all");
    const data = await res.json();

    console.log("Raw datasets response:", data);

    const formatted = data.map((d: any) => ({
      name: d.dataset_name || d.name,  // Use dataset_name from your schema
      size: d.size || "-",
      rows: d.total_rows || d.rows || "--",
      status: d.preprocessing_status || "uploaded",
      training_status: d.training_status  // This will be "completed" after training
    }));

    setDatasets(formatted);
    addLog(`Loaded ${formatted.length} datasets`, "success");
  } catch (err: any) {
    addLog(`Failed to fetch datasets: ${err.message}`, "error");
    console.error(err);
  }
};

  // =========================
  // FILE PICKER
  // =========================
  const handleClick = () => fileRef.current?.click();

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadDataset(file);
  };

  // =========================
  // UPLOAD DATASET
  // =========================
  const uploadDataset = async (file: File) => {
    setIsProcessing(true);
    addLog(`Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`, "info");
    
    try {
      toast.loading("Uploading dataset...");

      const formData = new FormData();
      formData.append("dataset", file);

      addLog(`Sending ${file.name} to server...`, "info", file.name);

      const res = await fetch("http://localhost:5000/api/datasets/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setDatasets((prev) => [
        ...prev,
        {
          name: data.file.displayName,
          size: (file.size / 1024 / 1024).toFixed(2) + " MB",
          rows: "--",
          status: "uploaded",
        },
      ]);

      addLog(`✅ Upload successful: ${data.file.displayName}`, "success", data.file.displayName);
      addLog(`File stored as: ${data.file.storedName}`, "info", data.file.displayName);

      toast.dismiss();
      toast.success("Upload successful ✅");
    } catch (err: any) {
      addLog(`❌ Upload failed: ${err.message}`, "error", file.name);
      toast.dismiss();
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // =========================
  // PREPROCESS
  // =========================
  const preprocessDataset = async (name: string) => {
    setIsProcessing(true);
    addLog(`Starting preprocessing for: ${name}`, "info", name);
    
    try {
      toast.loading("Preprocessing...");

      addLog(`Analyzing dataset structure...`, "info", name);
      addLog(`Applying preprocessing steps (cleaning, encoding)...`, "info", name);

      const res = await fetch("http://localhost:5000/api/datasets/preprocess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dataset: name, column: "Email Text" }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      const result = await res.json();
      
      setDatasets((prev) =>
        prev.map((d) =>
          d.name === name ? { ...d, status: "processed", rows: result.rows || d.rows } : d
        )
      );

      addLog(`✅ Preprocessing completed for: ${name}`, "success", name);
      if (result.rows) {
        addLog(`Dataset contains ${result.rows} rows and ${result.columns} columns`, "info", name);
      }

      toast.dismiss();
      toast.success("Preprocessing done ✅");
    } catch (err: any) {
      addLog(`❌ Preprocessing failed for ${name}: ${err.message}`, "error", name);
      toast.dismiss();
      toast.error("Preprocessing failed ❌");
    } finally {
      setIsProcessing(false);
    }
  };

  // =========================
  // TRAIN MODEL
  // =========================
 const startTraining = async () => {
  if (!trainingDataset || !selectedModel) return;

  setIsProcessing(true);
  setShowResults(false);
  setTrainingResult(null);
  
  addLog(`🚀 Starting training on "${trainingDataset}" with model: ${selectedModel}`, "info", trainingDataset);

  try {
    toast.loading("Training in progress...");

    addLog(`Initializing ${selectedModel} model...`, "info", trainingDataset);
    addLog(`Splitting data into train/test sets...`, "info", trainingDataset);
    addLog(`Training in progress... this may take a few minutes`, "warning", trainingDataset);

    const res = await fetch("http://localhost:5000/api/datasets/train", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dataset: trainingDataset,
        model: selectedModel.toLowerCase(),
        text_column: "Email Text",
        label_column: "Email Type",
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || error.message);
    }

    const result = await res.json();
    
    // Store the training result
    setTrainingResult(result);
    setShowResults(true);

    // ✅ IMPORTANT: Refresh datasets from backend to get updated training_status
    await fetchDatasets();

    // Add success log with metrics
    addLog(`✅ Training completed successfully for ${trainingDataset}!`, "success", trainingDataset);
    addLog(`📊 Model: ${result.model}`, "success", trainingDataset);
    addLog(`🎯 Accuracy: ${(result.accuracy * 100).toFixed(2)}%`, "success", trainingDataset);
    addLog(`📈 F1 Score: ${(result.f1_score * 100).toFixed(2)}%`, "success", trainingDataset);

    setTrainModalOpen(false);
    setSelectedModel(null);

    toast.dismiss();
    toast.success("Training completed successfully! 🎉");
    
  } catch (err: any) {
    addLog(`❌ Training failed: ${err.message}`, "error", trainingDataset);
    toast.dismiss();
    toast.error(err.message || "Training failed ❌");
  } finally {
    setIsProcessing(false);
  }
};

  // =========================
  // CLEAR LOGS
  // =========================
  const clearLogs = () => {
    setLogs([]);
    addLog("Logs cleared", "info");
  };

  // =========================
  // GET LOG STYLE
  // =========================
  const getLogStyle = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-green-600 border-l-4 border-green-600";
      case "error":
        return "text-red-600 border-l-4 border-red-600";
      case "warning":
        return "text-yellow-600 border-l-4 border-yellow-600";
      default:
        return "text-gray-600 border-l-4 border-gray-400";
    }
  };

  // =========================
  // GET PERFORMANCE COLOR
  // =========================
  const getPerformanceColor = (value: number) => {
    if (value >= 0.9) return "text-green-600";
    if (value >= 0.7) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (value: number) => {
    if (value >= 0.9) return "bg-green-500";
    if (value >= 0.7) return "bg-yellow-500";
    return "bg-red-500";
  };

  console.log("Current datasets state:", datasets);
  // =========================
  // UI
  // =========================
  return (
    <Shell>
      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Researcher Dashboard</h1>

        <div>
          <input
            type="file"
            ref={fileRef}
            className="hidden"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isProcessing}
          />

          <button
            onClick={handleClick}
            disabled={isProcessing}
            className="border px-4 py-2 rounded-md flex gap-2 items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Database size={16} /> Upload Dataset
          </button>
        </div>
      </div>

      {/* TRAINING RESULTS MODAL */}
      {showResults && trainingResult && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl w-[500px] max-w-[90vw] shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle2 className="text-green-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Training Complete!</h2>
                  <p className="text-sm text-gray-500">{trainingResult.model}</p>
                </div>
              </div>
              <button
                onClick={() => setShowResults(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Accuracy Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Accuracy</p>
                    <p className={`text-3xl font-bold ${getPerformanceColor(trainingResult.accuracy)}`}>
                      {(trainingResult.accuracy * 100).toFixed(2)}%
                    </p>
                  </div>
                  <Award className="text-blue-500" size={32} />
                </div>
                <div className="mt-3">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(trainingResult.accuracy)} transition-all duration-1000`}
                      style={{ width: `${trainingResult.accuracy * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* F1 Score Card */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">F1 Score</p>
                    <p className={`text-3xl font-bold ${getPerformanceColor(trainingResult.f1_score)}`}>
                      {(trainingResult.f1_score * 100).toFixed(2)}%
                    </p>
                  </div>
                  <BarChart3 className="text-purple-500" size={32} />
                </div>
                <div className="mt-3">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(trainingResult.f1_score)} transition-all duration-1000`}
                      style={{ width: `${trainingResult.f1_score * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="border-t pt-4">
                <div className="flex gap-4 justify-around">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      {trainingResult.accuracy >= 0.8 ? (
                        <TrendingUp size={16} className="text-green-500" />
                      ) : (
                        <TrendingDown size={16} className="text-red-500" />
                      )}
                      <span>Performance</span>
                    </div>
                    <p className="text-sm font-medium mt-1">
                      {trainingResult.accuracy >= 0.9 ? "Excellent" : 
                       trainingResult.accuracy >= 0.7 ? "Good" : 
                       "Needs Improvement"}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Database size={16} />
                      <span>Model Type</span>
                    </div>
                    <p className="text-sm font-medium mt-1">Classfication</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowResults(false)}
                className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DATASETS SECTION */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Datasets</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {datasets.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-gray-500 border rounded-xl">
                No datasets uploaded yet. Click "Upload Dataset" to get started.
              </div>
            ) : (
              datasets.map((d) => (
                <div
  key={d.name}
  className="border rounded-xl p-4 shadow-sm hover:shadow-md transition relative"
>
  {/* Header with Title and Publish Icon */}
  <div className="flex justify-between items-start mb-2">
    <h3 className="font-semibold break-all flex-1 pr-2">{d.name}</h3>
    
    {/* Small Publish Icon - Top Right Corner (only when trained) */}
    {d.training_status === "trained" && (
      <button
        onClick={() => {
          addLog(`Publishing ${d.name}...`, "info", d.name);
          toast.success(`Published ${d.name}!`);
          // Add your publish API call here later
        }}
        className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition shrink-0"
        title="Publish model"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>
    )}
  </div>

  {/* Dataset Info */}
  <p className="text-sm text-gray-500">
    {d.size} • {d.rows} rows
  </p>

  {/* Status Badges */}
  <div className="flex gap-2 mt-3 text-xs">
    {["uploaded", "processed", "training", "completed"].map(
      (s) => (
        <span
          key={s}
          className={`px-2 py-1 rounded-full ${
            d.status === s
              ? "bg-black text-white"
              : "bg-gray-200"
          }`}
        >
          {s}
        </span>
      )
    )}
  </div>

  {/* Action Buttons */}
  <div className="mt-4">
    {(d.status === "uploaded" || d.status === "pending") && (
      <button
        onClick={() => preprocessDataset(d.name)}
        disabled={isProcessing}
        className="w-full border py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Preprocess
      </button>
    )}

    {(d.status === "processed" && d.training_status !== "trained") && (
      <button
        onClick={() => {
          setTrainingDataset(d.name);
          setTrainModalOpen(true);
        }}
        disabled={isProcessing}
        className="w-full bg-black text-white py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Train Model
      </button>
    )}

    {d.status === "training" && (
      <div className="text-center">
        <p className="text-yellow-600 text-sm mb-2">
          Training in progress...
        </p>
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-500 animate-pulse rounded-full" style={{ width: '60%' }} />
        </div>
      </div>
    )}

    {/* View Results Button - Full width at bottom (only when trained) */}
    {d.training_status === "trained" && (
      <button 
        onClick={() => fetchTrainingResults(d.name)}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 rounded hover:from-green-600 hover:to-emerald-600 transition"
      >
        View Results
      </button>
    )}
  </div>
</div>
              ))
            )}
          </div>
        </div>

        {/* LOGS SECTION */}
        <div className="lg:col-span-1">
          <div className="border rounded-xl overflow-hidden sticky top-4">
            {/* Log Header */}
            <div 
              className="flex justify-between items-center p-3 bg-gray-50 border-b cursor-pointer hover:bg-gray-100"
              onClick={() => setIsLogPanelOpen(!isLogPanelOpen)}
            >
              <div className="flex items-center gap-2">
                <Terminal size={18} />
                <h2 className="font-semibold">Activity Log</h2>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                  {logs.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearLogs();
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
                {isLogPanelOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>

            {/* Log Content */}
            {isLogPanelOpen && (
              <>
                <div 
                  ref={logContainerRef}
                  className="h-96 overflow-y-auto p-3 space-y-2 bg-gray-50"
                >
                  {logs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No activity yet. Upload a dataset to see logs here.
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.message + log.timestamp.getTime()}
                        className={`text-xs p-2 rounded bg-white shadow-sm ${getLogStyle(log.type)}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <span className="font-mono text-gray-400">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                            {" "}
                            <span className={log.type === "error" ? "font-semibold" : ""}>
                              {log.message}
                            </span>
                            {log.datasetName && (
                              <span className="ml-1 text-blue-600">
                                [{log.datasetName}]
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Log Footer */}
                {logs.length > 0 && (
                  <div className="p-2 bg-gray-100 border-t text-xs text-gray-500 text-center">
                    Last updated: {logs[logs.length - 1]?.timestamp.toLocaleTimeString()}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* TRAIN MODAL */}
      {trainModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-[350px]">
            <h2 className="text-lg font-semibold mb-4">
              Select Model for {trainingDataset}
            </h2>

            {["logistic", "distilbert"].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedModel(m)}
                className={`block w-full text-left border p-2 mb-2 rounded ${
                  selectedModel === m
                    ? "bg-black text-white"
                    : ""
                }`}
              >
                {m === "logistic" ? "Logistic Regression" : "DistilBERT"}
              </button>
            ))}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setTrainModalOpen(false)}
                className="flex-1 border py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={startTraining}
                disabled={!selectedModel || isProcessing}
                className="flex-1 bg-black text-white py-2 rounded disabled:opacity-50"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}
      
      <TwoFactorSetup />
    </Shell>
  );
}