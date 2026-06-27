"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMenus } from "@/hooks/useMenus";
import { useSessions } from "@/hooks/useSessions";
import { useAppContext } from "@/contexts/AppContext";
import { Play, Clock, ChevronRight, Dumbbell } from "lucide-react";
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
  const { data } = useAppContext();
  const [menuSheetOpen, setMenuSheetOpen] = useState(false);
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);
  const detailSession = detailSessionId ? data.sessions.find((s) => s.id === detailSessionId) ?? null : null;

  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 5);

  const handleStartMenu = (menuId: string, menuName: string) => {
    const session = startSession(menuId, menuName);
    setMenuSheetOpen(false);
    router.push(`/workout/${session.id}`);
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
            <button
              key={s.id}
              onClick={() => {
                if (!s.endedAt) {
                  router.push(`/workout/${s.id}`);
                } else {
                  setDetailSessionId(s.id);
                }
              }}
              className="w-full p-4 rounded-xl flex items-center gap-3 text-left"
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
                        <div
                          key={set.id}
                          className="flex flex-col items-center px-2 py-1.5 rounded-lg text-xs min-w-[44px]"
                          style={{ background: "#22C55E22", border: "1px solid #22C55E44" }}
                        >
                          <span style={{ color: "#22C55E" }}>S{i + 1}</span>
                          <span className="font-mono font-bold" style={{ color: "#22C55E" }}>
                            {set.weight}kg
                          </span>
                          <span style={{ color: "#22C55E" }}>{set.reps}回</span>
                        </div>
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
