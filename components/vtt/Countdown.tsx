"use client";

import { useEffect, useState } from "react";

function diff(target: number): { d: number; h: number; m: number; past: boolean } {
  const now = Date.now();
  const delta = target - now;
  if (delta <= 0) return { d: 0, h: 0, m: 0, past: true };
  const totalMin = Math.floor(delta / 60000);
  const d = Math.floor(totalMin / (60 * 24));
  const h = Math.floor((totalMin - d * 60 * 24) / 60);
  const m = totalMin - d * 60 * 24 - h * 60;
  return { d, h, m, past: false };
}

export function Countdown({ targetMs }: { targetMs: number }) {
  const [now, setNow] = useState(() => diff(targetMs));
  useEffect(() => {
    const id = setInterval(() => setNow(diff(targetMs)), 30 * 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (now.past) {
    return (
      <div className="countdown">
        <em>지금</em> 시작
      </div>
    );
  }

  if (now.d > 0) {
    return (
      <div className="countdown">
        <em>{now.d}</em> 일 <em>{now.h}</em> 시간
      </div>
    );
  }
  return (
    <div className="countdown">
      <em>{now.h}</em> 시간 <em>{now.m}</em> 분
    </div>
  );
}
