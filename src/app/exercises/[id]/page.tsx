"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useExercises } from "@/hooks/useExercises";
import { useVideos } from "@/hooks/useVideos";
import { BODY_PART_COLORS } from "@/types";
import type { BodyPart } from "@/types";
import { ArrowLeft, Edit2, Trash2, Plus, Video } from "lucide-react";
import BottomSheet from "@/components/ui/BottomSheet";
import ExerciseForm from "@/components/exercise/ExerciseForm";
import VideoLink from "@/components/exercise/VideoLink";
import Toast from "@/components/ui/Toast";
import { loadStorage } from "@/lib/storage";

interface VideoFormData {
  url: string;
  title: string;
  note: string;
}

export default function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { exercises, updateExercise, deleteExercise } = useExercises();
  const { videos, addVideo, deleteVideo } = useVideos();
  const [editOpen, setEditOpen] = useState(false);
  const [videoFormOpen, setVideoFormOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [videoForm, setVideoForm] = useState<VideoFormData>({ url: "", title: "", note: "" });

  const exercise = exercises.find((e) => e.id === id) ?? loadStorage().exercises.find(e => e.id === id);
  const exerciseVideos = videos.filter((v) => v.exerciseId === id);

  useEffect(() => {
    if (exercises.length > 0 && !exercises.find((e) => e.id === id)) {
      router.push("/exercises");
    }
  }, [exercises, id, router]);

  if (!exercise) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <p style={{ color: "#8888AA" }}>読み込み中...</p>
      </div>
    );
  }

  const handleEdit = (data: { name: string; bodyPart: BodyPart; restSeconds?: number }) => {
    updateExercise(id, data);
    setEditOpen(false);
    setToast("更新しました");
  };

  const handleDelete = () => {
    if (confirm(`「${exercise.name}」を削除しますか？`)) {
      deleteExercise(id);
      router.push("/exercises");
    }
  };

  const handleAddVideo = () => {
    if (!videoForm.url.trim()) return;
    addVideo(id, videoForm.url.trim(), videoForm.title.trim(), videoForm.note.trim());
    setVideoForm({ url: "", title: "", note: "" });
    setVideoFormOpen(false);
    setToast("動画を追加しました");
  };

  const inputStyle = {
    background: "#1C1C27",
    border: "1px solid #2A2A3D",
    color: "#F0F0FF",
    borderRadius: "0.75rem",
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-5">
      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />

      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#1C1C27", border: "1px solid #2A2A3D" }}
        >
          <ArrowLeft size={18} style={{ color: "#F0F0FF" }} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: BODY_PART_COLORS[exercise.bodyPart] }}
            />
            <h1 className="text-lg font-bold truncate" style={{ color: "#F0F0FF" }}>
              {exercise.name}
            </h1>
          </div>
          <p className="text-sm" style={{ color: "#8888AA" }}>
            {exercise.bodyPart}
            {exercise.restSeconds != null && ` · 休憩 ${exercise.restSeconds}秒`}
          </p>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "#1C1C27", border: "1px solid #2A2A3D" }}
        >
          <Edit2 size={16} style={{ color: "#8888AA" }} />
        </button>
        <button
          onClick={handleDelete}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "#EF444422", border: "1px solid #EF444444" }}
        >
          <Trash2 size={16} style={{ color: "#EF4444" }} />
        </button>
      </div>

      {/* YouTube動画セクション */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "#8888AA" }}>
            参考動画
          </p>
          <button
            onClick={() => setVideoFormOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "#6C63FF22", color: "#6C63FF", border: "1px solid #6C63FF44" }}
          >
            <Plus size={13} />
            追加
          </button>
        </div>

        {exerciseVideos.length === 0 ? (
          <div
            className="p-4 rounded-xl text-center"
            style={{ background: "#13131A", border: "1px solid #2A2A3D" }}
          >
            <Video size={24} style={{ color: "#2A2A3D", margin: "0 auto 8px" }} />
            <p className="text-sm" style={{ color: "#8888AA" }}>
              参考動画を追加してください
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {exerciseVideos.map((video) => (
              <div key={video.id} className="relative">
                <VideoLink video={video} />
                <button
                  onClick={() => {
                    if (confirm("この動画を削除しますか？")) deleteVideo(video.id);
                  }}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full"
                  style={{ background: "#EF444422" }}
                >
                  <Trash2 size={11} style={{ color: "#EF4444" }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 編集シート */}
      <BottomSheet open={editOpen} onClose={() => setEditOpen(false)} title="種目を編集">
        <ExerciseForm
          initial={exercise}
          onSubmit={handleEdit}
          onCancel={() => setEditOpen(false)}
          submitLabel="保存"
        />
      </BottomSheet>

      {/* 動画追加シート */}
      <BottomSheet open={videoFormOpen} onClose={() => setVideoFormOpen(false)} title="動画を追加">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-widest" style={{ color: "#8888AA" }}>
              YouTube URL
            </label>
            <input
              type="url"
              value={videoForm.url}
              onChange={(e) => setVideoForm((p) => ({ ...p, url: e.target.value }))}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-3 text-base outline-none"
              style={inputStyle}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-widest" style={{ color: "#8888AA" }}>
              タイトル（任意）
            </label>
            <input
              type="text"
              value={videoForm.title}
              onChange={(e) => setVideoForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="例: ベンチプレス フォーム解説"
              className="w-full px-4 py-3 text-base outline-none"
              style={inputStyle}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-widest" style={{ color: "#8888AA" }}>
              フォームメモ（任意）
            </label>
            <textarea
              value={videoForm.note}
              onChange={(e) => setVideoForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="気をつけるポイントなど..."
              rows={3}
              className="w-full px-4 py-3 text-base outline-none resize-none"
              style={inputStyle}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setVideoFormOpen(false)}
              className="flex-1 py-3 rounded-xl text-sm font-medium"
              style={{ background: "#1C1C27", color: "#8888AA", border: "1px solid #2A2A3D" }}
            >
              キャンセル
            </button>
            <button
              onClick={handleAddVideo}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "#6C63FF", color: "#fff", boxShadow: "0 4px 24px #6C63FF44" }}
            >
              追加
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
