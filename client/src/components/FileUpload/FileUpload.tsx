import React, { useState, useEffect } from "react";
import JSZip from "jszip"; // Required for Bulk Download
import HistorySidebar from "./HistorySidebar";
import ResultCard from "./ResultCard";

// --- IndexedDB Manager ---
const DB_NAME = "MediaClassifierDB";
const STORE_NAME = "files";

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveFileToDB = async (id: string, file: File) => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put(file, id);
  return new Promise((res) => (tx.oncomplete = res));
};

const getFileFromDB = async (id: string): Promise<File | null> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
};

const deleteFileFromDB = async (id: string) => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).delete(id);
};

const clearDB = async () => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).clear();
};

const calculateStorageSize = async (): Promise<string> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const files = request.result as File[];
      const totalBytes = files.reduce((acc, file) => acc + file.size, 0);
      if (totalBytes === 0) resolve("0 KB");
      const kbs = totalBytes / 1024;
      resolve(
        kbs > 1024 ? `${(kbs / 1024).toFixed(1)} MB` : `${Math.round(kbs)} KB`,
      );
    };
  });
};

interface FileUploadProps {
  showCharts: boolean;
  animationsEnabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  showCharts,
  animationsEnabled,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [storageUsage, setStorageUsage] = useState("0 KB");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("genre_history");
    if (saved) setHistory(JSON.parse(saved));
    updateStorageDisplay();
  }, []);

  const updateStorageDisplay = async () => {
    const size = await calculateStorageSize();
    setStorageUsage(size);
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleSelectHistory = async (item: any) => {
    setResult(item);
    const file = await getFileFromDB(item.id);
    if (file) setSelectedFile(file);
    else setToast({ message: "Original file missing", type: "error" });
  };

  const handleDelete = async (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem("genre_history", JSON.stringify(updated));
    await deleteFileFromDB(id);
    await updateStorageDisplay();
    if (result?.id === id) {
      setResult(null);
      setSelectedFile(null);
    }
    setToast({ message: "Classification removed", type: "info" });
  };

  const handleClearAll = async () => {
    setHistory([]);
    localStorage.removeItem("genre_history");
    await clearDB();
    await updateStorageDisplay();
    setResult(null);
    setSelectedFile(null);
    setToast({ message: "History cleared", type: "info" });
  };

  // Export JSON Metadata
  const handleExportHistory = () => {
    if (history.length === 0) return;
    const blob = new Blob([JSON.stringify(history, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `genre_history_${Date.now()}.json`;
    a.click();
    setToast({ message: "Metadata exported", type: "success" });
  };

  // --- BULK DOWNLOAD WITH CHART DATA ---
  const handleBulkDownload = async () => {
    if (history.length === 0) {
      setToast({ message: "No history to package", type: "info" });
      return;
    }

    setToast({ message: "Generating bundle with chart data...", type: "info" });

    try {
      const zip = new JSZip();
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);

      let manifestText = "AI MEDIA ANALYSIS BUNDLE REPORT\n";
      manifestText += "================================\n\n";

      // Fetch all files from IndexedDB
      const filesMap = await new Promise<Map<string, File>>((resolve) => {
        const map = new Map();
        const request = store.openCursor();
        request.onsuccess = (e: any) => {
          const cursor = e.target.result;
          if (cursor) {
            map.set(cursor.key, cursor.value);
            cursor.continue();
          } else {
            resolve(map);
          }
        };
      });

      // Process each history item
      history.forEach((entry, index) => {
        const file = filesMap.get(entry.id);
        const folderName = `Analysis_${index + 1}`;
        const genreLabel = (entry.genre || "Unknown").toUpperCase();

        if (file) {
          // 1. Add Media File
          zip.file(`${folderName}/${genreLabel} - ${entry.filename}`, file);

          // 2. Add full JSON data for this specific file (The "Chart Details")
          zip.file(
            `${folderName}/analysis_data.json`,
            JSON.stringify(entry, null, 2),
          );

          // 3. Update the human-readable manifest
          manifestText += `File: ${entry.filename}\n`;
          manifestText += `Classified Genre: ${genreLabel}\n`;
          manifestText += `Confidence: ${Math.round(entry.confidence * 100)}%\n`;

          // Add Genre Breakdown (Chart Data) to text file
          if (entry.probabilities) {
            manifestText += `PROBABILITY BREAKDOWN:\n`;
            Object.entries(entry.probabilities).forEach(
              ([genre, score]: any) => {
                manifestText += `  - ${genre}: ${Math.round(score * 100)}%\n`;
              },
            );
          }

          manifestText += `Analyzed On: ${new Date(entry.timestamp).toLocaleString()}\n`;
          manifestText += `--------------------------------\n\n`;
        }
      });

      zip.file("SUMMARY_REPORT.txt", manifestText);

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Media_AI_Report_${Date.now()}.zip`;
      a.click();

      setToast({ message: "ZIP with Chart Details ready!", type: "success" });
    } catch (err) {
      setToast({ message: "ZIP creation failed", type: "error" });
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("media_file", selectedFile);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/v1/classify-media`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed.");

      const isDuplicate = history.find(
        (item) =>
          item.filename === selectedFile.name && item.genre === data.genre,
      );
      if (isDuplicate) {
        setResult(isDuplicate);
        setToast({ message: "Showing cached result", type: "info" });
        setIsLoading(false);
        return;
      }

      const itemId = Date.now().toString();
      const newItem = {
        ...data,
        id: itemId,
        timestamp: Date.now(),
        filename: selectedFile.name,
      };

      await saveFileToDB(itemId, selectedFile);
      const updated = [newItem, ...history].slice(0, 10);
      setHistory(updated);
      setResult(newItem);
      localStorage.setItem("genre_history", JSON.stringify(updated));
      await updateStorageDisplay();
      setToast({ message: "Analysis successful!", type: "success" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col lg:flex-row min-h-screen bg-transparent transition-colors duration-500">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <div
            className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md pointer-events-auto animate-slide-down ${
              toast.type === "success"
                ? "bg-emerald-500/90 border-emerald-400 text-white"
                : toast.type === "error"
                  ? "bg-red-500/90 border-red-400 text-white"
                  : "bg-zinc-900/90 border-zinc-700 text-zinc-100"
            }`}
          >
            <span className="text-sm font-bold tracking-wide">
              {toast.message}
            </span>
          </div>
        </div>
      )}

      {/* Mobile Menu FAB */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-violet-600 text-white rounded-full shadow-2xl active:scale-95 transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 8v4l3 3" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      </button>

      <style>{`
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-down { animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.3); border-radius: 10px; }
      `}</style>

      <HistorySidebar
        history={history}
        activeId={result?.id}
        onSelect={handleSelectHistory}
        onClear={handleClearAll}
        onDelete={handleDelete}
        onExport={handleExportHistory}
        onBulkDownload={handleBulkDownload} // Pass new function
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        storageUsage={storageUsage}
        animationsEnabled={animationsEnabled}
      />

      <main className="flex-1 p-4 lg:p-8">
        <div className="bg-white dark:bg-[#121212] p-6 lg:p-10 rounded-3xl shadow-2xl w-full max-w-4xl mx-auto border border-gray-100 dark:border-gray-800 transition-all">
          <header className="text-center mb-10">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
              Media Genre AI
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
              Real-time classification from your browser
            </p>
          </header>

          <div className="group relative border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-6 lg:p-12 text-center hover:border-violet-500 bg-gray-50/50 dark:bg-gray-900/10 transition-all">
            <input
              type="file"
              accept="audio/*,video/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setSelectedFile(e.target.files[0]);
                  setError(null);
                  setResult(null);
                }
              }}
            />
            <div className="flex flex-col items-center gap-3 pointer-events-none">
              <div className="p-4 bg-violet-100 dark:bg-violet-900/30 rounded-full text-violet-600 group-hover:scale-110 transition-transform">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="font-bold text-gray-700 dark:text-gray-300">
                {selectedFile ? selectedFile.name : "Drop file here"}
              </p>
            </div>
          </div>

          {selectedFile && previewUrl && (
            <section className="mt-8 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              {selectedFile.type.startsWith("video/") ? (
                <video
                  src={previewUrl}
                  controls
                  className="w-full rounded-xl max-h-80 bg-black"
                />
              ) : (
                <div className="py-4 px-2">
                  <audio src={previewUrl} controls className="w-full" />
                </div>
              )}
            </section>
          )}

          <footer className="mt-10">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !selectedFile}
              className="w-full py-5 bg-violet-600 hover:bg-violet-700 text-white font-black text-lg rounded-2xl disabled:opacity-50 shadow-xl active:scale-[0.98] transition-all tracking-widest"
            >
              {isLoading ? "ANALYZING..." : "START CLASSIFICATION"}
            </button>
            {error && (
              <p className="mt-4 text-center text-red-500 font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                {error}
              </p>
            )}
          </footer>

          {result && (
            <div className="mt-12">
              <ResultCard
                result={result}
                noAudioDetected={result.has_audio === false}
                showCharts={showCharts}
                animationsEnabled={animationsEnabled}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FileUpload;
