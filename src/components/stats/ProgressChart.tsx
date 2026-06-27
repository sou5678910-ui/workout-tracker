"use client";

interface ChartPoint {
  date: string; // "YYYY-MM-DD"
  value: number;
}

interface ProgressChartProps {
  points: ChartPoint[];
  color: string;
}

// viewBox 座標系（width:100% で実寸へ拡大される）
const W = 320;
const H = 150;
const PAD_L = 44; // 左の余白に y軸ラベルを置く（桁数が多くても見切れない幅）
const PAD_R = 14;
const PAD_T = 16;
const PAD_B = 20; // 下に x軸の日付ラベル

function formatMD(dateKey: string): string {
  const parts = dateKey.split("-");
  if (parts.length !== 3) return dateKey;
  return `${Number(parts[1])}/${Number(parts[2])}`;
}

export default function ProgressChart({ points, color }: ProgressChartProps) {
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const baseY = H - PAD_B;

  const values = points.map((p) => p.value);
  const vmax = Math.max(...values);
  const vmin = Math.min(...values);
  const range = vmax - vmin || 1;

  const n = points.length;
  const xAt = (i: number) => (n === 1 ? PAD_L + chartW / 2 : PAD_L + (i / (n - 1)) * chartW);
  const yAt = (v: number) =>
    vmax === vmin ? PAD_T + chartH / 2 : PAD_T + (1 - (v - vmin) / range) * chartH;

  const coords = points.map((p, i) => ({ x: xAt(i), y: yAt(p.value), p }));
  const last = coords[n - 1];

  const linePath = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPath =
    n > 1
      ? `${coords[0].x.toFixed(1)},${baseY} ` +
        coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ") +
        ` ${last.x.toFixed(1)},${baseY}`
      : "";

  // y軸ラベルは単位なしの数字（単位はカード見出しで示す）
  const fmtAxis = (v: number) => v.toLocaleString();

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block" }}
      role="img"
      aria-label="成長グラフ"
    >
      {/* 中央の薄いグリッド線 */}
      <line
        x1={PAD_L}
        y1={PAD_T + chartH / 2}
        x2={W - PAD_R}
        y2={PAD_T + chartH / 2}
        stroke="#2A2A3D"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />

      {/* 線の下の塗り（モダンな見た目） */}
      {n > 1 && <polygon points={areaPath} fill={color} fillOpacity={0.12} />}

      {/* 折れ線 */}
      {n > 1 && (
        <polyline
          points={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {/* 各点（最新点は大きく） */}
      {coords.map((c, i) => (
        <circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={i === n - 1 ? 4 : 2.5}
          fill={color}
          stroke="#13131A"
          strokeWidth={i === n - 1 ? 2 : 0}
        />
      ))}

      {/* y軸ラベル（左の余白に最大/最小・単位なし） */}
      <text x={2} y={PAD_T + 4} fontSize={10} fill="#8888AA" textAnchor="start">
        {fmtAxis(vmax)}
      </text>
      {vmax !== vmin && (
        <text x={2} y={baseY + 3} fontSize={10} fill="#8888AA" textAnchor="start">
          {fmtAxis(vmin)}
        </text>
      )}

      {/* x軸ラベル（最初/最後の日付） */}
      <text x={PAD_L} y={H - 4} fontSize={11} fill="#9999BB" textAnchor="start">
        {formatMD(points[0].date)}
      </text>
      {n > 1 && (
        <text x={W - PAD_R} y={H - 4} fontSize={11} fill="#9999BB" textAnchor="end">
          {formatMD(points[n - 1].date)}
        </text>
      )}
    </svg>
  );
}
