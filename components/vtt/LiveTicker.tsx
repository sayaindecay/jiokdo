"use client";

import { useEffect, useState } from "react";

type Row = { who: string; cmd: string; level: string; label: string; when: string };

const POOL: Row[] = [
  { who: "이도윤", cmd: "/cc 청각 70", level: "extreme", label: "극단", when: "방금" },
  { who: "박재이", cmd: "/cc 권총 55", level: "fail", label: "실패", when: "방금" },
  { who: "키퍼 박", cmd: "/roll 1d100", level: "regular", label: "57", when: "1분" },
  { who: "최서연", cmd: "/cc 도서관 85", level: "hard", label: "어려운", when: "1분" },
  { who: "강하늘", cmd: "/cc 의학 40", level: "critical", label: "결정적", when: "2분" },
  { who: "키퍼 김", cmd: "/cc 은밀 60", level: "fumble", label: "펌블", when: "3분" },
  { who: "이도윤", cmd: "/roll 3d6", level: "regular", label: "11", when: "4분" },
];

export function LiveTicker() {
  const [rows, setRows] = useState<Row[]>(POOL.slice(0, 5));
  const [count, setCount] = useState(847);

  useEffect(() => {
    let i = 5;
    const id = setInterval(() => {
      const next = POOL[i % POOL.length];
      i += 1;
      setRows((prev) => [next, ...prev].slice(0, 5));
      setCount((c) => c + 1);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="live-ticker">
      <div className="head">
        <span className="dot"></span>
        지금 굴려지는 다이스
        <span className="count">{count.toLocaleString()}개 · 오늘</span>
      </div>
      <div className="feed">
        {rows.map((r, i) => (
          <div className="row" key={`${r.who}-${i}-${r.cmd}`}>
            <span className="who">{r.who}</span>
            <span className="body"><code>{r.cmd}</code> → <span className={`level ${r.level}`}>{r.label}</span></span>
            <span className="when">{r.when}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
