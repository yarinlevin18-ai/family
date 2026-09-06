const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv|ogg)(\?.*)?$/i;

export function isVideoUrl(url: string) {
  return VIDEO_EXT.test(url);
}

export function mediaTypeOf(file: File): "image" | "video" {
  return file.type.startsWith("video/") ? "video" : "image";
}

const relative = new Intl.RelativeTimeFormat("he", { numeric: "auto" });
const absolute = new Intl.DateTimeFormat("he-IL", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatWhen(iso: string, now = Date.now()) {
  const diff = (new Date(iso).getTime() - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return "ממש עכשיו";
  if (abs < 3600) return relative.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return relative.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 7) return relative.format(Math.round(diff / 86400), "day");
  return absolute.format(new Date(iso));
}

export function formatFullDate(iso: string) {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const PALETTE = [
  "from-rose-500 to-orange-400",
  "from-amber-400 to-yellow-300",
  "from-emerald-500 to-teal-400",
  "from-sky-500 to-cyan-400",
  "from-violet-500 to-fuchsia-400",
  "from-pink-500 to-rose-400",
  "from-indigo-500 to-sky-400",
  "from-lime-500 to-emerald-400",
];

export function avatarGradient(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[1][0];
}

export function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
