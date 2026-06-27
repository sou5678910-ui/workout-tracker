import type { StorageSchema, TimerState, TimerStatus, Exercise } from "@/types";

export const DEFAULT_REST_SECONDS = 120;
export const DEFAULT_TARGET_SETS = 3;

const KEY = "workout-tracker-v1";

export const DEFAULT: StorageSchema = {
  version: 1,
  exercises: [],
  menus: [],
  sessions: [],
  videos: [],
  timer: null,
  settings: { defaultRestSeconds: DEFAULT_REST_SECONDS },
};

// 初めてアプリを開いた人に最初から入れておく「主要種目」一覧。
// 固定IDにして、初回保存後もIDが変わらないようにする。
const SEED_AT = "2026-01-01T00:00:00.000Z";
export const DEFAULT_EXERCISES: Exercise[] = [
  // 胸
  { id: "seed-chest-bench-press", name: "ベンチプレス", bodyPart: "胸", videoIds: [], createdAt: SEED_AT },
  { id: "seed-chest-db-press", name: "ダンベルプレス", bodyPart: "胸", videoIds: [], createdAt: SEED_AT },
  { id: "seed-chest-incline", name: "インクラインベンチプレス", bodyPart: "胸", videoIds: [], createdAt: SEED_AT },
  { id: "seed-chest-fly", name: "ダンベルフライ", bodyPart: "胸", videoIds: [], createdAt: SEED_AT },
  { id: "seed-chest-machine", name: "チェストプレス（マシン）", bodyPart: "胸", videoIds: [], createdAt: SEED_AT },
  { id: "seed-chest-pushup", name: "腕立て伏せ", bodyPart: "胸", videoIds: [], createdAt: SEED_AT },
  { id: "seed-chest-dips", name: "ディップス", bodyPart: "胸", videoIds: [], createdAt: SEED_AT },
  // 背中
  { id: "seed-back-deadlift", name: "デッドリフト", bodyPart: "背中", videoIds: [], createdAt: SEED_AT },
  { id: "seed-back-chinning", name: "懸垂（チンニング）", bodyPart: "背中", videoIds: [], createdAt: SEED_AT },
  { id: "seed-back-latpulldown", name: "ラットプルダウン", bodyPart: "背中", videoIds: [], createdAt: SEED_AT },
  { id: "seed-back-bentover-row", name: "ベントオーバーロウ", bodyPart: "背中", videoIds: [], createdAt: SEED_AT },
  { id: "seed-back-seated-row", name: "シーテッドロウ", bodyPart: "背中", videoIds: [], createdAt: SEED_AT },
  { id: "seed-back-db-row", name: "ダンベルロウ", bodyPart: "背中", videoIds: [], createdAt: SEED_AT },
  // 肩
  { id: "seed-sho-shoulder-press", name: "ショルダープレス", bodyPart: "肩", videoIds: [], createdAt: SEED_AT },
  { id: "seed-sho-side-raise", name: "サイドレイズ", bodyPart: "肩", videoIds: [], createdAt: SEED_AT },
  { id: "seed-sho-front-raise", name: "フロントレイズ", bodyPart: "肩", videoIds: [], createdAt: SEED_AT },
  { id: "seed-sho-rear-raise", name: "リアレイズ", bodyPart: "肩", videoIds: [], createdAt: SEED_AT },
  { id: "seed-sho-upright-row", name: "アップライトロウ", bodyPart: "肩", videoIds: [], createdAt: SEED_AT },
  // 腕
  { id: "seed-arm-barbell-curl", name: "バーベルカール", bodyPart: "腕", videoIds: [], createdAt: SEED_AT },
  { id: "seed-arm-db-curl", name: "ダンベルカール", bodyPart: "腕", videoIds: [], createdAt: SEED_AT },
  { id: "seed-arm-hammer-curl", name: "ハンマーカール", bodyPart: "腕", videoIds: [], createdAt: SEED_AT },
  { id: "seed-arm-pressdown", name: "トライセプスプレスダウン", bodyPart: "腕", videoIds: [], createdAt: SEED_AT },
  { id: "seed-arm-french-press", name: "フレンチプレス", bodyPart: "腕", videoIds: [], createdAt: SEED_AT },
  // 脚
  { id: "seed-leg-squat", name: "スクワット", bodyPart: "脚", videoIds: [], createdAt: SEED_AT },
  { id: "seed-leg-press", name: "レッグプレス", bodyPart: "脚", videoIds: [], createdAt: SEED_AT },
  { id: "seed-leg-extension", name: "レッグエクステンション", bodyPart: "脚", videoIds: [], createdAt: SEED_AT },
  { id: "seed-leg-curl", name: "レッグカール", bodyPart: "脚", videoIds: [], createdAt: SEED_AT },
  { id: "seed-leg-rdl", name: "ルーマニアンデッドリフト", bodyPart: "脚", videoIds: [], createdAt: SEED_AT },
  { id: "seed-leg-hip-thrust", name: "ヒップスラスト", bodyPart: "脚", videoIds: [], createdAt: SEED_AT },
  { id: "seed-leg-calf-raise", name: "カーフレイズ", bodyPart: "脚", videoIds: [], createdAt: SEED_AT },
  // 腹
  { id: "seed-abs-crunch", name: "クランチ", bodyPart: "腹", videoIds: [], createdAt: SEED_AT },
  { id: "seed-abs-leg-raise", name: "レッグレイズ", bodyPart: "腹", videoIds: [], createdAt: SEED_AT },
  { id: "seed-abs-plank", name: "プランク", bodyPart: "腹", videoIds: [], createdAt: SEED_AT },
  { id: "seed-abs-roller", name: "アブローラー", bodyPart: "腹", videoIds: [], createdAt: SEED_AT },
  { id: "seed-abs-bicycle", name: "バイシクルクランチ", bodyPart: "腹", videoIds: [], createdAt: SEED_AT },
  // その他
  { id: "seed-other-farmers-walk", name: "ファーマーズウォーク", bodyPart: "その他", videoIds: [], createdAt: SEED_AT },
  { id: "seed-other-burpee", name: "バーピー", bodyPart: "その他", videoIds: [], createdAt: SEED_AT },
];

