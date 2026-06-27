"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type {
  StorageSchema,
  Exercise,
  TrainingMenu,
  MenuItem,
  WorkoutSession,
  WorkoutSet,
  YoutubeVideo,
  AppSettings,
  BodyPart,
  TimerState,
} from "@/types";
import { loadStorage, saveStorage, generateId, DEFAULT, DEFAULT_REST_SECONDS } from "@/lib/storage";

// ─── タイマー表示用型 ──────────────────────────────────────────────
export interface TimerDisplay {
  remaining: number; // 秒（負=超過）
  status: "running" | "paused" | "ended";
  exerciseId: string;
  exerciseName: string;
  restSeconds: number; // 現在の設定休憩時間（調整済み）
}

// ─── AudioContext を使い回す（lazy初期化） ────────────────────────
let sharedAudioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new AudioContext();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

// ユーザー操作後に呼んでおくと suspended 状態を解除できる
export function unlockAudio() {
  try {
    const ctx = getAudioCtx();
    if (ctx && ctx.state === "suspended") ctx.resume();
  } catch {
    // ignore
  }
}

function beep() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const doBeep = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    };
    if (ctx.state === "suspended") {
      ctx.resume().then(doBeep).catch(() => {});
    } else {
      doBeep();
    }
  } catch {
    // ignore
  }
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // ignore
  }
}

// ─── Context 型定義 ───────────────────────────────────────────────
interface AppContextValue {
  data: StorageSchema;
  timerDisplay: TimerDisplay | null;

  // 種目
  addExercise: (name: string, bodyPart: BodyPart, restSeconds?: number) => Exercise;
  updateExercise: (id: string, patch: Partial<Pick<Exercise, "name" | "bodyPart" | "restSeconds">>) => void;
  deleteExercise: (id: string) => void;

  // メニュー
  addMenu: (name: string, items: MenuItem[]) => TrainingMenu;
  updateMenu: (id: string, patch: Partial<Pick<TrainingMenu, "name" | "items">>) => void;
  deleteMenu: (id: string) => void;

  // セッション
  startSession: (menuId: string, menuName: string) => WorkoutSession;
  endSession: (sessionId: string) => void;
  addSet: (sessionId: string, exerciseId: string, weight: number, reps: number) => WorkoutSet;
  updateSet: (sessionId: string, setId: string, weight: number, reps: number) => void;
  updateExerciseNote: (sessionId: string, exerciseId: string, note: string) => void;
  getLastSetsForExercise: (exerciseId: string, excludeSessionId?: string) => WorkoutSet[];
  getSession: (sessionId: string) => WorkoutSession | undefined;

  // 動画
  addVideo: (exerciseId: string, url: string, title: string, note: string) => YoutubeVideo;
  updateVideo: (id: string, patch: Partial<Pick<YoutubeVideo, "url" | "title" | "note">>) => void;
  deleteVideo: (id: string) => void;

  // 設定
  updateSettings: (patch: Partial<AppSettings>) => void;

