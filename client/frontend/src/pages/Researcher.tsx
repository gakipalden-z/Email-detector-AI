import { useEffect, useState, useRef } from "react";
import { Shell } from "@/components/Shell";
import { Database } from "lucide-react";
import toast from "react-hot-toast";

type Dataset = {
  name: string;
  size: string;
  rows: string;
  status: "uploaded" | "processed" | "training" | "completed";
};

export default function Researcher() {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [trainModalOpen, setTrainModalOpen] = useState(false);
  const [trainingDataset, setTrainingDataset] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  // =========================
  // FETCH DATASETS
  // =========================
  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/datasets/all");
      const data = await res.json();

      // Normalize backend data
      const formatted = data.map((d: any) => ({
        name: d.name,
        size: d.size || "-",
        rows: d.rows || "--",
        status: d.status || "uploaded",
      }));

      setDatasets(formatted);
    } catch (err) {
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
    try {
      toast.loading("Uploading dataset...");

      const formData = new FormData();
      formData.append("file", file); // ✅ FIXED

      const res = await fetch("http://localhost:5000/api/datasets/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setDatasets((prev) => [
        ...prev,
        {
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2) + " MB",
          rows: "--",
          status: "uploaded",
        },
      ]);

      toast.dismiss();
      toast.success("Upload successful ✅");
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message);
    }
  };

  // =========================
  // PREPROCESS
  // =========================
  const preprocessDataset = async (name: string) => {
    try {
      toast.loading("Preprocessing...");

      await fetch("http://localhost:5000/api/datasets/preprocess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dataset: name }),
      });

      setDatasets((prev) =>
        prev.map((d) =>
          d.name === name ? { ...d, status: "processed" } : d
        )
      );

      toast.dismiss();
      toast.success("Preprocessing done ✅");
    } catch {
      toast.dismiss();
      toast.error("Preprocessing failed ❌");
    }
  };

  // =========================
  // TRAIN MODEL
  // =========================
  const startTraining = async () => {
    if (!trainingDataset || !selectedModel) return;

    try {
      toast.loading("Training started...");

      await fetch("http://localhost:5000/api/models/train", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataset: trainingDataset,
          model: selectedModel,
        }),
      });

      setDatasets((prev) =>
        prev.map((d) =>
          d.name === trainingDataset
            ? { ...d, status: "training" }
            : d
        )
      );

      setTrainModalOpen(false);
      setSelectedModel(null);

      toast.dismiss();
      toast.success("Training started 🚀");
    } catch {
      toast.dismiss();
      toast.error("Training failed ❌");
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
          />

          <button
            onClick={handleClick}
            className="border px-4 py-2 rounded-md flex gap-2 items-center"
          >
            <Database size={16} /> Upload Dataset
          </button>
        </div>
      </div>

      {/* DATASETS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {datasets.map((d) => (
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
              {d.status === "uploaded" && (
                <button
                  onClick={() => preprocessDataset(d.name)}
                  className="w-full border py-2 rounded"
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
                  className="w-full bg-black text-white py-2 rounded"
                >
                  Train Model
                </button>
              )}

              {d.status === "training" && (
                <p className="text-yellow-600 text-sm">
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
        ))}
      </div>

      {/* TRAIN MODAL */}
      {trainModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-[350px]">
            <h2 className="text-lg font-semibold mb-4">
              Select Model
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
                disabled={!selectedModel}
                className="flex-1 bg-black text-white py-2 rounded"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}