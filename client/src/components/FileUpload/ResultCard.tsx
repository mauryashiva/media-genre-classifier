import React from "react";
import { motion, type Variants } from "framer-motion"; // Added 'type' keyword here
import DonutChart from "./DonutChart";

const COLORS = ["#4C1D95", "#6D28D9", "#8B5CF6"];

interface ResultCardProps {
  result: any;
  noAudioDetected: boolean;
  showCharts: boolean;
  animationsEnabled: boolean;
}

const ResultCard: React.FC<ResultCardProps> = ({
  result,
  noAudioDetected,
  showCharts,
  animationsEnabled,
}) => {
  // HIGH-LEVEL MOTION VARIANTS
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.6,
        staggerChildren: 0.15, // Creates a nice cascading effect
        ease: [0.22, 1, 0.36, 1], // Custom "Video Edit" cubic-bezier
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -30, filter: "blur(5px)" },
    visible: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring" as const,
        stiffness: 150,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      initial={animationsEnabled ? "hidden" : "visible"}
      animate="visible"
      variants={containerVariants}
      className="mt-10 p-8 bg-white dark:bg-[#0f0f0f] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
    >
      {/* Cinematic Background Glow */}
      {animationsEnabled && (
        <motion.div
          animate={{
            opacity: [0.1, 0.25, 0.1],
            scale: [1, 1.3, 1],
            x: [0, 20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-violet-600/20 blur-[120px] pointer-events-none"
        />
      )}

      <div className="relative z-10">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center justify-between">
          <motion.span variants={itemVariants}>
            Classification Result
          </motion.span>
          <motion.span
            variants={itemVariants}
            className="text-[10px] font-mono text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border dark:border-gray-700"
          >
            {result.filename}
          </motion.span>
        </h3>

        {noAudioDetected ? (
          <motion.div
            variants={itemVariants}
            className="text-center py-12 px-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-violet-300 dark:border-violet-800"
          >
            <motion.p
              animate={
                animationsEnabled
                  ? {
                      scale: [1, 1.15, 1],
                      rotate: [0, 5, -5, 0],
                    }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 3 }}
              className="text-6xl mb-4"
            >
              🎧
            </motion.p>
            <h4 className="text-xl font-bold mb-2 dark:text-white">
              No Audio Detected
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              This file does not contain a valid audio stream.
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between mb-8 pb-6 border-b dark:border-gray-800"
            >
              <div>
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                  Detected Genre
                </div>
                <motion.div className="text-5xl font-black text-violet-700 dark:text-violet-400 capitalize tracking-tight">
                  {result.genre}
                </motion.div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                  Confidence Score
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-3xl font-bold dark:text-white"
                >
                  {Math.round(result.confidence * 100)}%
                </motion.div>
              </div>
            </motion.div>

            {showCharts && result.top_3_genres && (
              <div className="flex flex-col md:flex-row items-center gap-12">
                <motion.div
                  variants={itemVariants}
                  whileHover={
                    animationsEnabled ? { scale: 1.08, rotate: -2 } : {}
                  }
                  className="relative p-2"
                >
                  <DonutChart
                    data={result.top_3_genres}
                    animationsEnabled={animationsEnabled}
                  />
                </motion.div>

                <div className="w-full md:w-2/3 space-y-3">
                  {result.top_3_genres.map((item: any, index: number) => (
                    <motion.div
                      key={item.genre}
                      variants={itemVariants}
                      whileHover={
                        animationsEnabled
                          ? {
                              x: 12,
                              backgroundColor: "rgba(139, 92, 246, 0.08)",
                              borderColor: "rgba(139, 92, 246, 0.3)",
                            }
                          : {}
                      }
                      className="bg-gray-50 dark:bg-gray-900/40 p-5 rounded-2xl border border-transparent dark:border-gray-800/50 flex justify-between items-center group transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <motion.span
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            delay: 0.6 + index * 0.1,
                            type: "spring",
                          }}
                          className="w-5 h-5 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        <span className="capitalize font-bold text-lg text-gray-700 dark:text-gray-300">
                          {item.genre}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-black text-xl text-violet-700 dark:text-violet-400">
                          {Math.round(item.confidence * 100)}%
                        </span>
                        <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.confidence * 100}%` }}
                            transition={{
                              delay: 0.8 + index * 0.1,
                              duration: 1,
                            }}
                            className="h-full"
                            style={{ backgroundColor: COLORS[index] }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ResultCard;
