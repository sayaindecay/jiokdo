"use client";

import { useMemo, useState } from "react";

export type InitiativeRow = {
  id: string;
  dex: number;
  name: string;
  is_pc: boolean;
  hp: number;
  hp_max: number;
  dead?: boolean;
};

export function InitiativeTracker({
  initial,
  onSelect,
  activeStatblockId,
}: {
  initial: InitiativeRow[];
  onSelect?: (row: InitiativeRow) => void;
  activeStatblockId?: string;
}) {
  const [rows, setRows] = useState<InitiativeRow[]>(() =>
    [...initial].sort((a, b) => b.dex - a.dex)
  );
  const [round, setRound] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);

  const live = useMemo(() => rows.map((r, i) => ({ r, i })).filter((x) => !x.r.dead), [rows]);

  const advance = () => {
    if (live.length === 0) return;
    const currentLive = live.findIndex((x) => x.i === activeIndex);
    // active 가 dead 상태(currentLive === -1)면 가장 첫 살아 있는 row 로 보냄
    if (currentLive < 0) {
      setActiveIndex(live[0].i);
      return;
    }
    const next = (currentLive + 1) % live.length;
    if (next === 0) setRound((r) => r + 1);
    setActiveIndex(live[next].i);
  };

  const reset = () => {
    setRound(1);
    setActiveIndex(live[0]?.i ?? 0);
    setRows((prev) => prev.map((r) => ({ ...r, dead: false, hp: r.hp_max })));
  };

  const damage = (rowId: string, amount: number) => {
    setRows((prev) => {
      const next = prev.map((r) => {
        if (r.id !== rowId) return r;
        const hp = Math.max(0, r.hp - amount);
        return { ...r, hp, dead: hp === 0 ? true : r.dead };
      });
      // 활성 row가 방금 죽었다면 다음 살아 있는 인덱스로 이동
      const killedIndex = next.findIndex((r) => r.id === rowId);
      if (killedIndex === activeIndex && next[killedIndex]?.dead) {
        const liveAfter = next
          .map((r, i) => ({ r, i }))
          .filter((x) => !x.r.dead);
        const nextLive = liveAfter.find((x) => x.i > killedIndex) ?? liveAfter[0];
        if (nextLive) {
          setActiveIndex(nextLive.i);
          if (nextLive.i <= killedIndex && liveAfter.length > 0) {
            setRound((r) => r + 1);
          }
        }
      }
      return next;
    });
  };

  return (
    <div className="initiative">
      <div className="ini-head">
        <span>이니셔티브 (DEX 순)</span>
        <span>라운드 <span className="round">{round}</span></span>
      </div>
      {rows.map((r, i) => {
        const isActive = i === activeIndex && !r.dead;
        const isSelected = activeStatblockId === r.id;
        return (
          <button
            type="button"
            key={r.id}
            onClick={() => onSelect?.(r)}
            className={`ini-row${isActive ? " active" : ""}${r.dead ? " dead" : ""}`}
            style={{
              width: "100%",
              textAlign: "left",
              cursor: onSelect ? "pointer" : "default",
              border: "none",
              outline: isSelected ? "1.5px dashed var(--accent)" : undefined,
              fontFamily: "inherit",
            }}
          >
            <span className="dex">{r.dex}</span>
            <span className="name">
              {r.name}
              {isActive ? " ← 지금" : null}
              {r.is_pc ? <span className="muted" style={{ fontSize: "0.74rem" }}> PC</span> : null}
              {r.dead ? <span className="muted" style={{ fontSize: "0.74rem" }}> 사망</span> : null}
            </span>
            <span className="hp">
              <button
                type="button"
                className="link-btn"
                onClick={(e) => { e.stopPropagation(); damage(r.id, 1); }}
                style={{ marginRight: 4, fontFamily: "var(--font-mono)" }}
                aria-label={`${r.name} HP 1 감소`}
              >−</button>
              {r.hp}/{r.hp_max}
            </span>
          </button>
        );
      })}
      <div
        style={{
          display: "flex", gap: "0.5rem",
          marginTop: "0.7rem",
          flexWrap: "wrap",
        }}
      >
        <button className="btn ghost" type="button" onClick={reset}>↺ 라운드 초기화</button>
        <button className="btn" type="button" onClick={advance}>다음 라운드 →</button>
      </div>
    </div>
  );
}
