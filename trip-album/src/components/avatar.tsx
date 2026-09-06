import { avatarGradient, initials } from "@/lib/format";

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "sm" ? "h-7 w-7 text-[11px]" : size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-xs";
  return (
    <span
      title={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-extrabold text-ink shadow-lg ring-2 ring-black/30 ${dims} ${avatarGradient(name)}`}
    >
      {initials(name)}
    </span>
  );
}
