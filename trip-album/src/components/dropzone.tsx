"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImageIcon, Upload, Video } from "./icons";

export function Dropzone({
  onFiles,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function accept(list: FileList | null) {
    if (!list) return;
    const files = Array.from(list).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (files.length) onFiles(files);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    if (disabled) return;
    accept(e.dataTransfer.files);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={`group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300 sm:p-12 ${
        over
          ? "scale-[1.01] border-glow bg-glow/10 shadow-2xl shadow-glow/20"
          : "border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]"
      } ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          accept(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="pointer-events-none absolute -inset-20 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(30rem_16rem_at_50%_0%,rgba(255,181,71,0.12),transparent_70%)]" />
      </div>
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative">
          <span className="absolute -start-8 top-2 rotate-[-12deg] rounded-xl bg-ink-3 p-2.5 text-mist-3 shadow-lg ring-1 ring-white/10 transition group-hover:-translate-x-2 group-hover:-translate-y-1">
            <ImageIcon />
          </span>
          <span className="absolute -end-8 top-2 rotate-[12deg] rounded-xl bg-ink-3 p-2.5 text-mist-3 shadow-lg ring-1 ring-white/10 transition group-hover:translate-x-2 group-hover:-translate-y-1">
            <Video />
          </span>
          <span
            className={`grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-glow to-ember text-ink shadow-xl shadow-glow/30 transition-transform duration-300 ${
              over ? "scale-110 rotate-3" : "group-hover:scale-105"
            }`}
          >
            <Upload width={34} height={34} />
          </span>
        </div>
        <div>
          <p className="text-xl font-extrabold">
            {over ? "שחררו כאן!" : "גררו לכאן תמונות וסרטונים"}
          </p>
          <p className="mt-1 text-sm text-mist-3">
            או לחצו לבחירה מהמכשיר · אפשר כמה קבצים בבת אחת
          </p>
        </div>
      </div>
    </div>
  );
}
