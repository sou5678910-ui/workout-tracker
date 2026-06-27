export type BodyPart =
  | "胸"
  | "背中"
  | "肩"
  | "腕"
  | "脚"
  | "腹"
  | "その他";

export const BODY_PARTS: BodyPart[] = ["胸", "背中", "肩", "腕", "脚", "腹", "その他"];

export const BODY_PART_COLORS: Record<BodyPart, string> = {
  胸: "#EF4444",
  背中: "#22C55E",
  肩: "#3B82F6",
  腕: "#F59E0B",
  脚: "#8B5CF6",
  腹: "#06B6D4",
  その他: "#6B7280",
};

export interface YoutubeVideo {
  id: string;
  url: string;
  title: string;
  note: string;
  exerciseId: string;
  createdAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  bodyPart: BodyPart;
  restSeconds?: number;
  videoIds: string[];
  createdAt: string;
}

export interface MenuItem {
  exerciseId: string;
  order: number;
  targetSets: number; // 目標セット数（デフォルト3）
}

export interface TrainingMenu {
  id: string;
  name: string;
  items: MenuItem[];
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  weight: number;
  reps: number;
  completedAt: string;
}

export interface WorkoutSession {
  id: string;
  menuId: string;
  menuName: string;
  startedAt: string;
  endedAt?: string;
  sets: WorkoutSet[];
  exerciseNotes?: Record<string, string>; // exerciseId → コメント
}

// "idle" は timer: null で表現するため除外
export type TimerStatus = "running" | "paused" | "ended";

export interface TimerState {
  startedAt: string;
  endsAt: string;
  exerciseId: string;
  exerciseName: string;
  restSeconds: number;
  status: TimerStatus;
  remainingAtPause?: number; // 一時停止時の残り秒数
}

export interface AppSettings {
  defaultRestSeconds: number;
  skipExerciseNotes?: boolean; // true にするとコメント入力画面を表示しない
}

export interface StorageSchema {
  version: 1;
  exercises: Exercise[];
  menus: TrainingMenu[];
  sessions: WorkoutSession[];
  videos: YoutubeVideo[];
  timer: TimerState | null;
  settings: AppSettings;
}
