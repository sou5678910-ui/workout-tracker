"use client";
import { useState } from "react";
import Link from "next/link";
import { useExercises } from "@/hooks/useExercises";
import { BODY_PART_COLORS, BODY_PARTS } from "@/types";
import type { BodyPart } from "@/types";
import { Plus, ChevronRight, Video } from "lucide-react";
import BottomSheet from "@/components/ui/BottomSheet";
import ExerciseForm from "@/components/exercise/ExerciseForm";
import Toast from "@/components/ui/Toast";

export default function ExercisesPage() {
  const { exercises, addExercise } = useExercises();
  const [addOpen, setAddOpen] = useState(false);
  const [filterPart, setFilterPart] = useState<BodyPart | "すべて">("すべて");
  const [toast, setToast] = useState(false);

  const filtered =
    filterPart === "すべて"
      ? exercises
      : exercises.filter((e) => e.bodyPart === filterPart);

  const handleAdd = (data: { name: string; bodyPart: BodyPart; restSeconds?: number }) => {
    addExercise(data.name, data.bodyPart, data.restSeconds);
    setAddOpen(false);
    setToast(true);
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 flex flex-col gap-4">
      <Toast message="種目を追加しました" visible={toast} onHide={() => setToast(false)} />

      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "#F0F0FF" }}>種目</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "#6C63FF", boxShadow: "0 4px 16px #6C63FF44" }}
        >
          <Plus size={20} color="white" />
        </button>
      </div>

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

      {/* 種目リスト */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm" style={{ color: "#8888AA" }}>
            {filterPart === "すべて" ? "種目を追加してください" : `${filterPart}の種目がありません`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((exercise) => (
            <Link
              key={exercise.id}
              href={`/exercises/${exercise.id}`}
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: "#13131A", border: "1px solid #2A2A3D" }}
            >
              {/* 部位カラーバー */}
              <div
                className="w-1 h-10 rounded-full flex-shrink-0"
                style={{ background: BODY_PART_COLORS[exercise.bodyPart] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#F0F0FF" }}>
                  {exercise.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#8888AA" }}>
                  {exercise.bodyPart}
                  {exercise.restSeconds != null && ` · 休憩 ${exercise.restSeconds}秒`}
                </p>
              </div>
              {exercise.videoIds.length > 0 && (
                <Video size={16} style={{ color: "#6C63FF", flexShrink: 0 }} />
              )}
              <ChevronRight size={16} style={{ color: "#2A2A3D", flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      )}

      {/* 追加シート */}
      <BottomSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="種目を追加"
      >
        <ExerciseForm
          onSubmit={handleAdd}
          onCancel={() => setAddOpen(false)}
          submitLabel="追加"
        />
      </BottomSheet>
    </div>
  );
}
