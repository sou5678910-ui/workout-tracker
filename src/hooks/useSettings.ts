"use client";
import { useAppContext } from "@/contexts/AppContext";

export function useSettings() {
  const { data, updateSettings } = useAppContext();
  return { settings: data.settings, updateSettings };
}
