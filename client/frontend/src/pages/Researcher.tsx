import { useEffect, useState, useRef } from "react";
import { Shell } from "@/components/Shell";
import { Database, Terminal, X, ChevronUp, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import TwoFactorSetup from "@/components/TwoFactorSetup";

type Dataset = {
  name: string;
  size: string;
  rows: string;
  status: "uploaded" | "processed" | "training" | "completed";
};

type LogEntry = {
  id: number;
  timestamp: Date;
  message: string;
  type: "info" | "success" | "error" | "warning";
  datasetName?: string;
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

  const fetchDatasets = async () => {
    try {
      addLog("Fetching datasets from server...", "info");
      const res = await fetch("http://localhost:5000/api/datasets/all");
      const data = await res.json();

      const formatted = data.map((d: any) => ({
        name: d.name,
        size: d.size || "-",
        rows: d.rows || "--",
        status: d.preprocessing_status || "uploaded",
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
      console.log("data ", data);

      if (!res.ok) throw new Error(data.error);

      setDatasets((prev) => [
        ...prev,
        {
          name: data.file.displayName, // Changed to displayName for UI
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
      console.log("name", name);

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
    addLog(`🚀 Starting training on "${trainingDataset}" with model: ${selectedModel}`, "info", trainingDataset);

    try {
      toast.loading("Training started...");

      addLog(`Initializing ${selectedModel} model...`, "info", trainingDataset);
      addLog(`Splitting data into train/test sets...`, "info", trainingDataset);
      addLog(`Training in progress... this may take a few minutes`, "warning", trainingDataset);

      const res = await fetch("http://localhost:5000/api/models/train", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataset: trainingDataset,
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      const result = await res.json();

      setDatasets((prev) =>
        prev.map((d) =>
          d.name === trainingDataset
            ? { ...d, status: "training" }
            : d
        )
      );

      addLog(`✅ Training started successfully for ${trainingDataset}`, "success", trainingDataset);
      addLog(`Training job ID: ${result.jobId || 'N/A'}`, "info", trainingDataset);
      addLog(`Expected completion: ~5-10 minutes`, "info", trainingDataset);

      setTrainModalOpen(false);
      setSelectedModel(null);

      toast.dismiss();
      toast.success("Training started 🚀");
    } catch (err: any) {
      addLog(`❌ Training failed for ${trainingDataset}: ${err.message}`, "error", trainingDataset);
      toast.dismiss();
      toast.error("Training failed ❌");
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
                  className="border rounded-xl p-4 shadow-sm hover:shadow-md transition"
                >
                  <h3 className="font-semibold">{d.name}</h3>

                  <p className="text-sm text-gray-500">
                    {d.size} • {d.rows} rows
                  </p>

                  {/* STATUS */}
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

                  {/* ACTION */}
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

                    {d.status === "processed" && (
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
                      <p className="text-yellow-600 text-sm text-center">
                        Training in progress...
                      </p>
                    )}

                    {d.status === "completed" && (
                      <button className="w-full border py-2 rounded">
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
                        key={log.id}
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

            {["Logistic Regression", "BERT", "DistilBERT"].map(
              (m) => (
                <button
                  key={m}
                  onClick={() => setSelectedModel(m)}
                  className={`block w-full text-left border p-2 mb-2 rounded ${
                    selectedModel === m
                      ? "bg-black text-white"
                      : ""
                  }`}
                >
                  {m}
                </button>
              )
            )}

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