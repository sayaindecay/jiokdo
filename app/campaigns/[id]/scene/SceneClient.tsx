"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BestiaryEntry } from "@/lib/types";
import { InitiativeTracker, type InitiativeRow } from "@/components/vtt/InitiativeTracker";
import { StatBlock } from "@/components/vtt/StatBlock";
import { ThreatStars } from "@/components/vtt/ThreatStars";

export type KeeperCharLite = {
  id: number;
  name: string;
  campaign_id: number;
  dex: number;
  hp: number;
  hp_max: number;
  occupation: string;
};

export function SceneClient({
  initialRows,
  focusedNpc,
  bestiary,
  keeperChars,
}: {
  initialRows: InitiativeRow[];
  focusedNpc: BestiaryEntry | null;
  bestiary: BestiaryEntry[];
  keeperChars: KeeperCharLite[];
}) {
  const [rows, setRows] = useState<InitiativeRow[]>(initialRows);
  const [round, setRound] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [roundFlash, setRoundFlash] = useState(false);
  const [focused, setFocused] = useState<BestiaryEntry | null>(focusedNpc);
  const [pickerSlug, setPickerSlug] = useState<string>(bestiary[0]?.slug ?? "");
  const [pickerCharId, setPickerCharId] = useState<string>(
    keeperChars[0] ? String(keeperChars[0].id) : "",
  );
  const [addedCharIds, setAddedCharIds] = useState<number[]>([]);

  const sorted = useMemo(() => [...rows].sort((a, b) => b.dex - a.dex), [rows]);

  const flash = () => {
    setRoundFlash(true);
    setTimeout(() => setRoundFlash(false), 700);
  };

  const advance = () => {
    const live = sorted.map((r, i) => ({ r, i })).filter((x) => !x.r.dead);
    if (live.length === 0) return;
    const cur = live.findIndex((x) => x.i === activeIndex);
    if (cur < 0) {
      setActiveIndex(live[0].i);
      return;
    }
    const next = (cur + 1) % live.length;
    if (next === 0) {
      setRound((r) => r + 1);
      flash();
    }
    setActiveIndex(live[next].i);
  };

  const reset = () => {
    setRound(1);
    flash();
    setActiveIndex(0);
    setRows((prev) => prev.map((r) => ({ ...r, dead: false, hp: r.hp_max })));
  };

  const damage = (rowId: string, amount: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const hp = Math.max(0, Math.min(r.hp_max, r.hp - amount));
        return { ...r, hp, dead: hp === 0 };
      })
    );
  };

  const remove = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    const m = rowId.match(/^char-(\d+)-/);
    if (m) {
      const cid = Number(m[1]);
      setAddedCharIds((prev) => prev.filter((id) => id !== cid));
    }
  };

  const addNpcFromSlug = (slug: string) => {
    const entry = bestiary.find((b) => b.slug === slug);
    if (!entry) return;
    const existing = rows.filter((r) => r.source_slug === entry.slug);
    const num = existing.length + 1;
    const hp = Number(entry.attrs.hp ?? 5);
    const dex = Number(entry.attrs.dex ?? 50);
    const newRow: InitiativeRow = {
      id: `npc-${entry.slug}-${Date.now()}-${num}`,
      dex,
      name: existing.length > 0 ? `${entry.name} #${num}` : entry.name,
      is_pc: false,
      hp,
      hp_max: hp,
      source_slug: entry.slug,
    };
    setRows((prev) => [...prev, newRow]);
    setFocused(entry);
  };

  const addNpcFromChar = (charId: number) => {
    const ch = keeperChars.find((c) => c.id === charId);
    if (!ch) return;
    const existing = rows.filter((r) => r.id.startsWith(`char-${ch.id}-`));
    const num = existing.length + 1;
    const newRow: InitiativeRow = {
      id: `char-${ch.id}-${Date.now()}-${num}`,
      dex: ch.dex,
      name: existing.length > 0 ? `${ch.name} #${num}` : ch.name,
      is_pc: false,
      hp: ch.hp,
      hp_max: ch.hp_max,
    };
    setRows((prev) => [...prev, newRow]);
    setAddedCharIds((prev) => (prev.includes(ch.id) ? prev : [...prev, ch.id]));
    setFocused(null);
  };

  const onSelect = (row: InitiativeRow) => {
    if (row.is_pc || !row.source_slug) return;
    const entry = bestiary.find((b) => b.slug === row.source_slug);
    if (entry) setFocused(entry);
  };

  // 키퍼 액션 chip — 현재 focused NPC 의 모든 인스턴스에 적용 (없으면 active row)
  const applyToFocused = (amount: number) => {
    if (focused) {
      const target = rows.find((r) => r.source_slug === focused.slug && !r.dead);
      if (target) damage(target.id, amount);
    } else if (sorted[activeIndex] && !sorted[activeIndex].dead) {
      damage(sorted[activeIndex].id, amount);
    }
  };

  const otherNpcs = bestiary.filter((b) => b.slug !== focused?.slug).slice(0, 4);
  const addedChars = keeperChars.filter((c) => addedCharIds.includes(c.id));

  return (
    <>
      <div className="scene-grid cinematic">
        <InitiativeTracker
          rows={sorted}
          round={round}
          activeIndex={activeIndex}
          roundFlash={roundFlash}
          onAdvance={advance}
          onReset={reset}
          onDamage={damage}
          onRemove={remove}
          onSelect={onSelect}
          activeStatblockId={
            focused?.slug ? rows.find((r) => r.source_slug === focused.slug)?.id : undefined
          }
        />

        <div>
          {/* NPC 추가 박스 */}
          <div className="npc-picker">
            <div className="picker-label">에너미에서 추가</div>
            <div className="picker-row">
              <select
                value={pickerSlug}
                onChange={(e) => setPickerSlug(e.target.value)}
                disabled={bestiary.length === 0}
              >
                {bestiary.length === 0 ? (
                  <option value="">에너미에 항목 없음</option>
                ) : (
                  bestiary.map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.name} (HP {b.attrs.hp ?? "?"})
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                className="btn"
                onClick={() => pickerSlug && addNpcFromSlug(pickerSlug)}
                disabled={!pickerSlug}
              >
                + 추가
              </button>
            </div>

            {keeperChars.length > 0 ? (
              <>
                <div className="picker-label" style={{ marginTop: "0.85rem" }}>
                  내 캐릭터 시트에서 추가
                </div>
                <div className="picker-row">
                  <select
                    value={pickerCharId}
                    onChange={(e) => setPickerCharId(e.target.value)}
                  >
                    {keeperChars.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name} (HP {c.hp_max}, DEX {c.dex})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => pickerCharId && addNpcFromChar(Number(pickerCharId))}
                    disabled={!pickerCharId}
                  >
                    + 추가
                  </button>
                </div>
              </>
            ) : null}
          </div>

          {focused ? (
            <>
              <StatBlock entry={focused} />
              <div className="keeper-actions">
                <span className="ka-label">
                  {focused.name} 에 액션 →
                </span>
                <button type="button" className="chip" onClick={() => applyToFocused(rolld(6))}>
                  -1d6 HP
                </button>
                <button type="button" className="chip" onClick={() => applyToFocused(rolld(4))}>
                  -1d4 HP
                </button>
                <button type="button" className="chip" onClick={() => applyToFocused(2)}>
                  -2 HP
                </button>
                <button type="button" className="chip" onClick={() => applyToFocused(-5)}>
                  +5 HP
                </button>
                <button
                  type="button"
                  className="chip accent"
                  onClick={() => addNpcFromSlug(focused.slug)}
                >
                  + NPC 복제
                </button>
              </div>
            </>
          ) : (
            <div
              className="statblock"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 240,
              }}
            >
              <p
                className="empty"
                style={{ background: "none", border: "none", padding: 0, textAlign: "center" }}
              >
                트래커에서 NPC를 선택하거나 위 picker로 추가하면 스탯블록이 표시됩니다.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="section-head">
        <h2>오늘 세션의 다른 NPC</h2>
        <span className="count">{otherNpcs.length + addedChars.length}개</span>
      </div>
      <div className="board-grid">
        {addedChars.map((c) => (
          <Link key={`char-${c.id}`} href={`/characters/${c.id}`} className="board-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
              <h2 style={{ margin: 0 }}>{c.name}</h2>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.08em",
                  color: "var(--accent)",
                  border: "1px solid var(--accent)",
                  padding: "0.05rem 0.4rem",
                  borderRadius: "999px",
                }}
              >
                내 캐릭터
              </span>
            </div>
            <p className="desc">{c.occupation || "직업 미기재"}</p>
            <div className="stats">
              <span>HP <b>{c.hp_max}</b></span>
              <span>DEX <b>{c.dex}</b></span>
            </div>
          </Link>
        ))}
        {otherNpcs.map((n) => (
          <Link key={n.slug} href={`/bestiary/${n.slug}`} className="board-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
              <h2 style={{ margin: 0 }}>{n.name}</h2>
              <ThreatStars entry={n} />
            </div>
            <p className="desc">{n.category}</p>
            <div className="stats">
              {n.attrs.hp != null ? <span>HP <b>{n.attrs.hp}</b></span> : null}
              {n.attrs.pow != null ? <span>POW <b>{n.attrs.pow}</b></span> : null}
              {n.sanity_loss ? <span>SAN <b>{n.sanity_loss}</b></span> : null}
            </div>
          </Link>
        ))}
        {otherNpcs.length === 0 && addedChars.length === 0 ? (
          <div className="empty">에너미에 다른 항목이 없습니다.</div>
        ) : null}
      </div>
    </>
  );
}

function rolld(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}
