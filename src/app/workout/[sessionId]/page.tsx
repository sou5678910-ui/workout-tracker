"use client";
import { use, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppContext, unlockAudio } from "@/contexts/AppContext";
import { DEFAULT_TARGET_SETS } from "@/lib/storage";
import type { WorkoutSet, Exercise, MenuItem } from "@/types";
import { ArrowLeft, ChevronLeft, ChevronRight, Copy, CheckCircle, Video, Minus, Plus } from "lucide-react";
import VideoLink from "@/components/exercise/VideoLink";
import Toast from "@/components/ui/Toast";
import BottomSheet from "@/components/ui/BottomSheet";

interface SetInputState {
  weight: number;
  reps: number;
}

function formatSets(sets: WorkoutSet[]): string {
  if (sets.length === 0) return "記録なし";
  const allSame = sets.every((s) => s.weight === sets[0].weight && s.reps === sets[0].reps);
  if (allSame) {
    return `${sets[0].weight}kg × ${sets[0].reps}回 × ${sets.length}セット`;
  }
  return sets.map((s) => `${s.weight}kg×${s.reps}`).join(" / ");
}

export default function WorkoutPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const {
    data,
    addSet,
    updateSet,
    updateExerciseNote,
    endSession,
    getLastSetsForExercise,
    getSession,
    startTimer,
    endTimer,
    updateMenu,
    updateSettings,
  } = useAppContext();

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [input, setInput] = useState<SetInputState>({ weight: 0, reps: 10 });
  const [completedSets, setCompletedSets] = useState<WorkoutSet[]>([]);
  const [lastSets, setLastSets] = useState<WorkoutSet[]>([]);
  const [toast, setToast] = useState("");
  const [videoSheetOpen, setVideoSheetOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);
  const [editInput, setEditInput] = useState<SetInputState>({ weight: 0, reps: 10 });
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [neverShowNotes, setNeverShowNotes] = useState(false);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // セッションとメニューは data から取得（loadStorage() を使わない）
  const session = data.sessions.find((s) => s.id === sessionId);
  const menu = session ? data.menus.find((m) => m.id === session.menuId) : null;

  const orderedExercises: Exercise[] = menu
    ? [...menu.items]
        .sort((a, b) => a.order - b.order)
        .map((item) => data.exercises.find((e) => e.id === item.exerciseId))
        .filter((e): e is Exercise => !!e)
    : [];

  const currentExercise = orderedExercises[exerciseIndex];

  // 現在の種目の MenuItem（targetSets取得用）
  const currentMenuItem: MenuItem | undefined = menu?.items.find(
    (i) => i.exerciseId === currentExercise?.id
  );
  const targetSets = currentMenuItem?.targetSets ?? DEFAULT_TARGET_SETS;

  // 種目変更時にリセット（currentExercise?.id を deps に使って参照変化を防ぐ）
  const refreshCompletedSets = useCallback(() => {
    if (!currentExercise) return;
    const todaySets = (getSession(sessionId)?.sets ?? []).filter(
      (s) => s.exerciseId === currentExercise.id
    );
    setCompletedSets(todaySets);
  }, [currentExercise, sessionId, getSession]);

  useEffect(() => {
    if (!currentExercise) return;
    const last = getLastSetsForExercise(currentExercise.id, sessionId);
    setLastSets(last);
    refreshCompletedSets();
    if (last.length > 0) {
      setInput({ weight: last[0].weight, reps: last[0].reps });
    } else {
      setInput({ weight: 20, reps: 10 });
    }
    // クリーンアップ: 種目切り替え時に自動進行タイマーをキャンセル
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseIndex, currentExercise?.id, sessionId]);

  const handleCopyLast = () => {
    if (lastSets.length === 0) return;
    setInput({ weight: lastSets[0].weight, reps: lastSets[0].reps });
    setToast("前回の記録をコピーしました");
  };

  const handleCompleteSet = () => {
    if (!currentExercise || !session) return;
    unlockAudio(); // ユーザー操作のタイミングでAudioContextを起動
    const newSet = addSet(sessionId, currentExercise.id, input.weight, input.reps);
    const newCompleted = [...completedSets, newSet];
    setCompletedSets(newCompleted);

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }

    const restSeconds = currentExercise.restSeconds ?? data.settings.defaultRestSeconds;
    startTimer(currentExercise.id, currentExercise.name, restSeconds);

    const newCount = newCompleted.length;
    if (newCount >= targetSets) {
      if (exerciseIndex < orderedExercises.length - 1) {
        setToast(`${targetSets}セット達成！次の種目へ →`);
        autoAdvanceRef.current = setTimeout(() => {
          setExerciseIndex((i) => i + 1);
        }, 2000);
      } else {
        setToast(`全種目完了！`);
      }
    } else {
      setToast(`SET ${newCount} 完了（残り${targetSets - newCount}セット）`);
    }
  };

  // 目標セット数を変更（MenuItemに保存）
  const handleChangeTargetSets = (delta: number) => {
    if (!menu || !currentExercise) return;
    const newTarget = Math.max(1, targetSets + delta);
    const updatedItems = menu.items.map((i) =>
      i.exerciseId === currentExercise.id ? { ...i, targetSets: newTarget } : i
    );
    updateMenu(menu.id, { items: updatedItems });
  };

  // 前回同メニューのコメントを取得
  const lastNoteForCurrentExercise = (() => {
    if (!currentExercise || !menu) return "";
    const prev = [...data.sessions]
      .filter((s) => s.endedAt && s.menuId === menu.id && s.id !== sessionId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
    return prev?.exerciseNotes?.[currentExercise.id] ?? "";
  })();

  const handleEndWorkout = () => {
    if (!session) return;
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    endTimer();
    if (data.settings.skipExerciseNotes) {
      endSession(sessionId);
      router.push("/");
      return;
    }
    // コメント入力シートを開く
    const initial: Record<string, string> = {};
    orderedExercises.forEach((e) => { initial[e.id] = ""; });
    setNoteInputs(initial);
    setNeverShowNotes(false);
    setNoteSheetOpen(true);
  };

  const handleSaveNotes = () => {
    if (neverShowNotes) {
      updateSettings({ skipExerciseNotes: true });
    }
    Object.entries(noteInputs).forEach(([exerciseId, note]) => {
      if (note.trim()) updateExerciseNote(sessionId, exerciseId, note.trim());
    });
    endSession(sessionId);
    router.push("/");
  };

  const adjustWeight = (delta: number) => {
    setInput((prev) => ({
      ...prev,
      weight: Math.max(0, Math.round((prev.weight + delta) * 100) / 100),
    }));
  };

  if (!session || !menu || orderedExercises.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <p style={{ color: "#9999BB" }}>読み込み中...</p>
      </div>
    );
  }

  const exerciseVideos = currentExercise
    ? data.videos.filter((v) => v.exerciseId === currentExercise.id)
    : [];

  const isLastTargetSet = completedSets.length === targetSets - 1;
  const isAllDone = completedSets.length >= targetSets;

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-4">
      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />

      {/* ヘッダー */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          aria-label="戻る"
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#1C1C27", border: "1px solid #2A2A3D" }}
        >
          <ArrowLeft size={20} style={{ color: "#F0F0FF" }} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs" style={{ color: "#9999BB" }}>{menu.name}</p>
          <h1 className="text-lg font-bold truncate" style={{ color: "#F0F0FF" }}>
            {currentExercise?.name ?? "-"}
          </h1>
        </div>
        {exerciseVideos.length > 0 && (
          <button
            onClick={() => setVideoSheetOpen(true)}
            aria-label="参考動画を表示"
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "#6C63FF22", border: "1px solid #6C63FF44" }}
          >
            <Video size={20} style={{ color: "#6C63FF" }} />
          </button>
        )}
        <button
          onClick={handleEndWorkout}
          className="px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: "#1C1C27", color: "#9999BB", border: "1px solid #2A2A3D" }}
        >
          終了
        </button>
      </div>

      {/* 種目ナビゲーション */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
            setExerciseIndex((i) => Math.max(0, i - 1));
          }}
          disabled={exerciseIndex === 0}
          aria-label="前の種目"
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: "#1C1C27",
            border: "1px solid #2A2A3D",
            opacity: exerciseIndex === 0 ? 0.3 : 1,
          }}
        >
          <ChevronLeft size={20} style={{ color: "#F0F0FF" }} />
        </button>
        <div className="flex-1 flex items-center justify-center gap-3">
          {orderedExercises.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
                setExerciseIndex(i);
              }}
              aria-label={`種目 ${i + 1} へ移動`}
              className="rounded-full transition-all"
              style={{
                width: i === exerciseIndex ? 24 : 12,
                height: 12,
                minWidth: 12,
                background: i === exerciseIndex ? "#6C63FF" : "#2A2A3D",
                padding: "4px",
                boxSizing: "content-box",
              }}
            />
          ))}
        </div>
        <button
          onClick={() => {
            if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
            setExerciseIndex((i) => Math.min(orderedExercises.length - 1, i + 1));
          }}
          disabled={exerciseIndex === orderedExercises.length - 1}
          aria-label="次の種目"
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: "#1C1C27",
            border: "1px solid #2A2A3D",
            opacity: exerciseIndex === orderedExercises.length - 1 ? 0.3 : 1,
          }}
        >
          <ChevronRight size={20} style={{ color: "#F0F0FF" }} />
        </button>
      </div>

      {/* 前回記録バナー */}
      <div
        className="p-3 rounded-xl flex items-center justify-between"
        style={{ background: "#1C1C27", border: "1px solid #2A2A3D" }}
      >
        <div>
          <p className="text-xs" style={{ color: "#9999BB" }}>前回</p>
          <p className="text-sm font-medium" style={{ color: "#F0F0FF" }}>
            {formatSets(lastSets)}
          </p>
        </div>
        {lastSets.length > 0 && (
          <button
            onClick={handleCopyLast}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium"
            style={{ background: "#6C63FF22", color: "#6C63FF", border: "1px solid #6C63FF44" }}
          >
            <Copy size={13} />
            コピー
          </button>
        )}
      </div>

      {/* 前回コメント */}
      {lastNoteForCurrentExercise && (
        <div
          className="px-3 py-2 rounded-xl text-sm"
          style={{ background: "#1C1C2700", border: "1px solid #6C63FF33", color: "#9999BB" }}
        >
          <span className="text-xs" style={{ color: "#6C63FF" }}>前回メモ　</span>
          {lastNoteForCurrentExercise}
        </div>
      )}

      {/* セット進捗 + 目標セット数調整 */}
      <div
        className="p-3 rounded-xl flex items-center justify-between gap-3"
        style={{
          background: isAllDone ? "#22C55E11" : "#13131A",
          border: `1px solid ${isAllDone ? "#22C55E44" : "#2A2A3D"}`,
        }}
      >
        {/* 完了済みセットバッジ */}
        <div className="flex gap-1.5 flex-wrap flex-1">
          {Array.from({ length: targetSets }).map((_, i) => {
            const set = completedSets[i];
            const done = !!set;
            if (done) {
              return (
                <button
                  key={i}
                  onClick={() => {
                    setEditingSet(set);
                    setEditInput({ weight: set.weight, reps: set.reps });
                  }}
                  aria-label={`SET ${i + 1} を編集`}
                  className="flex flex-col items-center px-2 py-1.5 rounded-lg text-xs min-w-[44px]"
                  style={{
                    background: "#22C55E22",
                    border: "1px solid #22C55E44",
                  }}
                >
                  <span style={{ color: "#22C55E" }}>S{i + 1}</span>
                  <span className="font-mono font-bold" style={{ color: "#22C55E" }}>
                    {set.weight}kg
                  </span>
                  <span style={{ color: "#22C55E" }}>{set.reps}回</span>
                </button>
              );
            }
            return (
              <div
                key={i}
                className="flex flex-col items-center px-2 py-1.5 rounded-lg text-xs min-w-[44px]"
                style={{ background: "#1C1C27", border: "1px solid #2A2A3D" }}
              >
                <span style={{ color: "#9999BB" }}>S{i + 1}</span>
                <span style={{ color: "#2A2A3D" }}>—</span>
              </div>
            );
          })}
        </div>

        {/* 目標セット数調整 */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <p className="text-[10px]" style={{ color: "#9999BB" }}>目標</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleChangeTargetSets(-1)}
              aria-label="目標セット数を減らす"
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "#1C1C27", border: "1px solid #2A2A3D" }}
            >
              <Minus size={12} style={{ color: "#F0F0FF" }} />
            </button>
            <span
              className="text-lg font-mono font-bold w-6 text-center"
              style={{ color: "#F0F0FF" }}
            >
              {targetSets}
            </span>
            <button
              onClick={() => handleChangeTargetSets(1)}
              aria-label="目標セット数を増やす"
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "#1C1C27", border: "1px solid #2A2A3D" }}
            >
              <Plus size={12} style={{ color: "#F0F0FF" }} />
            </button>
          </div>
        </div>
      </div>

      {/* 重量・回数入力 */}
      <div
        className="p-5 rounded-2xl flex flex-col gap-5"
        style={{ background: "#13131A", border: "1px solid #2A2A3D" }}
      >
        {/* 重量 */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-center font-medium uppercase tracking-widest" style={{ color: "#9999BB" }}>
            重量 (kg)
          </p>
          <div className="flex items-center gap-1.5">
            {([-5, -2.5, -1.25] as const).map((d) => (
              <button
                key={d}
                onClick={() => adjustWeight(d)}
                aria-label={`重量 ${d}kg`}
                className="flex-1 py-3 rounded-xl text-xs font-bold"
                style={{ background: "#1C1C27", color: "#F0F0FF", border: "1px solid #2A2A3D" }}
              >
                {d}
              </button>
            ))}
            <input
              type="number"
              inputMode="decimal"
              value={input.weight === 0 ? "" : input.weight}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setInput((p) => ({ ...p, weight: isNaN(v) ? 0 : v }));
              }}
              aria-label="重量"
              className="w-20 text-center py-3 text-2xl font-mono font-bold outline-none rounded-xl"
              style={{ background: "#1C1C27", color: "#F0F0FF", border: "1px solid #6C63FF" }}
            />
            {([1.25, 2.5, 5] as const).map((d) => (
              <button
                key={d}
                onClick={() => adjustWeight(d)}
                aria-label={`重量 +${d}kg`}
                className="flex-1 py-3 rounded-xl text-xs font-bold"
                style={{ background: "#1C1C27", color: "#F0F0FF", border: "1px solid #2A2A3D" }}
              >
                +{d}
              </button>
            ))}
          </div>
        </div>

        {/* 回数 */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-center font-medium uppercase tracking-widest" style={{ color: "#9999BB" }}>
            回数
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setInput((p) => ({ ...p, reps: Math.max(1, p.reps - 1) }))}
              aria-label="回数を減らす"
              className="w-14 h-14 rounded-xl text-2xl font-bold"
              style={{ background: "#1C1C27", color: "#F0F0FF", border: "1px solid #2A2A3D" }}
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={input.reps === 0 ? "" : input.reps}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setInput((p) => ({ ...p, reps: isNaN(v) ? 0 : v }));
              }}
              aria-label="回数"
              className="w-24 text-center text-3xl font-mono font-bold outline-none rounded-xl py-3"
              style={{ background: "#1C1C27", color: "#F0F0FF", border: "1px solid #6C63FF" }}
            />
            <button
              onClick={() => setInput((p) => ({ ...p, reps: p.reps + 1 }))}
              aria-label="回数を増やす"
              className="w-14 h-14 rounded-xl text-2xl font-bold"
              style={{ background: "#1C1C27", color: "#F0F0FF", border: "1px solid #2A2A3D" }}
            >
              ＋
            </button>
          </div>
        </div>
      </div>

      {/* セット完了ボタン */}
      {isAllDone ? (
        // 目標達成済みの場合は追加セットボタン（控えめなスタイル）
        <button
          onClick={handleCompleteSet}
          className="w-full flex items-center justify-center gap-2 rounded-2xl font-medium text-base"
          style={{
            background: "#1C1C27",
            color: "#9999BB",
            height: 56,
            border: "1px solid #2A2A3D",
          }}
        >
          <CheckCircle size={20} />
          + 追加セット {completedSets.length + 1} 完了
        </button>
      ) : (
        <button
          onClick={handleCompleteSet}
          className="w-full flex items-center justify-center gap-3 rounded-2xl font-semibold text-lg"
          style={{
            background: isLastTargetSet ? "#22C55E" : "#6C63FF",
            color: "#fff",
            height: 64,
            boxShadow: isLastTargetSet ? "0 4px 32px #22C55E55" : "0 4px 32px #6C63FF55",
          }}
        >
          <CheckCircle size={24} />
          SET {completedSets.length + 1} 完了
          {isLastTargetSet && <span className="text-base opacity-80">（最終セット）</span>}
        </button>
      )}

      {/* 動画シート */}
      <BottomSheet
        open={videoSheetOpen}
        onClose={() => setVideoSheetOpen(false)}
        title={`${currentExercise?.name ?? ""} — 参考動画`}
      >
        <div className="flex flex-col gap-3">
          {exerciseVideos.map((v) => (
            <VideoLink key={v.id} video={v} />
          ))}
        </div>
      </BottomSheet>

      {/* コメント入力シート */}
      <BottomSheet
        open={noteSheetOpen}
        onClose={() => { endSession(sessionId); router.push("/"); }}
        title="種目メモ（任意）"
      >
        <div className="flex flex-col gap-4 pb-2">
          <p className="text-sm" style={{ color: "#9999BB" }}>
            各種目のメモを残せます。次回同じメニューのときに表示されます。
          </p>
          {orderedExercises.map((ex) => (
            <div key={ex.id} className="flex flex-col gap-1.5">
              <p className="text-xs font-medium" style={{ color: "#F0F0FF" }}>{ex.name}</p>
              <textarea
                rows={2}
                placeholder="例：肩甲骨を意識した"
                value={noteInputs[ex.id] ?? ""}
                onChange={(e) =>
                  setNoteInputs((p) => ({ ...p, [ex.id]: e.target.value }))
                }
                className="w-full rounded-xl px-3 py-2 text-sm resize-none outline-none"
                style={{
                  background: "#1C1C27",
                  border: "1px solid #2A2A3D",
                  color: "#F0F0FF",
                }}
              />
            </div>
          ))}

          {/* 今後表示しないチェック */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={neverShowNotes}
              onChange={(e) => setNeverShowNotes(e.target.checked)}
              className="w-4 h-4 accent-[#6C63FF]"
            />
            <span className="text-sm" style={{ color: "#9999BB" }}>
              今後このメモ画面を表示しない
            </span>
          </label>

          {/* ボタン */}
          <div className="flex gap-2">
            <button
              onClick={() => { endSession(sessionId); router.push("/"); }}
              className="flex-1 py-3 rounded-xl text-sm font-medium"
              style={{ background: "#1C1C27", color: "#9999BB", border: "1px solid #2A2A3D" }}
            >
              書かない
            </button>
            <button
              onClick={handleSaveNotes}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "#6C63FF", color: "#fff" }}
            >
              保存して終了
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* セット編集シート */}
      <BottomSheet
        open={!!editingSet}
        onClose={() => setEditingSet(null)}
        title="セットを編集"
      >
        <div className="flex flex-col gap-5 pb-2">
          {/* 重量 */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-center font-medium uppercase tracking-widest" style={{ color: "#9999BB" }}>
              重量 (kg)
            </p>
            <div className="flex items-center gap-1.5">
              {([-5, -2.5, -1.25] as const).map((d) => (
                <button
                  key={d}
                  onClick={() =>
                    setEditInput((p) => ({
                      ...p,
                      weight: Math.max(0, Math.round((p.weight + d) * 100) / 100),
                    }))
                  }
                  className="flex-1 py-3 rounded-xl text-xs font-bold"
                  style={{ background: "#1C1C27", color: "#F0F0FF", border: "1px solid #2A2A3D" }}
                >
                  {d}
                </button>
              ))}
              <input
                type="number"
                inputMode="decimal"
                value={editInput.weight === 0 ? "" : editInput.weight}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setEditInput((p) => ({ ...p, weight: isNaN(v) ? 0 : v }));
                }}
                className="w-20 text-center py-3 text-2xl font-mono font-bold outline-none rounded-xl"
                style={{ background: "#1C1C27", color: "#F0F0FF", border: "1px solid #6C63FF" }}
              />
              {([1.25, 2.5, 5] as const).map((d) => (
                <button
                  key={d}
                  onClick={() =>
                    setEditInput((p) => ({
                      ...p,
                      weight: Math.max(0, Math.round((p.weight + d) * 100) / 100),
                    }))
                  }
                  className="flex-1 py-3 rounded-xl text-xs font-bold"
                  style={{ background: "#1C1C27", color: "#F0F0FF", border: "1px solid #2A2A3D" }}
                >
                  +{d}
                </button>
              ))}
            </div>
          </div>

          {/* 回数 */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-center font-medium uppercase tracking-widest" style={{ color: "#9999BB" }}>
              回数
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setEditInput((p) => ({ ...p, reps: Math.max(1, p.reps - 1) }))}
                className="w-14 h-14 rounded-xl text-2xl font-bold"
                style={{ background: "#1C1C27", color: "#F0F0FF", border: "1px solid #2A2A3D" }}
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                value={editInput.reps === 0 ? "" : editInput.reps}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setEditInput((p) => ({ ...p, reps: isNaN(v) ? 0 : v }));
                }}
                className="w-24 text-center text-3xl font-mono font-bold outline-none rounded-xl py-3"
                style={{ background: "#1C1C27", color: "#F0F0FF", border: "1px solid #6C63FF" }}
              />
              <button
                onClick={() => setEditInput((p) => ({ ...p, reps: p.reps + 1 }))}
                className="w-14 h-14 rounded-xl text-2xl font-bold"
                style={{ background: "#1C1C27", color: "#F0F0FF", border: "1px solid #2A2A3D" }}
              >
                ＋
              </button>
            </div>
          </div>

          {/* 保存ボタン */}
          <button
            onClick={() => {
              if (!editingSet) return;
              updateSet(sessionId, editingSet.id, editInput.weight, editInput.reps);
              refreshCompletedSets();
              setEditingSet(null);
              setToast("セットを更新しました");
            }}
            className="w-full py-4 rounded-2xl font-semibold text-lg"
            style={{ background: "#6C63FF", color: "#fff" }}
          >
            保存
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