  // タイマー操作
  startTimer: (exerciseId: string, exerciseName: string, restSeconds: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  adjustTimer: (delta: number) => void;
  clearTimer: () => void;
  saveTimerRestSeconds: (exerciseId: string, restSeconds: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StorageSchema>({ ...DEFAULT });

  // クライアントサイドでのみlocalStorageを読み込む
  useEffect(() => {
    setData(loadStorage());
  }, []);

  // アトミックな状態更新（Lost Update を防ぐ）
  const updateData = useCallback((fn: (prev: StorageSchema) => StorageSchema) => {
    setData((prev) => {
      const next = fn(prev);
      saveStorage(next);
      return next;
    });
  }, []);

  // ─── タイマー: 500msごとに再レンダリングを強制 ────────────────
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  // timerDisplay は data.timer + tick から純粋に導出（副作用なし）
  const timerDisplay = useMemo<TimerDisplay | null>(() => {
    const timer = data.timer;
    if (!timer) return null;
    if (timer.status === "paused") {
      return {
        remaining: timer.remainingAtPause ?? 0,
        status: "paused",
        exerciseId: timer.exerciseId,
        exerciseName: timer.exerciseName,
        restSeconds: timer.restSeconds,
      };
    }
    const remaining = Math.ceil(
      (new Date(timer.endsAt).getTime() - Date.now()) / 1000
    );
    const status = remaining <= 0 ? "ended" : "running";
    return {
      remaining,
      status,
      exerciseId: timer.exerciseId,
      exerciseName: timer.exerciseName,
      restSeconds: timer.restSeconds,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.timer, tick]); // tick で500msごとに再計算

  // タイマー終了の通知（setData外の副作用として分離）
  const prevTimerStatusRef = useRef<string | null>(null);
  useEffect(() => {
    if (timerDisplay?.status === "ended" && prevTimerStatusRef.current !== "ended") {
      beep();
      vibrate([200, 100, 200, 100, 200]);
      // localStorage の status を "ended" に更新（冪等）
      updateData((prev) =>
        prev.timer && prev.timer.status !== "ended"
          ? { ...prev, timer: { ...prev.timer, status: "ended" as const } }
          : prev
      );
    }
    prevTimerStatusRef.current = timerDisplay?.status ?? null;
  }, [timerDisplay?.status, updateData]);

  // ─── 種目 ─────────────────────────────────────────────────────
  const addExercise = useCallback(
    (name: string, bodyPart: BodyPart, restSeconds?: number): Exercise => {
      const exercise: Exercise = {
        id: generateId(),
        name,
        bodyPart,
        restSeconds,
        videoIds: [],
        createdAt: new Date().toISOString(),
      };
      updateData((prev) => ({ ...prev, exercises: [...prev.exercises, exercise] }));
      return exercise;
    },
    [updateData]
  );

  const updateExercise = useCallback(
    (id: string, patch: Partial<Pick<Exercise, "name" | "bodyPart" | "restSeconds">>) => {
      updateData((prev) => ({
        ...prev,
        exercises: prev.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }));
    },
    [updateData]
  );

  const deleteExercise = useCallback(
    (id: string) => {
      updateData((prev) => ({
        ...prev,
        exercises: prev.exercises.filter((e) => e.id !== id),
        menus: prev.menus.map((m) => ({
          ...m,
          items: m.items.filter((item) => item.exerciseId !== id),
        })),
        videos: prev.videos.filter((v) => v.exerciseId !== id),
      }));
    },
    [updateData]
  );

  // ─── メニュー ─────────────────────────────────────────────────
  const addMenu = useCallback(
    (name: string, items: MenuItem[]): TrainingMenu => {
      const menu: TrainingMenu = {
        id: generateId(),
        name,
        items,
        createdAt: new Date().toISOString(),
      };
      updateData((prev) => ({ ...prev, menus: [...prev.menus, menu] }));
      return menu;
    },
    [updateData]
  );

  const updateMenu = useCallback(
    (id: string, patch: Partial<Pick<TrainingMenu, "name" | "items">>) => {
      updateData((prev) => ({
        ...prev,
        menus: prev.menus.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      }));
    },
    [updateData]
  );

  const deleteMenu = useCallback(
    (id: string) => {
      updateData((prev) => ({ ...prev, menus: prev.menus.filter((m) => m.id !== id) }));
    },
    [updateData]
  );

  // ─── セッション ───────────────────────────────────────────────
  const startSession = useCallback(
    (menuId: string, menuName: string): WorkoutSession => {
      const session: WorkoutSession = {
        id: generateId(),
        menuId,
        menuName,
        startedAt: new Date().toISOString(),
        sets: [],
      };
      updateData((prev) => ({ ...prev, sessions: [...prev.sessions, session] }));
      return session;
    },
    [updateData]
  );

  const endSession = useCallback(
    (sessionId: string) => {
      updateData((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === sessionId ? { ...s, endedAt: new Date().toISOString() } : s
        ),
      }));
    },
    [updateData]
  );

  const addSet = useCallback(
    (sessionId: string, exerciseId: string, weight: number, reps: number): WorkoutSet => {
      const set: WorkoutSet = {
        id: generateId(),
        exerciseId,
        weight,
        reps,
        completedAt: new Date().toISOString(),
      };
      updateData((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === sessionId ? { ...s, sets: [...s.sets, set] } : s
        ),
      }));
      return set;
    },
    [updateData]
  );

  const updateSet = useCallback(
    (sessionId: string, setId: string, weight: number, reps: number) => {
      updateData((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                sets: s.sets.map((set) =>
                  set.id === setId ? { ...set, weight, reps } : set
                ),
              }
            : s
        ),
      }));
    },
    [updateData]
  );

  const updateExerciseNote = useCallback(
    (sessionId: string, exerciseId: string, note: string) => {
      updateData((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === sessionId
            ? { ...s, exerciseNotes: { ...(s.exerciseNotes ?? {}), [exerciseId]: note } }
            : s
        ),
      }));
    },
    [updateData]
  );

  const getLastSetsForExercise = useCallback(
    (exerciseId: string, excludeSessionId?: string): WorkoutSet[] => {
      const sorted = [...data.sessions]
        .filter(
          (s) =>
            s.endedAt &&
            s.id !== excludeSessionId &&
            s.sets.some((set) => set.exerciseId === exerciseId)
        )
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      return sorted[0]?.sets.filter((s) => s.exerciseId === exerciseId) ?? [];
    },
    [data.sessions]
  );

  const getSession = useCallback(
    (sessionId: string): WorkoutSession | undefined =>
      data.sessions.find((s) => s.id === sessionId),
    [data.sessions]
  );

  // ─── 動画 ─────────────────────────────────────────────────────
  const addVideo = useCallback(
    (exerciseId: string, url: string, title: string, note: string): YoutubeVideo => {
      const video: YoutubeVideo = {
        id: generateId(),
        url,
        title,
        note,
        exerciseId,
        createdAt: new Date().toISOString(),
      };
      updateData((prev) => ({
        ...prev,
        videos: [...prev.videos, video],
        exercises: prev.exercises.map((e) =>
          e.id === exerciseId ? { ...e, videoIds: [...e.videoIds, video.id] } : e
        ),
      }));
      return video;
    },
    [updateData]
  );

  const updateVideo = useCallback(
    (id: string, patch: Partial<Pick<YoutubeVideo, "url" | "title" | "note">>) => {
      updateData((prev) => ({
        ...prev,
        videos: prev.videos.map((v) => (v.id === id ? { ...v, ...patch } : v)),
      }));
    },
    [updateData]
  );

  const deleteVideo = useCallback(
    (id: string) => {
      updateData((prev) => ({
        ...prev,
        videos: prev.videos.filter((v) => v.id !== id),
        exercises: prev.exercises.map((e) => ({
          ...e,
          videoIds: e.videoIds.filter((vid) => vid !== id),
        })),
      }));
    },
    [updateData]
  );

  // ─── 設定 ─────────────────────────────────────────────────────
  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      updateData((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...patch },
      }));
    },
    [updateData]
  );

  // ─── タイマー操作 ─────────────────────────────────────────────
  const startTimer = useCallback(
    (exerciseId: string, exerciseName: string, restSeconds: number) => {
      const now = new Date();
      const timer: TimerState = {
        startedAt: now.toISOString(),
        endsAt: new Date(now.getTime() + restSeconds * 1000).toISOString(),
        exerciseId,
        exerciseName,
        restSeconds,
        status: "running",
      };
      updateData((prev) => ({ ...prev, timer }));
    },
    [updateData]
  );

  const pauseTimer = useCallback(() => {
    setData((prev) => {
      if (!prev.timer || prev.timer.status !== "running") return prev;
      const remaining = Math.ceil(
        (new Date(prev.timer.endsAt).getTime() - Date.now()) / 1000
      );
      const next = {
        ...prev,
        timer: {
          ...prev.timer,
          status: "paused" as const,
          remainingAtPause: Math.max(0, remaining),
        },
      };
      saveStorage(next);
      return next;
    });
  }, []);

  const resumeTimer = useCallback(() => {
    setData((prev) => {
      if (!prev.timer || prev.timer.status !== "paused") return prev;
      const remaining = prev.timer.remainingAtPause ?? 0;
      const next = {
        ...prev,
        timer: {
          ...prev.timer,
          status: "running" as const,
          endsAt: new Date(Date.now() + remaining * 1000).toISOString(),
          remainingAtPause: undefined,
        },
      };
      saveStorage(next);
      return next;
    });
  }, []);

  const adjustTimer = useCallback((delta: number) => {
    setData((prev) => {
      if (!prev.timer) return prev;
      const timer = prev.timer;
      const newRestSeconds = Math.max(10, timer.restSeconds + delta);

      let updatedTimer: TimerState;
      if (timer.status === "paused") {
        updatedTimer = {
          ...timer,
          restSeconds: newRestSeconds,
          remainingAtPause: Math.max(0, (timer.remainingAtPause ?? 0) + delta),
        };
      } else {
        updatedTimer = {
          ...timer,
          restSeconds: newRestSeconds,
          endsAt: new Date(new Date(timer.endsAt).getTime() + delta * 1000).toISOString(),
          status: "running" as const,
        };
      }

      const next = { ...prev, timer: updatedTimer };
      saveStorage(next);
      return next;
    });
  }, []);

  // タイマーを完全に消す（バーを画面から消す）
  const clearTimer = useCallback(() => {
    updateData((prev) => (prev.timer ? { ...prev, timer: null } : prev));
  }, [updateData]);

  // 「この時間に固定」: 調整済みの restSeconds を種目に保存
  const saveTimerRestSeconds = useCallback(
    (exerciseId: string, restSeconds: number) => {
      updateData((prev) => ({
        ...prev,
        exercises: prev.exercises.map((e) =>
          e.id === exerciseId ? { ...e, restSeconds } : e
        ),
      }));
    },
    [updateData]
  );

  const value: AppContextValue = {
    data,
    timerDisplay,
    addExercise,
    updateExercise,
    deleteExercise,
    addMenu,
    updateMenu,
    deleteMenu,
    startSession,
    endSession,
    addSet,
    updateSet,
    updateExerciseNote,
    getLastSetsForExercise,
    getSession,
    addVideo,
    updateVideo,
    deleteVideo,
    updateSettings,
    startTimer,
    pauseTimer,
    resumeTimer,
    adjustTimer,
    clearTimer,
    saveTimerRestSeconds,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export { DEFAULT_REST_SECONDS };