const VALID_TIMER_STATUSES: TimerStatus[] = ["running", "paused", "ended"];

function validateTimer(raw: unknown): TimerState | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  if (
    typeof t.startedAt !== "string" ||
    typeof t.endsAt !== "string" ||
    typeof t.exerciseId !== "string" ||
    typeof t.exerciseName !== "string" ||
    typeof t.restSeconds !== "number" ||
    !VALID_TIMER_STATUSES.includes(t.status as TimerStatus)
  ) {
    return null;
  }
  return {
    startedAt: t.startedAt,
    endsAt: t.endsAt,
    exerciseId: t.exerciseId,
    exerciseName: t.exerciseName,
    restSeconds: t.restSeconds,
    status: t.status as TimerStatus,
    remainingAtPause: typeof t.remainingAtPause === "number" ? t.remainingAtPause : undefined,
  };
}

function validate(raw: unknown): StorageSchema {
  if (!raw || typeof raw !== "object") return { ...DEFAULT };
  const r = raw as Record<string, unknown>;

  const menus = Array.isArray(r.menus)
    ? r.menus.map((m: unknown) => {
        if (!m || typeof m !== "object") return null;
        const menu = m as Record<string, unknown>;
        return {
          id: String(menu.id ?? ""),
          name: String(menu.name ?? ""),
          createdAt: String(menu.createdAt ?? new Date().toISOString()),
          items: Array.isArray(menu.items)
            ? menu.items.map((item: unknown) => {
                if (!item || typeof item !== "object") return null;
                const i = item as Record<string, unknown>;
                return {
                  exerciseId: String(i.exerciseId ?? ""),
                  order: typeof i.order === "number" ? i.order : 0,
                  // 既存データに targetSets がなければデフォルト値を補完
                  targetSets: typeof i.targetSets === "number" ? i.targetSets : DEFAULT_TARGET_SETS,
                };
              }).filter(Boolean)
            : [],
        };
      }).filter(Boolean)
    : [];

  return {
    version: 1,
    exercises: Array.isArray(r.exercises) ? r.exercises : [],
    menus: menus as StorageSchema["menus"],
    sessions: Array.isArray(r.sessions) ? r.sessions : [],
    videos: Array.isArray(r.videos) ? r.videos : [],
    timer: validateTimer(r.timer),
    settings:
      r.settings && typeof r.settings === "object"
        ? {
            defaultRestSeconds:
              typeof (r.settings as Record<string, unknown>).defaultRestSeconds === "number"
                ? (r.settings as Record<string, unknown>).defaultRestSeconds as number
                : DEFAULT_REST_SECONDS,
          }
        : { defaultRestSeconds: DEFAULT_REST_SECONDS },
  };
}

export function loadStorage(): StorageSchema {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      // 初回起動（データが未保存）のときだけ、主要種目を入れて保存する。
      // 既存ユーザー（raw あり）には影響せず、削除した種目が復活することもない。
      const seeded: StorageSchema = {
        version: 1,
        exercises: DEFAULT_EXERCISES.map((e) => ({ ...e })),
        menus: [],
        sessions: [],
        videos: [],
        timer: null,
        settings: { defaultRestSeconds: DEFAULT_REST_SECONDS },
      };
      saveStorage(seeded);
      return seeded;
    }
    return validate(JSON.parse(raw));
  } catch {
    return { ...DEFAULT };
  }
}

// バックアップファイル(JSON文字列)を取り込む。
// 「このアプリのバックアップか」を最低限検証し、不正なら例外を投げて取り込みを中止する。
// （validate は欠損に寛容で空オブジェクトでも DEFAULT を返すため、そのまま流用すると
//  別物JSONを読んでも“成功”扱いになり全データを消しかねない。ここで弾く。）
export function parseImport(text: string): StorageSchema {
  const raw = JSON.parse(text); // 失敗時は SyntaxError を投げる
  if (!raw || typeof raw !== "object") {
    throw new Error("不正なファイル形式です");
  }
  const r = raw as Record<string, unknown>;
  if (r.version !== 1 || !Array.isArray(r.sessions) || !Array.isArray(r.exercises)) {
    throw new Error("このアプリのバックアップファイルではありません");
  }
  // 形が合っていれば既存 validate で正規化。タイマーは引き継がない。
  return { ...validate(raw), timer: null };
}

export function saveStorage(data: StorageSchema): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded — データを保存できませんでした");
    }
  }
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // フォールバック
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
