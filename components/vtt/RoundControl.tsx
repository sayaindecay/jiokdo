"use client";

import { useEffect, useState } from "react";

const STORAGE_PREFIX = "jiokdo-round-";

export function RoundControl({ storageKey = "default" }: { storageKey?: string }) {
  const key = STORAGE_PREFIX + storageKey;
  const [round, setRound] = useState<number>(1);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const stored = Number(localStorage.getItem(key));
    if (Number.isFinite(stored) && stored > 0) setRound(stored);
  }, [key]);

  const update = (next: number) => {
    const clamped = Math.max(1, Math.min(99, next));
    setRound(clamped);
    try { localStorage.setItem(key, String(clamped)); } catch {/* noop */}
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  };

  return (
    <span className="round-control" role="group" aria-label="라운드 조절">
      <button
        type="button"
        className="rc-btn"
        onClick={() => update(round - 1)}
        disabled={round <= 1}
        aria-label="이전 라운드"
      >
        −
      </button>
      <span className={`rc-val${flash ? " flash" : ""}`}>라운드 {round}</span>
      <button
        type="button"
        className="rc-btn"
        onClick={() => update(round + 1)}
        aria-label="다음 라운드"
      >
        +
      </button>
    </span>
  );
}
