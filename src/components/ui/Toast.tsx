"use client";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, AlertCircle } from "lucide-react";

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  durationMs?: number;
  position?: "top" | "bottom";
  type?: "success" | "error";
}

export default function Toast({
  message,
  visible,
  onHide,
  durationMs = 1500,
  position = "top",
  type = "success",
}: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onHide, durationMs);
    return () => clearTimeout(t);
  }, [visible, onHide, durationMs]);

  // bottom はワークアウト画面のヘッダーを遮らないよう、タイマーバーの上に出す
  const posClass = position === "bottom" ? "bottom-44" : "top-4";
  const enterFrom = position === "bottom" ? 20 : -20;
  const isError = type === "error";
  const accent = isError ? "#EF4444" : "#22C55E";
  const Icon = isError ? AlertCircle : CheckCircle;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed ${posClass} left-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium`}
          style={{
            background: "#1C1C27",
            border: `1px solid ${isError ? "#EF444444" : "#2A2A3D"}`,
            color: accent,
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
          initial={{ opacity: 0, y: enterFrom, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: enterFrom, x: "-50%" }}
        >
          <Icon size={16} />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
