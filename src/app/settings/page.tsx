"use client";
import { useState, useRef } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useAppContext } from "@/contexts/AppContext";
import { parseImport } from "@/lib/storage";
import { downloadTextFile, backupDateStamp } from "@/lib/download";
import { Download, Upload } from "lucide-react";
import Toast from "@/components/ui/Toast";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { data, importData } = useAppContext();
  const [restInput, setRestInput] = useState(String(settings.defaultRestSeconds));
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastType(type);
    setToast(message);
  };

  const handleSave = () => {
    const val = Number(restInput);
    if (!val || val < 10) return;
    updateSettings({ defaultRestSeconds: val });
    showToast("設定を保存しました");
  };

  // バックアップを保存（書き出し）
  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    downloadTextFile(`workout-backup-${backupDateStamp()}.json`, json);
    showToast("バックアップを保存しました");
  };

  // バックアップから復元（読み込み）
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同じファイルを続けて選べるようにリセット
    if (!file) return;
    try {
      const text = await file.text();
      const next = parseImport(text); // 不正なら例外を投げる
      const ok = confirm(
        `今の記録（種目 ${data.exercises.length} 件・トレーニング ${data.sessions.length} 件）は` +
          `すべて消えて、読み込んだ内容に置き換わります。\nこの操作は取り消せません。よろしいですか？`
      );
      if (!ok) return;
      importData(next);
      showToast("バックアップから復元しました");
    } catch {
      showToast("読み込みに失敗しました。正しいバックアップファイルか確認してください", "error");
    }
  };

  const inputStyle = {
    background: "#1C1C27",
    border: "1px solid #2A2A3D",
    color: "#F0F0FF",
    borderRadius: "0.75rem",
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 flex flex-col gap-6">
      <Toast
        message={toast}
        visible={!!toast}
        onHide={() => setToast("")}
        type={toastType}
        position="bottom"
      />

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

      {/* データのバックアップ */}
      <div
        className="p-4 rounded-xl flex flex-col gap-3"
        style={{ background: "#13131A", border: "1px solid #2A2A3D" }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "#F0F0FF" }}>データのバックアップ</p>
          <p className="text-xs mt-1" style={{ color: "#8888AA" }}>
            データはこのデバイスにのみ保存されます。機種変更や消失に備えて、ときどき書き出して保存してください。
          </p>
        </div>

        {/* 書き出し（主ボタン） */}
        <button
          onClick={handleExport}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: "#6C63FF", color: "#fff" }}
        >
          <Download size={16} />
          バックアップを保存
        </button>

        {/* 読み込み（副ボタン・破壊的なので控えめに） */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
          style={{ background: "#1C1C27", color: "#9999BB", border: "1px solid #2A2A3D" }}
        >
          <Upload size={16} />
          バックアップから復元
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleImportFile}
          className="hidden"
        />
        <p className="text-[11px]" style={{ color: "#8888AA" }}>
          ※復元すると今の記録はすべて置き換わります。先に「保存」しておくと安心です。
        </p>
      </div>
    </div>
  );
}
