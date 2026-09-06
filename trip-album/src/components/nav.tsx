"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid, Play, Upload } from "./icons";

const LINKS = [
  { href: "/gallery", label: "הגלריה", icon: Grid },
  { href: "/slideshow", label: "מצגת", icon: Play },
  { href: "/upload", label: "העלאה", icon: Upload },
] as const;

export function Nav() {
  const path = usePathname();
  if (path === "/slideshow") return null;

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <nav className="glass mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-3 py-2 sm:px-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-glow to-ember shadow-lg shadow-glow/30">
            <span className="absolute inset-0 animate-spin-slow bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.45),transparent_40%)]" />
            <span className="relative text-lg">📸</span>
          </span>
          <span className="text-lg font-black tracking-tight">
            האלבום <span className="text-gradient">שלנו</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-white/12 text-white"
                    : "text-mist-2 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon width={16} height={16} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
