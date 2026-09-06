"use client";

const COLORS = ["#ffd58a", "#ffb547", "#ff5c7a", "#34d399", "#60a5fa", "#c084fc", "#f5f1ea"];

export function burstConfetti(count = 90) {
  if (typeof document === "undefined") return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const dist = 140 + Math.random() * 380;
    el.className = "confetti-piece";
    el.style.background = COLORS[i % COLORS.length];
    el.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    el.style.setProperty("--dy", `${Math.sin(angle) * dist + 260}px`);
    el.style.setProperty("--rot", `${Math.random() * 900 - 450}deg`);
    el.style.setProperty("--dur", `${1.1 + Math.random() * 0.9}s`);
    el.style.width = `${6 + Math.random() * 8}px`;
    el.style.height = `${8 + Math.random() * 10}px`;
    frag.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
  document.body.appendChild(frag);
}
