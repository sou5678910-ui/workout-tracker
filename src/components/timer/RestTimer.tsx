"use client";
import { useState, useEffect, useRef } from "react";
import { useTimer } from "@/hooks/useTimer";
import { Pause, Play } from "lucide-react";

function formatTime(seconds: number): string {
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60).toString().padStart(2, "0");
  const s = (abs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function RestTimer() {
  const { display, adjustTimer, endTimer, pauseTimer, resumeTimer, saveRestSeconds } = useTimer();
  const [savedFeedback, setSavedFeedback] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // アンマウント時にsetTimeoutをクリーンアップ
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  if (!display) return null;

  const isOver = display.remaining <= 0 && display.status !== "paused";
  const isWarning = display.remaining > 0 && display.remaining <= 30 && display.status === "running";
  const isPaused = display.status === "paused";

  const timeColor = isPaused
    ? "#9999BB"
    : isOver
    ? "#EF4444"
    : isWarning
    ? "#F59E0B"
    : "#F0F0FF";

  const handleSaveCurrentTime = () => {
    saveRestSeconds(display.exerciseId, display.restSeconds);
    setSavedFeedback(true);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <div
      className="fixed bottom-16 left-0 right-0 z-30"
      style={{
        background: isPaused ? "rgba(28,28,39,0.97)" : "rgba(19,19,26,0.97)",
        backdropFilter: "blur(12px)",
        borderTop: `1px solid ${isPaused ? "#6C63FF44" : "#2A2A3D"}`,
      }}
    >
      <div className="max-w-lg mx-auto px-4 py-2">
        {/* 時間表示 + 種目名 + 操作ボタン */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs" style={{ color: "#9999BB" }}>
              {isPaused
                ? "一時停止中 — " + display.exerciseName
                : isOver
                ? "超過時間 — " + display.exerciseName
                : "休憩中 — " + display.exerciseName}
            </p>
            <p
              className="text-3xl font-mono font-bold leading-none"
              style={{ color: timeColor }}
            >
              {isOver ? "+" : ""}{formatTime(display.remaining)}
              {isPaused && (
                <span className="text-base font-normal ml-2" style={{ color: "#9999BB" }}>
                  (一時停止)
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            {!isOver && (
              <button
                onClick={isPaused ? resumeTimer : pauseTimer}
                aria-label={isPaused ? "タイマーを再開" : "タイマーを一時停止"}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: isPaused ? "#6C63FF22" : "#1C1C27",
                  color: isPaused ? "#6C63FF" : "#9999BB",
                  border: `1px solid ${isPaused ? "#6C63FF44" : "#2A2A3D"}`,
                }}
              >
                {isPaused ? <Play size={16} fill="#6C63FF" /> : <Pause size={16} />}
              </button>
            )}

            <button
              onClick={endTimer}
              aria-label="タイマーを終了"
              className="px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: "#1C1C27", color: "#9999BB", border: "1px solid #2A2A3D" }}
            >
              終了
            </button>
          </div>
        </div>

        {/* 時間調整ボタン */}
        <div className="flex gap-2">
          {([-30, -15, 15, 30] as const).map((delta) => (
            <button
              key={delta}
              onClick={() => adjustTimer(delta)}
              aria-label={`${delta > 0 ? "+" : ""}${delta}秒`}
              className="flex-1 py-2 rounded-lg text-xs font-medium"
              style={{ background: "#1C1C27", color: "#F0F0FF", border: "1px solid #2A2A3D" }}
            >
              {delta > 0 ? "+" : ""}{delta}s
            </button>
          ))}
          <button
            onClick={handleSaveCurrentTime}
            className="flex-1 py-2 rounded-lg text-xs font-medium"
            style={{
              background: savedFeedback ? "#22C55E22" : "#1C1C27",
              color: savedFeedback ? "#22C55E" : "#9999BB",
              border: `1px solid ${savedFeedback ? "#22C55E" : "#2A2A3D"}`,
            }}
          >
            {savedFeedback ? "保存済" : "この時間に固定"}
          </button>
        </div>
      </div>
    </div>
  );
}
