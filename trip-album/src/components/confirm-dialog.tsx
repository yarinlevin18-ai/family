"use client";

import { useEffect } from "react";
import { Alert, Spinner } from "./icons";

export function ConfirmDialog({
  title,
  text,
  confirmLabel,
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  text?: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-[95] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={() => !busy && onCancel()}
    >
      <div
        className="glass animate-pop w-full max-w-sm rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/15 text-rose-300">
          <Alert width={24} height={24} />
        </div>
        <h2 id="confirm-title" className="text-xl font-extrabold">
          {title}
        </h2>
        {text && <p className="mt-1 text-sm leading-relaxed text-mist-2">{text}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
            ביטול
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-3 font-bold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-400 disabled:opacity-60"
          >
            {busy ? <Spinner width={18} height={18} /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
