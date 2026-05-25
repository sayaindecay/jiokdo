"use client";

import { useEffect, useState } from "react";
import { formatTime } from "@/lib/format";

type Row = {
  id: number;
  who: string;
  expression: string;
  level: string | null;
  level_label: string | null;
  total: number;
  created_at: number;
};

type ApiItem = {
  id: number;
  nickname: string;
  character_name: string | null;
  expression: string;
  level: string | null;
  level_label: string | null;
  total: number;
  created_at: number;
};

export function LiveTicker({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);

  useEffect(() => {
    let cancelled = false;
    const fetchOnce = async () => {
      try {
        const res = await fetch("/api/recent-dice?limit=5", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { items: ApiItem[] };
        const mapped: Row[] = data.items.map((it) => ({
          id: it.id,
          who: it.character_name || it.nickname,
          expression: it.expression,
          level: it.level,
          level_label: it.level_label,
          total: it.total,
          created_at: it.created_at,
        }));
        if (!cancelled) setRows(mapped);
      } catch {
        // 폴링 실패는 조용히 무시
      }
    };
    const id = setInterval(fetchOnce, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="live-ticker">
      <div className="head">
        <span className="dot"></span>
        지금 굴려지는 다이스
        <span className="count">
          {rows.length > 0 ? `${rows.length}개 · 8초마다 갱신` : "아직 굴림 없음"}
        </span>
      </div>
      <div className="feed">
        {rows.length === 0 ? (
          <div className="row" style={{ fontFamily: "var(--font-anno)", color: "var(--ink-3)", justifyContent: "center" }}>
            첫 굴림을 기다리고 있습니다 — 캠페인을 만들고 본문에 <code style={{ marginLeft: 4 }}>/cc 도서관 60</code> 를 적어 보세요.
          </div>
        ) : (
          rows.map((r) => (
            <div className="row" key={r.id}>
              <span className="who">{r.who}</span>
              <span className="body">
                <code>{r.expression}</code> →{" "}
                {r.level ? (
                  <span className={`level ${r.level}`}>{r.level_label}</span>
                ) : (
                  <b>{r.total}</b>
                )}
              </span>
              <span className="when">{formatTime(r.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
