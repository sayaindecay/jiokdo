"use client";

import { useEffect, useRef, useState } from "react";

type FeedItem =
  | { type: "narration"; who: string; text: string }
  | { type: "command"; text: string }
  | { type: "dice"; expr: string; total: number; level: string; label: string };

const SCRIPT: FeedItem[] = [
  { type: "narration", who: "키퍼", text: "안개 너머 부두의 가로등이 깜빡인다. 멀리서 무언가 끌리는 소리가 들린다. 행동을 정하세요." },
  { type: "command", text: "/cc 청각 70" },
  { type: "dice", expr: "1d100 ≤ 70", total: 12, level: "extreme", label: "극단적 성공" },
  { type: "narration", who: "키퍼", text: "물보다 조금 무거운 것이 천천히, 그러나 분명하게, 부두의 나무 바닥을 긁고 있다 — 발소리가 아니다." },
  { type: "command", text: "/cc 권총 55" },
  { type: "dice", expr: "1d100 ≤ 55", total: 81, level: "fail", label: "실패" },
  { type: "narration", who: "이도윤", text: "방아쇠를 당겼지만 손이 떨려 빗나갔다. 옆 기둥에서 나무 가루가 튄다." },
];

const LEVEL_KO = SCRIPT;

export function PeekWindow() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [typing, setTyping] = useState("");
  const feedRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const step = stepRef.current % SCRIPT.length;
      const item = SCRIPT[step];

      if (item.type === "command") {
        let i = 0;
        setTyping("");
        const typeChar = () => {
          if (cancelled) return;
          if (i <= item.text.length) {
            setTyping(item.text.slice(0, i));
            i += 1;
            timer = setTimeout(typeChar, 60 + Math.random() * 40);
          } else {
            timer = setTimeout(() => {
              if (cancelled) return;
              setTyping("");
              setFeed((f) => [...f, item].slice(-6));
              stepRef.current += 1;
              tick();
            }, 600);
          }
        };
        typeChar();
      } else {
        setFeed((f) => [...f, item].slice(-6));
        stepRef.current += 1;
        const delay = item.type === "dice" ? 1100 : 2200;
        timer = setTimeout(tick, delay);
      }
    };

    timer = setTimeout(tick, 700);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [feed, typing]);

  return (
    <div className="peek-window" id="peek-window">
      <div className="titlebar">
        <span className="dots"><i></i><i></i><i></i></span>
        <span>jiokdo.app / 검은 4월 / §3 부두</span>
        <span className="tag">● LIVE</span>
      </div>
      <div className="peek-feed" id="peek-feed" ref={feedRef}>
        {feed.map((item, i) => {
          if (item.type === "narration") {
            return (
              <div key={i} className="narration">
                <span className="who">{item.who}</span>
                {item.text}
              </div>
            );
          }
          if (item.type === "command") {
            return (
              <div key={i} className="dice-block" style={{ background: "transparent", borderColor: "rgba(245,243,238,0.18)", color: "var(--bg-elev)" }}>
                <span className="label" style={{ color: "rgba(245,243,238,0.55)" }}>입력</span>
                <span className="expr" style={{ background: "rgba(245,243,238,0.10)", color: "var(--bg-elev)", borderColor: "rgba(245,243,238,0.20)" }}>{item.text}</span>
              </div>
            );
          }
          return (
            <div key={i} className="dice-block cc" style={{ background: "rgba(245,243,238,0.08)", borderColor: "rgba(245,243,238,0.16)", color: "var(--bg-elev)" }}>
              <span className="label" style={{ color: "rgba(245,243,238,0.55)" }}>1d100</span>
              <span className="expr" style={{ background: "rgba(245,243,238,0.12)", color: "var(--bg-elev)", borderColor: "rgba(245,243,238,0.20)" }}>{item.expr}</span>
              <span className="total" style={{ color: "var(--bg-elev)" }}>→ {item.total}</span>
              <span className={`level ${item.level}`}>{item.label}</span>
            </div>
          );
        })}
      </div>
      <div className="peek-input">
        <span className="caret">›</span>
        <span id="peek-typing">{typing}</span>
        <span className="cursor"></span>
      </div>
    </div>
  );
}

void LEVEL_KO;
