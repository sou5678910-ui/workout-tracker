"use client";
import { useState, useMemo } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { buildBodyPartSeries, pointValue, type MetricKey } from "@/lib/stats";
import { BODY_PART_COLORS } from "@/types";
import ProgressChart from "@/components/stats/ProgressChart";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

const METRICS: { key: MetricKey; label: string }[] = [
  { key: "maxWeight", label: "最大重量" },
  { key: "volume", label: "総ボリューム" },
];

export default function StatsPage() {
  const { data } = useAppContext();
  const [metric, setMetric] = useState<MetricKey>("maxWeight");

  const series = useMemo(
    () => buildBodyPartSeries(data.sessions, data.exercises),
    [data.sessions, data.exercises]
  );

  const formatValue = (v: number) =>
    metric === "maxWeight" ? `${v}kg` : `${v.toLocaleString()}kg`;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 flex flex-col gap-4">
      {/* タイトル */}
      <div className="flex items-center gap-2">
        <BarChart3 size={22} style={{ color: "#6C63FF" }} />
        <h1 className="text-xl font-bold" style={{ color: "#F0F0FF" }}>記録</h1>
      </div>

      {/* 指標トグル（スクロールしても上に残る） */}
      <div className="sticky top-0 z-10 py-2" style={{ background: "#0A0A0F" }}>
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ border: "1px solid #2A2A3D" }}
          role="group"
          aria-label="表示する指標"
        >
          {METRICS.map((m) => {
            const active = metric === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                aria-pressed={active}
                className="flex-1 py-2.5 text-sm font-medium"
                style={{
                  background: active ? "#6C63FF22" : "transparent",
                  color: active ? "#6C63FF" : "#8888AA",
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {series.length === 0 ? (
        /* ページ全体の空状態 */
        <div
          className="p-6 rounded-xl text-center"
          style={{ background: "#13131A", border: "1px solid #2A2A3D" }}
        >
          <p className="text-sm" style={{ color: "#8888AA" }}>
            記録がまだありません。
          </p>
          <p className="text-xs mt-1" style={{ color: "#8888AA" }}>
            トレーニングを記録すると、ここに部位ごとの成長グラフが表示されます。
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {series.map(({ bodyPart, points }) => {
            const color = BODY_PART_COLORS[bodyPart];
            const latest = pointValue(points[points.length - 1], metric);
            const first = pointValue(points[0], metric);
            const change = latest - first;
            const hasMany = points.length > 1;

            const ChangeIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
            const changeColor = change > 0 ? "#22C55E" : change < 0 ? "#EF4444" : "#9999BB";

            return (
              <div
                key={bodyPart}
                className="p-4 rounded-xl flex flex-col gap-3"
                style={{ background: "#13131A", border: "1px solid #2A2A3D" }}
              >
                {/* ヘッダー：部位名 + 最新値（大きく） */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-sm font-semibold truncate" style={{ color: "#F0F0FF" }}>
                      {bodyPart}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-mono font-bold leading-none" style={{ color: "#F0F0FF" }}>
                      {formatValue(latest)}
                    </p>
                  </div>
                </div>

                {/* 変化（記号＋符号＋数値＋基準。色だけに頼らない） */}
                {hasMany && (
                  <div className="flex items-center gap-1 text-xs" style={{ color: changeColor }}>
                    <ChangeIcon size={14} />
                    <span className="font-medium">
                      {change === 0
                        ? "変化なし"
                        : `${change > 0 ? "+" : "−"}${formatValue(Math.abs(change))}`}
                    </span>
                    <span style={{ color: "#8888AA" }}>（最初から）</span>
                  </div>
                )}

                {/* グラフ or 点1個の案内 */}
                {hasMany ? (
                  <ProgressChart
                    points={points.map((p) => ({ date: p.date, value: pointValue(p, metric) }))}
                    color={color}
                  />
                ) : (
                  <div
                    className="rounded-xl px-3 py-4 text-center text-xs"
                    style={{ background: "#1C1C27", border: "1px solid #2A2A3D", color: "#8888AA" }}
                  >
                    あと1回記録すると、変化がグラフで見られます
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
