"use client";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  durationMs?: number;
}

export default function Toast({ message, visible, onHide, durationMs = 1500 }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onHide, durationMs);
    return () => clearTimeout(t);
  }, [visible, onHide, durationMs]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-4 left-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{
            background: "#1C1C27",
            border: "1px solid #2A2A3D",
            color: "#22C55E",
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
          initial={{ opacity: 0, y: -20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -20, x: "-50%" }}
        >
          <CheckCircle size={16} />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
