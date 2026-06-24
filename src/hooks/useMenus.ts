"use client";
import { useAppContext } from "@/contexts/AppContext";

export function useMenus() {
  const { data, addMenu, updateMenu, deleteMenu } = useAppContext();
  return { menus: data.menus, addMenu, updateMenu, deleteMenu };
}
