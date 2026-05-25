"use client";

import { useEffect, useRef, useState } from "react";

export type PeekItem = {
  who: string;
  text: string;
  isDice: boolean;
  level?: string | null;
  level_label?: string | null;
};

const DEMO_ITEMS: PeekItem[] = [
  { who: "키퍼", text: "안개 너머 부두의 가로등이 깜빡인다. 멀리서 무언가 끌리는 소리가 들린다.", isDice: false },
  { who: "이도윤", text: "1d100 ≤ 70 → 12", isDice: true, level: "extreme", level_label: "극단적 성공" },
  { who: "키퍼", text: "물보다 조금 무거운 것이 천천히, 분명하게, 부두의 나무 바닥을 긁고 있다.", isDice: false },
  { who: "이도윤", text: "1d100 ≤ 55 → 81", isDice: true, level: "fail", level_label: "실패" },
];

export function PeekWindow({
  items,
  isDemo,
  campaignTitle,
}: {
  items: PeekItem[];
  isDemo: boolean;
  campaignTitle: string;
}) {
  const list = items.length > 0 ? items : DEMO_ITEMS;
  const feedRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<PeekItem[]>([]);
  const stepRef = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const step = stepRef.current % list.length;
      const item = list[step];
      setVisible((prev) => [...prev, item].slice(-5));
      stepRef.current += 1;
      timer = setTimeout(tick, item.isDice ? 1500 : 2400);
    };

    timer = setTimeout(tick, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [list]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [visible]);

  return (
    <div className={`peek-window${isDemo ? " is-demo" : " is-live"}`} id="peek-window">
      {isDemo ? (
        <div className="peek-watermark" aria-hidden="true">예시 흐름</div>
      ) : null}
      <div className="titlebar">
        <span className="dots"><i></i><i></i><i></i></span>
        <span>{campaignTitle}</span>
        <span className={`tag${isDemo ? " demo" : " live"}`}>
          {isDemo ? "DEMO" : "● LIVE"}
        </span>
      </div>
      <div className="peek-feed" id="peek-feed" ref={feedRef}>
        {visible.map((item, i) => {
          if (!item.isDice) {
            return (
              <div key={i} className="narration">
                <span className="who">{item.who}</span>
                {item.text}
              </div>
            );
          }
          return (
            <div
              key={i}
              className={`dice-block${item.level ? " cc" : ""}`}
              style={{
                background: "rgba(245,243,238,0.08)",
                borderColor: "rgba(245,243,238,0.16)",
                color: "var(--bg-elev)",
              }}
            >
              <span className="label" style={{ color: "rgba(245,243,238,0.55)" }}>
                {item.who}
              </span>
              <span
                className="expr"
                style={{
                  background: "rgba(245,243,238,0.12)",
                  color: "var(--bg-elev)",
                  borderColor: "rgba(245,243,238,0.20)",
                }}
              >
                {item.text}
              </span>
              {item.level && item.level_label ? (
                <span className={`level ${item.level}`}>{item.level_label}</span>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="peek-input">
        <span className="caret">›</span>
        <span style={{ opacity: 0.6 }}>
          {isDemo ? "본문 한 줄로 /cc 도서관 60 같은 굴림을 끼워 넣을 수 있습니다." : "(라이브 피드)"}
        </span>
        <span className="cursor"></span>
      </div>
    </div>
  );
}
