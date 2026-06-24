import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/contexts/AppContext";
import BottomNav from "@/components/ui/BottomNav";
import RestTimer from "@/components/timer/RestTimer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "筋トレ記録",
  description: "シンプルな筋トレ記録アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "筋トレ記録",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  width: "device-width",
  initialScale: 1,
  // userScalable: false を削除（アクセシビリティ対応）
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={inter.variable}>
      <body
        className="min-h-screen antialiased"
        style={{ background: "#0A0A0F", color: "#F0F0FF" }}
      >
        <AppProvider>
          {/* タイマー表示中のボトムナビ・タイマーを考慮した余白 */}
          <main className="pb-44">{children}</main>
          {/* タイマーはグローバル配置（全ページで表示） */}
          <RestTimer />
          {/* ボトムナビはワークアウト中も表示（タイマーの上） */}
          <BottomNav />
        </AppProvider>
      </body>
    </html>
  );
}
