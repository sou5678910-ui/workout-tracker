"use client";
import { useState } from "react";
import type { Exercise, BodyPart } from "@/types";
import { BODY_PARTS } from "@/types";

interface ExerciseFormProps {
  initial?: Partial<Exercise>;
  onSubmit: (data: { name: string; bodyPart: BodyPart; restSeconds?: number }) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export default function ExerciseForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "追加",
}: ExerciseFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [bodyPart, setBodyPart] = useState<BodyPart>(initial?.bodyPart ?? "胸");
  const [restInput, setRestInput] = useState(
    initial?.restSeconds != null ? String(initial.restSeconds) : ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      bodyPart,
      restSeconds: restInput ? Number(restInput) : undefined,
    });
  };

  const inputStyle = {
    background: "#1C1C27",
    border: "1px solid #2A2A3D",
    color: "#F0F0FF",
    borderRadius: "0.75rem",
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* 種目名 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-widest" style={{ color: "#8888AA" }}>
          種目名
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: ベンチプレス"
          className="w-full px-4 py-3 text-base outline-none"
          style={inputStyle}
          autoFocus
        />
      </div>

      {/* 部位 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-widest" style={{ color: "#8888AA" }}>
          部位
        </label>
        <div className="flex flex-wrap gap-2">
          {BODY_PARTS.map((part) => (
            <button
              key={part}
              type="button"
              onClick={() => setBodyPart(part)}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: bodyPart === part ? "#6C63FF" : "#1C1C27",
                color: bodyPart === part ? "#fff" : "#8888AA",
                border: `1px solid ${bodyPart === part ? "#6C63FF" : "#2A2A3D"}`,
              }}
            >
              {part}
            </button>
          ))}
        </div>
      </div>

      {/* 標準休憩時間 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-widest" style={{ color: "#8888AA" }}>
          標準休憩時間（秒・空欄=アプリ設定を使用）
        </label>
        <input
          type="number"
          inputMode="numeric"
          value={restInput}
          onChange={(e) => setRestInput(e.target.value)}
          placeholder="120"
          className="w-full px-4 py-3 text-base outline-none"
          style={inputStyle}
        />
      </div>

      {/* ボタン */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl text-sm font-medium"
          style={{ background: "#1C1C27", color: "#8888AA", border: "1px solid #2A2A3D" }}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-xl text-sm font-semibold"
          style={{
            background: "#6C63FF",
            color: "#fff",
            boxShadow: "0 4px 24px #6C63FF44",
          }}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
