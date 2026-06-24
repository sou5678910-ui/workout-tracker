"use client";
import { useAppContext } from "@/contexts/AppContext";

export function useVideos() {
  const { data, addVideo, updateVideo, deleteVideo } = useAppContext();

  return {
    videos: data.videos,
    addVideo,
    updateVideo,
    deleteVideo,
    getVideosByExercise: (exerciseId: string) =>
      data.videos.filter((v) => v.exerciseId === exerciseId),
  };
}
