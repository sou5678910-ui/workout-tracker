"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Play, TrendingUp, Video, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/exercises", label: "種目", icon: Dumbbell },
  { href: "/menus", label: "メニュー", icon: Play },
  { href: "/stats", label: "記録", icon: TrendingUp },
  { href: "/videos", label: "動画", icon: Video },
  { href: "/settings", label: "設定", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  // ワークアウト中はボトムナビを非表示（タイマーが占有するため）
  if (pathname.startsWith("/workout/")) return null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t"
      style={{
        background: "rgba(19,19,26,0.95)",
        backdropFilter: "blur(12px)",
        borderColor: "#2A2A3D",
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 min-w-[48px] py-1 transition-colors"
              style={{ color: active ? "#6C63FF" : "#8888AA" }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
