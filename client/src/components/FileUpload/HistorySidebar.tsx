import React, { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface HistorySidebarProps {
  history: any[];
  activeId?: string;
  onSelect: (item: any) => void;
  onClear: () => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onBulkDownload: () => void;
  isOpen: boolean;
  onClose: () => void;
  storageUsage: string;
  animationsEnabled: boolean;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  history,
  activeId,
  onSelect,
  onClear,
  onDelete,
  onExport,
  onBulkDownload,
  isOpen,
  onClose,
  storageUsage,
  animationsEnabled,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 25 },
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-[70] w-80 bg-white dark:bg-[#0f0f0f] border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:h-[calc(100vh-80px)] lg:sticky lg:top-[80px] ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ contain: "layout" }}
      >
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500"
        >
          ✕
        </button>

        <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
          <span className="text-lg">🕒</span> Recent Analyses
        </h3>

        {/* --- The Glass Scrollbar Container --- */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
          <AnimatePresence mode="popLayout">
            {history.map((item) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                initial={animationsEnabled ? "hidden" : "visible"}
                animate="visible"
                exit="exit"
                layout={animationsEnabled}
                className="group relative"
              >
                <button
                  onClick={() => {
                    onSelect(item);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${activeId === item.id ? "border-violet-500 bg-violet-500/10" : "border-gray-100 dark:border-gray-800 hover:border-violet-500/50 bg-gray-50 dark:bg-[#1a1a1a]/40"}`}
                >
                  <div className="flex justify-between mb-1">
                    <p className="text-[9px] text-gray-500 truncate font-mono max-w-[120px]">
                      {item.filename}
                    </p>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
                      SAVED
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100 capitalize">
                      {item.genre || "N/A"}
                    </span>
                    <span className="text-xs font-bold text-violet-500">
                      {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* --- Footer Logic --- */}
        <div className="pt-6 mt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              Storage Status
            </span>
            <span className="text-xs font-mono font-bold text-violet-500">
              {storageUsage}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onExport}
              className="py-2.5 text-[10px] font-black text-violet-400 bg-violet-400/5 border border-violet-400/20 rounded-xl hover:bg-violet-400/10 transition-all uppercase"
            >
              JSON
            </button>
            <button
              onClick={onBulkDownload}
              className="py-2.5 text-[10px] font-black text-emerald-400 bg-emerald-400/5 border border-emerald-400/20 rounded-xl hover:bg-emerald-400/10 transition-all uppercase"
            >
              ZIP
            </button>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-3 text-[11px] font-bold text-red-500 bg-red-500/5 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-500/10 uppercase tracking-widest"
          >
            Wipe History
          </button>
        </div>
      </aside>

      {/* Confirmation Modal Logic */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#121826] border border-gray-800 rounded-[28px] p-8 max-w-[340px] w-full"
            >
              <p className="text-white text-lg font-bold text-center mb-8">
                Permanently clear history?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-4 bg-[#1f2937] text-gray-400 font-bold rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClear();
                    setShowConfirm(false);
                  }}
                  className="flex-1 py-4 bg-[#ff3333] text-white font-bold rounded-2xl"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HistorySidebar;
