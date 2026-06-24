"use client";
import { useAppContext } from "@/contexts/AppContext";

export function useExercises() {
  const {
    data,
    addExercise,
    updateExercise,
    deleteExercise,
    addVideo,
    deleteVideo,
  } = useAppContext();

  return {
    exercises: data.exercises,
    addExercise,
    updateExercise,
    deleteExercise,
    addVideoToExercise: (exerciseId: string, url: string, title: string, note: string) =>
      addVideo(exerciseId, url, title, note),
    removeVideoFromExercise: (_exerciseId: string, videoId: string) =>
      deleteVideo(videoId),
  };
}
