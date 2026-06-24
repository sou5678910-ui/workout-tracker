"use client";
import { useState } from "react";
import Link from "next/link";
import { useMenus } from "@/hooks/useMenus";
import { Plus, ChevronRight, Trash2 } from "lucide-react";
import Toast from "@/components/ui/Toast";

export default function MenusPage() {
  const { menus, deleteMenu } = useMenus();
  const [toast, setToast] = useState("");

  const handleDelete = (id: string, name: string) => {
    if (confirm(`「${name}」を削除しますか？`)) {
      deleteMenu(id);
      setToast("メニューを削除しました");
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 flex flex-col gap-4">
      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />

      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "#F0F0FF" }}>メニュー</h1>
        <Link
          href="/menus/new"
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "#6C63FF", boxShadow: "0 4px 16px #6C63FF44" }}
        >
          <Plus size={20} color="white" />
        </Link>
      </div>

      {menus.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm" style={{ color: "#8888AA" }}>
            右上の＋からメニューを作成してください
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {menus.map((menu) => (
            <div
              key={menu.id}
              className="flex items-center gap-2 p-4 rounded-xl"
              style={{ background: "#13131A", border: "1px solid #2A2A3D" }}
            >
              <Link
                href={`/menus/${menu.id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#F0F0FF" }}>
                    {menu.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#8888AA" }}>
                    {menu.items.length} 種目
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: "#2A2A3D", flexShrink: 0 }} />
              </Link>
              <button
                onClick={() => handleDelete(menu.id, menu.name)}
                className="w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0"
                style={{ background: "#EF444422" }}
              >
                <Trash2 size={15} style={{ color: "#EF4444" }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
