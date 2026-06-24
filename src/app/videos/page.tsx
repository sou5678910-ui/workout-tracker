"use client";
import { useVideos } from "@/hooks/useVideos";
import { useExercises } from "@/hooks/useExercises";
import { BODY_PARTS, BODY_PART_COLORS } from "@/types";
import type { BodyPart } from "@/types";
import { useState } from "react";
import VideoLink from "@/components/exercise/VideoLink";
import { Video } from "lucide-react";

export default function VideosPage() {
  const { videos } = useVideos();
  const { exercises } = useExercises();
  const [filterPart, setFilterPart] = useState<BodyPart | "すべて">("すべて");

  const filteredExercises = exercises.filter((e) => {
    if (filterPart !== "すべて" && e.bodyPart !== filterPart) return false;
    return e.videoIds.length > 0;
  });

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 flex flex-col gap-4">
      <h1 className="text-xl font-bold" style={{ color: "#F0F0FF" }}>参考動画</h1>

      {/* 部位フィルター */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {(["すべて", ...BODY_PARTS] as (BodyPart | "すべて")[]).map((part) => (
          <button
            key={part}
            onClick={() => setFilterPart(part)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              background: filterPart === part ? "#6C63FF" : "#1C1C27",
              color: filterPart === part ? "#fff" : "#8888AA",
              border: `1px solid ${filterPart === part ? "#6C63FF" : "#2A2A3D"}`,
            }}
          >
            {part}
          </button>
        ))}
      </div>

      {/* 動画一覧 */}
      {videos.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3">
          <Video size={40} style={{ color: "#2A2A3D" }} />
          <p className="text-sm text-center" style={{ color: "#8888AA" }}>
            種目詳細ページから動画を追加してください
          </p>
        </div>
      ) : filteredExercises.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: "#8888AA" }}>
          {filterPart} の動画がありません
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {filteredExercises.map((exercise) => {
            const exVideos = videos.filter((v) => v.exerciseId === exercise.id);
            if (exVideos.length === 0) return null;
            return (
              <div key={exercise.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: BODY_PART_COLORS[exercise.bodyPart] }}
                  />
                  <p className="text-sm font-semibold" style={{ color: "#F0F0FF" }}>
                    {exercise.name}
                  </p>
                  <p className="text-xs" style={{ color: "#8888AA" }}>
                    {exercise.bodyPart}
                  </p>
                </div>
                {exVideos.map((v) => (
                  <VideoLink key={v.id} video={v} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
