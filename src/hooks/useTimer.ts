"use client";
import { useAppContext } from "@/contexts/AppContext";

export type { TimerDisplay } from "@/contexts/AppContext";

export function useTimer() {
  const {
    timerDisplay,
    startTimer,
    pauseTimer,
    resumeTimer,
    adjustTimer,
    clearTimer,
    saveTimerRestSeconds,
  } = useAppContext();

  return {
    display: timerDisplay,
    startTimer,
    pauseTimer,
    resumeTimer,
    adjustTimer,
    clearTimer,
    saveRestSeconds: saveTimerRestSeconds,
  };
}
