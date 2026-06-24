"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMenus } from "@/hooks/useMenus";
import { useExercises } from "@/hooks/useExercises";
import { BODY_PART_COLORS } from "@/types";
import type { MenuItem } from "@/types";
import { ArrowLeft, Plus, X, GripVertical, Save, Minus } from "lucide-react";
import BottomSheet from "@/components/ui/BottomSheet";
import Toast from "@/components/ui/Toast";
import { DEFAULT_TARGET_SETS } from "@/lib/storage";

export default function MenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();
  const { menus, addMenu, updateMenu } = useMenus();
  const { exercises } = useExercises();
  const [name, setName] = useState("");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [addExOpen, setAddExOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!isNew) {
      const menu = menus.find((m) => m.id === id);
      if (menu) {
        setName(menu.name);
        setItems(menu.items);
      }
    }
  }, [id, isNew, menus]);

  const addItem = (exerciseId: string) => {
    if (items.some((i) => i.exerciseId === exerciseId)) return;
    setItems((prev) => [
      ...prev,
      { exerciseId, order: prev.length, targetSets: DEFAULT_TARGET_SETS },
    ]);
    setAddExOpen(false);
  };

  const removeItem = (exerciseId: string) => {
    setItems((prev) =>
      prev
        .filter((i) => i.exerciseId !== exerciseId)
        .map((i, idx) => ({ ...i, order: idx }))
    );
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next.map((item, i) => ({ ...item, order: i })));
  };

  const changeTargetSets = (exerciseId: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.exerciseId === exerciseId
          ? { ...i, targetSets: Math.max(1, (i.targetSets ?? DEFAULT_TARGET_SETS) + delta) }
          : i
      )
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const ordered = items.map((item, i) => ({ ...item, order: i }));
    if (isNew) {
      addMenu(name.trim(), ordered);
      setToast("メニューを作成しました");
      setTimeout(() => router.push("/menus"), 800);
    } else {
      updateMenu(id, { name: name.trim(), items: ordered });
      setToast("保存しました");
    }
  };

  const usedIds = new Set(items.map((i) => i.exerciseId));
  const availableExercises = exercises.filter((e) => !usedIds.has(e.id));

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
          aria-label="戻る"
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#1C1C27", border: "1px solid #2A2A3D" }}
        >
          <ArrowLeft size={20} style={{ color: "#F0F0FF" }} />
        </button>
        <h1 className="flex-1 text-lg font-bold" style={{ color: "#F0F0FF" }}>
          {isNew ? "メニューを作成" : "メニューを編集"}
        </h1>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "#6C63FF", color: "#fff" }}
        >
          <Save size={15} />
          保存
        </button>
      </div>

      {/* メニュー名 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-widest" style={{ color: "#9999BB" }}>
          メニュー名
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 胸・肩・三頭筋"
          className="w-full px-4 py-3 text-base outline-none"
          style={inputStyle}
        />
      </div>

      {/* 種目リスト */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "#9999BB" }}>
            種目
          </p>
          <button
            onClick={() => setAddExOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: "#6C63FF22", color: "#6C63FF", border: "1px solid #6C63FF44" }}
          >
            <Plus size={13} />
            種目を追加
          </button>
        </div>

        {items.length === 0 ? (
          <div
            className="p-4 rounded-xl text-center"
            style={{ background: "#13131A", border: "1px solid #2A2A3D" }}
          >
            <p className="text-sm" style={{ color: "#9999BB" }}>
              種目を追加してください
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item, index) => {
              const ex = exercises.find((e) => e.id === item.exerciseId);
              if (!ex) return null;
              const ts = item.targetSets ?? DEFAULT_TARGET_SETS;
              return (
                <div
                  key={item.exerciseId}
                  className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: "#1C1C27", border: "1px solid #2A2A3D" }}
                >
                  {/* 並び替えボタン */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      aria-label="上に移動"
                      className="w-5 h-5 flex items-center justify-center"
                      style={{ color: index === 0 ? "#2A2A3D" : "#9999BB" }}
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveItem(index, 1)}
                      disabled={index === items.length - 1}
                      aria-label="下に移動"
                      className="w-5 h-5 flex items-center justify-center"
                      style={{ color: index === items.length - 1 ? "#2A2A3D" : "#9999BB" }}
                    >
                      ▼
                    </button>
                  </div>
                  <GripVertical size={16} style={{ color: "#2A2A3D" }} />
                  <div
                    className="w-1 h-8 rounded-full flex-shrink-0"
                    style={{ background: BODY_PART_COLORS[ex.bodyPart] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#F0F0FF" }}>
                      {ex.name}
                    </p>
                    <p className="text-xs" style={{ color: "#9999BB" }}>{ex.bodyPart}</p>
                  </div>

                  {/* 目標セット数 */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => changeTargetSets(item.exerciseId, -1)}
                      aria-label="目標セット数を減らす"
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: "#13131A", border: "1px solid #2A2A3D" }}
                    >
                      <Minus size={11} style={{ color: "#9999BB" }} />
                    </button>
                    <div className="text-center" style={{ minWidth: 28 }}>
                      <span className="text-sm font-mono font-bold" style={{ color: "#F0F0FF" }}>
                        {ts}
                      </span>
                      <p className="text-[9px]" style={{ color: "#9999BB" }}>セット</p>
                    </div>
                    <button
                      onClick={() => changeTargetSets(item.exerciseId, 1)}
                      aria-label="目標セット数を増やす"
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: "#13131A", border: "1px solid #2A2A3D" }}
                    >
                      <Plus size={11} style={{ color: "#9999BB" }} />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.exerciseId)}
                    aria-label={`${ex.name}を削除`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ background: "#EF444422" }}
                  >
                    <X size={14} style={{ color: "#EF4444" }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 種目選択シート */}
      <BottomSheet open={addExOpen} onClose={() => setAddExOpen(false)} title="種目を追加">
        {availableExercises.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: "#9999BB" }}>
            追加できる種目がありません
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {availableExercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => addItem(ex.id)}
                className="flex items-center gap-3 p-4 rounded-xl w-full text-left"
                style={{ background: "#1C1C27", border: "1px solid #2A2A3D" }}
              >
                <div
                  className="w-1 h-8 rounded-full flex-shrink-0"
                  style={{ background: BODY_PART_COLORS[ex.bodyPart] }}
                />
                <div>
                  <p className="text-sm font-medium" style={{ color: "#F0F0FF" }}>{ex.name}</p>
                  <p className="text-xs" style={{ color: "#9999BB" }}>{ex.bodyPart}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
