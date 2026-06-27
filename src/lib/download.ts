// テキストをファイルとしてダウンロードさせる（クライアントでのみ呼ぶこと）。
// iOS Safari / ホーム画面PWA では download 属性が効かず別タブで開く場合があり、
// その際は「共有 → ファイルに保存」になる（許容仕様）。
export function downloadTextFile(filename: string, text: string, mime = "application/json") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // メモリリーク防止のため後始末
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// "workout-backup-YYYYMMDD" 形式の日付文字列
export function backupDateStamp(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
