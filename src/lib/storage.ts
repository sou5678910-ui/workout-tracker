import type { StorageSchema, TimerState, TimerStatus } from "@/types";

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
    if (!raw) return { ...DEFAULT };
    return validate(JSON.parse(raw));
  } catch {
    return { ...DEFAULT };
  }
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
