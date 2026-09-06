"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Dropzone } from "@/components/dropzone";
import { burstConfetti } from "@/components/confetti";
import { Check, Alert, Spinner, Trash, Upload, Grid, Video } from "@/components/icons";
import { useToast } from "@/components/toast";
import { formatBytes, mediaTypeOf } from "@/lib/format";
import { NetworkError, loadSavedName, saveName, uploadPhoto } from "@/lib/photos";

type Item = {
  id: string;
  file: File;
  preview: string;
  caption: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

const CONCURRENCY = 2;

export default function UploadPage() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  // Keep the screen on and warn before leaving while an upload batch is running.
  useEffect(() => {
    if (!busy) return;
    const onLeave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);

    let released = false;
    const acquire = async () => {
      try {
        if ("wakeLock" in navigator && document.visibilityState === "visible") {
          wakeLock.current = await navigator.wakeLock.request("screen");
        }
      } catch {
        /* not supported or denied */
      }
    };
    const onVisible = () => {
      if (!released && document.visibilityState === "visible") void acquire();
    };
    void acquire();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      released = true;
      window.removeEventListener("beforeunload", onLeave);
      document.removeEventListener("visibilitychange", onVisible);
      wakeLock.current?.release().catch(() => {});
      wakeLock.current = null;
    };
  }, [busy]);

  useEffect(() => {
    // Read after hydration so server and client render the same initial markup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(loadSavedName());
  }, []);

  useEffect(() => {
    return () => items.forEach((i) => URL.revokeObjectURL(i.preview));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pending = useMemo(() => items.filter((i) => i.status !== "done"), [items]);
  const failed = useMemo(() => items.filter((i) => i.status === "error").length, [items]);
  const done = items.length - pending.length;
  const canSubmit = name.trim().length > 0 && pending.length > 0 && !busy;

  function addFiles(files: File[]) {
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        caption: "",
        status: "pending" as const,
      })),
    ]);
  }

  function remove(id: string) {
    setItems((prev) => {
      const it = prev.find((i) => i.id === id);
      if (it) URL.revokeObjectURL(it.preview);
      return prev.filter((i) => i.id !== id);
    });
  }

  function patch(id: string, p: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)));
  }

  async function submit() {
    const uploader = name.trim();
    if (!uploader) return;
    saveName(uploader);
    setBusy(true);

    const queue = items.filter((i) => i.status === "pending" || i.status === "error");
    let ok = 0;
    let failed = 0;

    async function worker() {
      while (queue.length) {
        const it = queue.shift()!;
        patch(it.id, { status: "uploading", error: undefined });
        try {
          await uploadPhoto(it.file, uploader, it.caption);
          patch(it.id, { status: "done" });
          ok++;
        } catch (e) {
          const message =
            e instanceof NetworkError
              ? "החיבור נותק, לחצו שוב כדי להמשיך"
              : (e as Error).message;
          patch(it.id, { status: "error", error: message });
          failed++;
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    setBusy(false);
    if (ok > 0 && failed === 0) {
      burstConfetti();
      toast("success", ok === 1 ? "הועלה בהצלחה! 🎉" : `${ok} קבצים הועלו בהצלחה! 🎉`);
    } else if (ok > 0) {
      toast("info", `${ok} הועלו, ${failed} נכשלו. לחצו שוב כדי להשלים.`);
    } else if (failed > 0) {
      toast("error", "ההעלאה נכשלה. בדקו את החיבור ולחצו שוב.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 animate-fade-up text-center">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          שתפו <span className="text-gradient">רגע</span>
        </h1>
        <p className="mt-2 text-mist-2">
          תמונות וסרטונים מהטיול. הכול נשמר ומופיע מיד אצל כולם.
        </p>
      </header>

      <section className="glass animate-fade-up rounded-3xl p-5 sm:p-7" style={{ animationDelay: "80ms" }}>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-mist-2">מי מעלה?</span>
          <input
            type="text"
            className="input text-lg"
            placeholder="למשל: דנה"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>

        <div className="mt-5">
          <Dropzone onFiles={addFiles} disabled={busy} />
        </div>

        {items.length > 0 && (
          <ul className="mt-5 space-y-3">
            {items.map((it, i) => (
              <li
                key={it.id}
                className="animate-pop flex items-center gap-3 rounded-2xl bg-white/[0.04] p-2.5 ring-1 ring-white/8"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-3">
                  {mediaTypeOf(it.file) === "video" ? (
                    <span className="grid h-full w-full place-items-center text-mist-3">
                      <Video />
                    </span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.preview} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  )}
                  {it.status === "uploading" && (
                    <span className="absolute inset-0 grid place-items-center bg-black/50">
                      <Spinner className="text-glow" />
                    </span>
                  )}
                  {it.status === "done" && (
                    <span className="absolute inset-0 grid place-items-center bg-emerald-500/70 text-ink">
                      <Check width={26} height={26} strokeWidth={3} />
                    </span>
                  )}
                  {it.status === "error" && (
                    <span className="absolute inset-0 grid place-items-center bg-rose-500/70 text-white">
                      <Alert />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    type="text"
                    className="input py-2 text-sm"
                    placeholder="כיתוב (לא חובה)"
                    value={it.caption}
                    maxLength={140}
                    disabled={it.status === "done" || it.status === "uploading"}
                    onChange={(e) => patch(it.id, { caption: e.target.value })}
                  />
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-mist-3">
                    <span className="truncate">{it.file.name}</span>
                    <span>·</span>
                    <span>{formatBytes(it.file.size)}</span>
                    {it.error && <span className="text-rose-300">· {it.error}</span>}
                  </div>
                </div>
                {it.status !== "uploading" && it.status !== "done" && (
                  <button
                    type="button"
                    className="icon-btn h-9 w-9 shrink-0 text-mist-3 hover:text-rose-300"
                    onClick={() => remove(it.id)}
                    aria-label="הסרה"
                  >
                    <Trash width={16} height={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-mist-3">
            {items.length === 0
              ? "עדיין לא נבחרו קבצים"
              : busy
                ? `מעלה… ${done}/${items.length}`
                : done === items.length
                  ? "הכול הועלה ✨"
                  : failed > 0
                    ? `${done} הועלו · ${failed} נכשלו`
                    : `${pending.length} ממתינים להעלאה`}
          </div>
          <div className="flex gap-2">
            {done > 0 && !busy && (
              <Link href="/gallery" className="btn-ghost">
                <Grid width={16} height={16} />
                לגלריה
              </Link>
            )}
            <button type="button" className="btn-primary" disabled={!canSubmit} onClick={submit}>
              {busy ? <Spinner /> : <Upload width={18} height={18} />}
              {busy
                ? "מעלה…"
                : failed > 0 && failed === pending.length
                  ? `נסו שוב (${failed})`
                  : pending.length > 1
                    ? `העלאת ${pending.length} קבצים`
                    : "העלאה"}
            </button>
          </div>
        </div>

        {busy && (
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-l from-glow to-ember transition-all duration-500"
              style={{ width: `${Math.max(6, (done / Math.max(items.length, 1)) * 100)}%` }}
            />
          </div>
        )}
      </section>

      <p className="mt-5 text-center text-xs text-mist-3">
        טיפ: השאירו את המסך דלוק עד שההעלאה מסתיימת. אם החיבור נופל, האפליקציה ממתינה ומנסה שוב לבד.
      </p>
    </div>
  );
}
