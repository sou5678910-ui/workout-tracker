"use client";
import { ExternalLink, Video } from "lucide-react";
import type { YoutubeVideo } from "@/types";

interface VideoLinkProps {
  video: YoutubeVideo;
}

export default function VideoLink({ video }: VideoLinkProps) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 rounded-xl"
      style={{ background: "#1C1C27", border: "1px solid #2A2A3D" }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "#EF444422" }}
      >
        <Video size={18} color="#EF4444" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "#F0F0FF" }}>
          {video.title || "動画"}
        </p>
        {video.note && (
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#8888AA" }}>
            {video.note}
          </p>
        )}
      </div>
      <ExternalLink size={14} style={{ color: "#8888AA", flexShrink: 0, marginTop: 2 }} />
    </a>
  );
}
