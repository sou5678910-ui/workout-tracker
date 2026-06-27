"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMenus } from "@/hooks/useMenus";
import { useSessions } from "@/hooks/useSessions";
import { useAppContext } from "@/contexts/AppContext";
import type { WorkoutSet } from "@/types";
import { Play, Clock, ChevronRight, Dumbbell, Trash2 } from "lucide-react";
import BottomSheet from "@/components/ui/BottomSheet";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function getTodayLabel() {
  const d = new Date();
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

export default function HomePage() {
  const router = useRouter();
  const { menus } = useMenus();
  const { sessions, startSession } = useSessions();
  const { data, updateSet, deleteSession } = useAppContext();
  const [menuSheetOpen, setMenuSheetOpen] = useState(false);
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);
  const detailSession = detailSessionId ? data.sessions.find((s) => s.id === detailSessionId) ?? null : null;

  // セット編集用
  const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);
  const [editInput, setEditInput] = useState<{ weight: number; reps: number }>({ weight: 0, reps: 10 });

  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 5);

  const handleStartMenu = (menuId: string, menuName: string) => {
    const session = startSession(menuId, menuName);
    setMenuSheetOpen(false);
    router.push(`/workout/${session.id}`);
  };

  const handleDeleteSession = (id: string, name: string, startedAt: string) => {
    if (
      confirm(
        `「${name}」（${formatDate(startedAt)}）の記録を削除しますか？\nこの操作は取り消せません。`
      )
    ) {
      deleteSession(id);
      if (detailSessionId === id) setDetailSessionId(null);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 flex flex-col gap-6">
      {/* 日付 */}
      <div>
        <p className="text-sm" style={{ color: "#8888AA" }}>今日</p>
        <h1 className="text-2xl font-bold" style={{ color: "#F0F0FF" }}>
          {getTodayLabel()}
        </h1>
      </div>

      {/* メニュー開始ボタン */}
      <button
        onClick={() => setMenuSheetOpen(true)}
        className="w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-lg font-semibold"
        style={{
          background: "#6C63FF",
          color: "#fff",
          boxShadow: "0 4px 32px #6C63FF44",
        }}
      >
        <Play size={22} fill="white" />
        トレーニングを始める
      </button>

      {/* 最近のセッション */}
      {recentSessions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "#8888AA" }}>
            最近のトレーニング
          </p>
          {recentSessions.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!s.endedAt) {
                    router.push(`/workout/${s.id}`);
                  } else {
                    setDetailSessionId(s.id);
                  }
                }}
                className="flex-1 min-w-0 p-4 rounded-xl flex items-center gap-3 text-left"
                style={{ background: "#13131A", border: "1px solid #2A2A3D" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#6C63FF22" }}
                >
                  <Dumbbell size={18} style={{ color: "#6C63FF" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#F0F0FF" }}>
                    {s.menuName}
                  </p>
                  <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#9999BB" }}>
                    <Clock size={11} />
                    {formatDate(s.startedAt)}
                    {s.endedAt ? "" : " (記録中)"}
                  </p>
                </div>
                <p className="text-sm font-mono font-bold" style={{ color: "#6C63FF" }}>
                  {s.sets.length} set
                </p>
              </button>
              <button
                onClick={() => handleDeleteSession(s.id, s.menuName, s.startedAt)}
                aria-label={`${s.menuName} の記録を削除`}
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#EF444422", border: "1px solid #EF444444" }}
              >
                <Trash2 size={18} style={{ color: "#EF4444" }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* メニューが0件の場合のガイド */}
      {menus.length === 0 && (
        <div
          className="p-4 rounded-xl text-center"
          style={{ background: "#13131A", border: "1px solid #2A2A3D" }}
        >
          <p className="text-sm" style={{ color: "#8888AA" }}>
            まず「種目」を登録して「メニュー」を作成してください
          </p>
        </div>
      )}

      {/* セッション詳細シート */}
      <BottomSheet
        open={!!detailSession}
        onClose={() => setDetailSessionId(null)}
        title={detailSession?.menuName ?? ""}
      >
        {detailSession && (() => {
          const exerciseIds = [...new Set(detailSession.sets.map((s) => s.exerciseId))];
          return (
            <div className="flex flex-col gap-4 pb-2">
              <p className="text-xs" style={{ color: "#9999BB" }}>
                {formatDate(detailSession.startedAt)}
                {detailSession.endedAt ? ` 〜 ${formatDate(detailSession.endedAt)}` : ""}
              </p>
              <p className="text-xs" style={{ color: "#6C63FF" }}>
                数字をタップすると、重さ・回数を直せます。
              </p>
              {exerciseIds.map((exId) => {
                const exercise = data.exercises.find((e) => e.id === exId);
                const sets = detailSession.sets.filter((s) => s.exerciseId === exId);
                const note = detailSession.exerciseNotes?.[exId];
                return (
                  <div key={exId} className="flex flex-col gap-1.5">
                    <p className="text-sm font-semibold" style={{ color: "#F0F0FF" }}>
                      {exercise?.name ?? "不明な種目"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {sets.map((set, i) => (
                        <button
                          key={set.id}
                          onClick={() => {
                            setEditingSet(set);
                            setEditInput({ weight: set.weight, reps: set.reps });
                          }}
                          aria-label={`セット${i + 1}を編集`}
                          className="flex flex-col items-center px-2 py-1.5 rounded-lg text-xs min-w-[44px]"
                          style={{ background: "#22C55E22", border: "1px solid #22C55E44" }}
                        >
                          <span style={{ color: "#22C55E" }}>S{i + 1}</span>
                          <span className="font-mono font-bold" style={{ color: "#22C55E" }}>
                            {set.weight}kg
                          </span>
                          <span style={{ color: "#22C55E" }}>{set.reps}回</span>
                        </button>
                      ))}
                    </div>
                    {note && (
                      <p className="text-xs px-2" style={{ color: "#9999BB" }}>
                        <span style={{ color: "#6C63FF" }}>メモ　</span>{note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </BottomSheet>

      {/* セット編集シート */}
      <BottomSheet
        open={!!editingSet}
        onClose={() => setEditingSet(null)}
        title="記録を編集"
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
                aria-label="重量"
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
                aria-label="回数を減らす"
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
                aria-label="回数"
                className="w-24 text-center text-3xl font-mono font-bold outline-none rounded-xl py-3"
                style={{ background: "#1C1C27", color: "#F0F0FF", border: "1px solid #6C63FF" }}
              />
              <button
                onClick={() => setEditInput((p) => ({ ...p, reps: p.reps + 1 }))}
                aria-label="回数を増やす"
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
              if (editingSet && detailSessionId) {
                updateSet(detailSessionId, editingSet.id, editInput.weight, editInput.reps);
              }
              setEditingSet(null);
            }}
            className="w-full py-4 rounded-2xl font-semibold text-lg"
            style={{ background: "#6C63FF", color: "#fff" }}
          >
            保存
          </button>
        </div>
      </BottomSheet>

      {/* メニュー選択シート */}
      <BottomSheet
        open={menuSheetOpen}
        onClose={() => setMenuSheetOpen(false)}
        title="メニューを選択"
      >
        {menus.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: "#8888AA" }}>
            メニューがありません。先にメニューを作成してください。
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {menus.map((menu) => (
              <button
                key={menu.id}
                onClick={() => handleStartMenu(menu.id, menu.name)}
                className="w-full p-4 rounded-xl flex items-center justify-between text-left"
                style={{ background: "#1C1C27", border: "1px solid #2A2A3D" }}
              >
                <div>
                  <p className="text-base font-semibold" style={{ color: "#F0F0FF" }}>
                    {menu.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#8888AA" }}>
                    {menu.items.length} 種目
                  </p>
                </div>
                <ChevronRight size={18} style={{ color: "#8888AA" }} />
              </button>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
