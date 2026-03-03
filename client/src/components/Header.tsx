import React, { useRef } from "react";
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  showCharts: boolean;
  setShowCharts: (v: boolean) => void;
  compactLayout: boolean;
  setCompactLayout: (v: boolean) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (v: boolean) => void;
}

const DockItem = ({
  children,
  mouseX,
  enabled,
}: {
  children: React.ReactNode;
  mouseX: any;
  enabled: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Reduced scale to 1.2x and increased distance threshold to prevent collisions
  const scaleSync = useTransform(distance, [-120, 0, 120], [1, 1.2, 1]);
  const ySync = useTransform(distance, [-120, 0, 120], [0, -8, 0]);

  const scale = useSpring(scaleSync, {
    stiffness: 200,
    damping: 20,
    mass: 0.1,
  });
  const y = useSpring(ySync, { stiffness: 200, damping: 20, mass: 0.1 });

  return (
    /* WIDER CONTAINER (w-[84px]): 
       This acts as a "buffer zone" so that even when a card scales up, 
       it stays within its own invisible box and never touches the neighbor.
    */
    <div
      ref={ref}
      className="relative w-[84px] h-[60px] flex items-center justify-center flex-shrink-0"
    >
      <motion.div
        style={enabled ? { scale, y, position: "absolute" } : {}}
        className="flex items-center justify-center origin-bottom z-10"
      >
        {children}
      </motion.div>
    </div>
  );
};

const Toggle = ({ label, value, onChange, mouseX, enabled }: any) => (
  <DockItem mouseX={mouseX} enabled={enabled}>
    <button
      onClick={onChange}
      className={`flex flex-col items-center justify-center gap-1.5 w-[64px] h-[50px] rounded-2xl border transition-all duration-300
        ${
          value
            ? "bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-500/20"
            : "bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-gray-800 text-gray-500 hover:border-violet-400"
        }
      `}
    >
      <span className="text-[9px] font-black uppercase tracking-tighter leading-none">
        {label}
      </span>
      <div
        className={`w-6 h-3 flex items-center rounded-full p-0.5 ${value ? "bg-white/30" : "bg-gray-200 dark:bg-gray-700"}`}
      >
        <motion.div
          animate={{ x: value ? 12 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="h-2 w-2 rounded-full bg-white shadow-sm"
        />
      </div>
    </button>
  </DockItem>
);

const Header: React.FC<HeaderProps> = (props) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <header
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="sticky top-0 z-50 bg-white/90 dark:bg-black/95 border-b border-gray-200 dark:border-gray-800 h-[80px]"
    >
      <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-3 w-[220px]">
          <div className="bg-violet-600 p-2 rounded-xl shadow-lg shadow-violet-600/20">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h1 className="text-lg font-black dark:text-white uppercase leading-none">
              Genre<span className="text-violet-600">Lab</span>
            </h1>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              AI Classification Engine
            </p>
          </div>
        </div>

        {/* The Dock Bar */}
        <div className="hidden lg:flex items-center px-2 bg-gray-100/40 dark:bg-gray-900/40 rounded-[28px] border border-gray-200 dark:border-gray-800/60 h-[68px] backdrop-blur-md">
          <div className="flex items-center">
            <Toggle
              label="Dark"
              value={props.darkMode}
              mouseX={mouseX}
              enabled={props.animationsEnabled}
              onChange={() => props.setDarkMode(!props.darkMode)}
            />
            <Toggle
              label="Contrast"
              value={props.highContrast}
              mouseX={mouseX}
              enabled={props.animationsEnabled}
              onChange={() => props.setHighContrast(!props.highContrast)}
            />
          </div>

          <div className="w-[1px] h-8 bg-gray-300 dark:bg-gray-800 mx-1 rounded-full opacity-40" />

          <div className="flex items-center">
            <Toggle
              label="Charts"
              value={props.showCharts}
              mouseX={mouseX}
              enabled={props.animationsEnabled}
              onChange={() => props.setShowCharts(!props.showCharts)}
            />
            <Toggle
              label="Compact"
              value={props.compactLayout}
              mouseX={mouseX}
              enabled={props.animationsEnabled}
              onChange={() => props.setCompactLayout(!props.compactLayout)}
            />
            <Toggle
              label="Motion"
              value={props.animationsEnabled}
              mouseX={mouseX}
              enabled={props.animationsEnabled}
              onChange={() =>
                props.setAnimationsEnabled(!props.animationsEnabled)
              }
            />
          </div>
        </div>

        {/* System Info */}
        <div className="w-[220px] flex justify-end">
          <div className="text-[10px] font-black text-violet-600/80 bg-violet-500/10 px-4 py-1.5 rounded-full border border-violet-500/20 uppercase tracking-widest">
            v1.0.4 stable
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
