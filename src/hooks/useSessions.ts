"use client";
import { useAppContext } from "@/contexts/AppContext";

export function useSessions() {
  const {
    data,
    startSession,
    endSession,
    addSet,
    getLastSetsForExercise,
    getSession,
  } = useAppContext();

  return {
    sessions: data.sessions,
    startSession,
    endSession,
    addSet,
    getLastSetsForExercise,
    getSession,
  };
}
