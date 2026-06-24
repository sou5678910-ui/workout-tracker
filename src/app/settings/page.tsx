"use client";
import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import Toast from "@/components/ui/Toast";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [restInput, setRestInput] = useState(String(settings.defaultRestSeconds));
  const [toast, setToast] = useState("");

  const handleSave = () => {
    const val = Number(restInput);
    if (!val || val < 10) return;
    updateSettings({ defaultRestSeconds: val });
    setToast("設定を保存しました");
  };

  const inputStyle = {
    background: "#1C1C27",
    border: "1px solid #2A2A3D",
    color: "#F0F0FF",
    borderRadius: "0.75rem",
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 flex flex-col gap-6">
      <Toast message={toast} visible={!!toast} onHide={() => setToast("")} />

      <h1 className="text-xl font-bold" style={{ color: "#F0F0FF" }}>設定</h1>

      {/* デフォルト休憩時間 */}
      <div
        className="p-4 rounded-xl flex flex-col gap-3"
        style={{ background: "#13131A", border: "1px solid #2A2A3D" }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "#F0F0FF" }}>
            デフォルト休憩時間
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#8888AA" }}>
            種目ごとの設定がない場合に使用されます
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <input
            type="number"
            inputMode="numeric"
            value={restInput}
            onChange={(e) => setRestInput(e.target.value)}
            className="w-28 px-4 py-3 text-lg font-mono text-center outline-none"
            style={inputStyle}
          />
          <span className="text-sm" style={{ color: "#8888AA" }}>秒</span>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ background: "#6C63FF", color: "#fff" }}
          >
            保存
          </button>
        </div>

        {/* よく使う値のクイック選択 */}
        <div className="flex gap-2">
          {[60, 90, 120, 180, 240].map((sec) => (
            <button
              key={sec}
              onClick={() => setRestInput(String(sec))}
              className="flex-1 py-2 rounded-lg text-xs font-medium"
              style={{
                background: Number(restInput) === sec ? "#6C63FF22" : "#1C1C27",
                color: Number(restInput) === sec ? "#6C63FF" : "#8888AA",
                border: `1px solid ${Number(restInput) === sec ? "#6C63FF44" : "#2A2A3D"}`,
              }}
            >
              {sec}秒
            </button>
          ))}
        </div>
      </div>

      {/* アプリ情報 */}
      <div
        className="p-4 rounded-xl"
        style={{ background: "#13131A", border: "1px solid #2A2A3D" }}
      >
        <p className="text-sm font-semibold" style={{ color: "#F0F0FF" }}>筋トレ記録</p>
        <p className="text-xs mt-1" style={{ color: "#8888AA" }}>
          データはこのデバイスにのみ保存されます
        </p>
      </div>
    </div>
  );
}
