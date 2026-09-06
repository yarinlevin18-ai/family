"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Alert, Check, Sparkles } from "./icons";

type Kind = "success" | "error" | "info";
type Toast = { id: number; kind: Kind; text: string };

const ToastCtx = createContext<(kind: Kind, text: string) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

const ICONS: Record<Kind, ReactNode> = {
  success: <Check className="text-emerald-300" />,
  error: <Alert className="text-rose-300" />,
  info: <Sparkles className="text-glow" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: Kind, text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 left-1/2 z-[90] flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="glass animate-pop flex items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-2xl"
          >
            {ICONS[t.kind]}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
