import type { WorkoutSession, Exercise, BodyPart } from "@/types";

// グラフで表示する指標（最大重量 or 総ボリューム）
export type MetricKey = "maxWeight" | "volume";

// 1日・1部位ぶんの集計値
export interface BodyPartPoint {
  date: string; // ローカル日付 "YYYY-MM-DD"
  maxWeight: number; // その日その部位の最大重量(kg)
  volume: number; // その日その部位の総ボリューム = Σ(重量×回数)
}

// 1部位ぶんの時系列
export interface BodyPartSeries {
  bodyPart: BodyPart;
  points: BodyPartPoint[]; // 日付昇順
}

// ISO日時を端末のローカルタイムゾーン基準で "YYYY-MM-DD" に丸める
// （toISOString は UTC 基準でズレるため使わない）
export function toLocalDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// セッション群を「部位ごと・日付ごと」に集計して時系列にする
export function buildBodyPartSeries(
  sessions: WorkoutSession[],
  exercises: Exercise[]
): BodyPartSeries[] {
  // 種目ID → 部位 の対応表（毎回 find しないよう一度だけ作る）
  const bodyPartById = new Map<string, BodyPart>(
    exercises.map((e) => [e.id, e.bodyPart])
  );

  // 部位 → (日付 → 集計) の二段マップ
  const byPart = new Map<BodyPart, Map<string, BodyPartPoint>>();

  for (const session of sessions) {
    if (session.sets.length === 0) continue;
    const dateKey = toLocalDateKey(session.startedAt);

    for (const set of session.sets) {
      const bodyPart = bodyPartById.get(set.exerciseId);
      if (!bodyPart) continue; // 削除済み種目（部位不明）は除外

      let dateMap = byPart.get(bodyPart);
      if (!dateMap) {
        dateMap = new Map<string, BodyPartPoint>();
        byPart.set(bodyPart, dateMap);
      }

      const existing = dateMap.get(dateKey);
      const setVolume = set.weight * set.reps;
      if (existing) {
        existing.maxWeight = Math.max(existing.maxWeight, set.weight);
        existing.volume += setVolume;
      } else {
        dateMap.set(dateKey, {
          date: dateKey,
          maxWeight: set.weight,
          volume: setVolume,
        });
      }
    }
  }

  // 各部位の points を日付昇順に整列
  const series: BodyPartSeries[] = [];
  for (const [bodyPart, dateMap] of byPart) {
    const points = [...dateMap.values()].sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : 0
    );
    series.push({ bodyPart, points });
  }

  // 並びは「最後に記録した日が新しい部位」を上に（主戦場が上に来る）
  series.sort((a, b) => {
    const aLast = a.points[a.points.length - 1]?.date ?? "";
    const bLast = b.points[b.points.length - 1]?.date ?? "";
    return aLast < bLast ? 1 : aLast > bLast ? -1 : 0;
  });

  return series;
}

// 指標キーから点の値を取り出す
export function pointValue(point: BodyPartPoint, metric: MetricKey): number {
  return metric === "maxWeight" ? point.maxWeight : point.volume;
}
