"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BestiaryEntry, CocAttrs, CocSkillGroup, DiceLevel } from "@/lib/types";
import { InitiativeTracker, type InitiativeRow } from "@/components/vtt/InitiativeTracker";
import { StatBlock } from "@/components/vtt/StatBlock";
import { ThreatStars } from "@/components/vtt/ThreatStars";
import { judgeCoc, LEVEL_LABEL } from "@/lib/dice";

export type PcLite = {
  id: number;
  name: string;
  occupation: string;
  attrs: CocAttrs;
  hp: number;
  hp_max: number;
  skills: Array<{ name: string; value: number; group?: CocSkillGroup }>;
  weapons: Array<{ name: string; skill: number; damage: string }>;
};

type AddTab = "enemy" | "char";

type FocusedEntity =
  | { kind: "npc"; entry: BestiaryEntry }
  | { kind: "pc"; char: PcLite; rowId: string };

type CombatAction = "attack" | "brawl" | "dodge" | "fightback" | "flee";

type LastRoll = {
  actor: string;
  label: string;
  skillVal: number;
  roll: number;
  level: DiceLevel;
};

function rolld(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function findSkill(pc: PcLite, names: string[]): number | undefined {
  for (const n of names) {
    const hit = pc.skills.find((s) => s.name === n);
    if (hit) return hit.value;
  }
  return undefined;
}

function getActionForPc(action: CombatAction, c: PcLite, weaponIdx: number) {
  switch (action) {
    case "attack": {
      const w = c.weapons[weaponIdx] ?? c.weapons[0];
      if (w) return { label: `공격 (${w.name})`, skillVal: w.skill };
      return { label: "공격 (주먹)", skillVal: findSkill(c, ["주먹", "근접전(주먹)"]) ?? 25 };
    }
    case "brawl":
      return { label: "근접전 액션 (주먹)", skillVal: findSkill(c, ["주먹", "근접전(주먹)"]) ?? 25 };
    case "dodge":
      return { label: "회피", skillVal: findSkill(c, ["회피"]) ?? Math.floor(c.attrs.dex / 2) };
    case "fightback":
      return { label: "반격 (주먹)", skillVal: findSkill(c, ["주먹", "근접전(주먹)"]) ?? 25 };
    case "flee":
      return { label: "도주 (DEX×5)", skillVal: c.attrs.dex * 5 };
  }
}

function getActionForNpc(action: CombatAction, e: BestiaryEntry) {
  const first = e.attacks[0];
  const dex = Number(e.attrs.dex ?? 50);
  switch (action) {
    case "attack":
      if (first) return { label: `공격 (${first.name})`, skillVal: first.skill };
      return { label: "공격", skillVal: dex };
    case "brawl":
      if (first) return { label: `근접전 (${first.name})`, skillVal: first.skill };
      return { label: "근접전", skillVal: dex };
    case "dodge":
      return { label: "회피", skillVal: Math.floor(dex / 2) };
    case "fightback":
      if (first) return { label: `반격 (${first.name})`, skillVal: first.skill };
      return { label: "반격", skillVal: dex };
    case "flee":
      return { label: "도주 (DEX×5)", skillVal: dex * 5 };
  }
}

export function SceneClient({
  initialRows,
  bestiary,
  pcChars,
  keeperChars,
}: {
  initialRows: InitiativeRow[];
  bestiary: BestiaryEntry[];
  pcChars: PcLite[];
  keeperChars: PcLite[];
}) {
  const [rows, setRows] = useState<InitiativeRow[]>(initialRows);
  const [round, setRound] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [roundFlash, setRoundFlash] = useState(false);
  const [actedIds, setActedIds] = useState<Set<string>>(new Set());
  const [focused, setFocused] = useState<FocusedEntity | null>(
    bestiary[0] ? { kind: "npc", entry: bestiary[0] } : null,
  );
  const [addTab, setAddTab] = useState<AddTab>("enemy");
  const [addedCharIds, setAddedCharIds] = useState<number[]>([]);
  const [lastRoll, setLastRoll] = useState<LastRoll | null>(null);
  const [weaponIdx, setWeaponIdx] = useState(0);

  const sorted = useMemo(() => [...rows].sort((a, b) => b.dex - a.dex), [rows]);
  const sortedWithActed = useMemo(
    () => sorted.map((r) => ({ ...r, acted: actedIds.has(r.id) })),
    [sorted, actedIds],
  );
  const liveRows = sortedWithActed.filter((r) => !r.dead);
  const allActed = liveRows.length > 0 && liveRows.every((r) => r.acted);

  const flash = () => {
    setRoundFlash(true);
    setTimeout(() => setRoundFlash(false), 700);
  };

  // 모두 행동했으면 라운드 종료 + 다음 라운드 시작.
  // 그렇지 않으면 현재 활성 row 를 acted 로 마킹하고 다음 미행동 live 로 이동.
  const advance = () => {
    if (liveRows.length === 0) return;
    if (allActed) {
      setActedIds(new Set());
      setRound((r) => r + 1);
      flash();
      const firstLiveIdx = sorted.findIndex((r) => r.id === liveRows[0].id);
      setActiveIndex(firstLiveIdx >= 0 ? firstLiveIdx : 0);
      return;
    }
    const cur = sorted[activeIndex];
    const newActed = new Set(actedIds);
    if (cur && !cur.dead) newActed.add(cur.id);
    setActedIds(newActed);
    const next = liveRows.find((r) => !newActed.has(r.id) && r.id !== cur?.id);
    if (next) {
      const nextIdx = sorted.findIndex((r) => r.id === next.id);
      if (nextIdx >= 0) setActiveIndex(nextIdx);
    }
    // 모두 acted 가 되면 다음 클릭에서 라운드 ++ 분기로 진입
  };

  const reset = () => {
    setRound(1);
    setActedIds(new Set());
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
    setActedIds((prev) => {
      const n = new Set(prev);
      n.delete(rowId);
      return n;
    });
    const m = rowId.match(/^char-(\d+)-/);
    if (m) {
      const cid = Number(m[1]);
      setAddedCharIds((prev) => prev.filter((id) => id !== cid));
    }
    if (focused) {
      if (focused.kind === "pc" && focused.rowId === rowId) setFocused(null);
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
    setFocused({ kind: "npc", entry });
  };

  const addNpcFromChar = (charId: number) => {
    const ch = keeperChars.find((c) => c.id === charId);
    if (!ch) return;
    const existing = rows.filter((r) => r.id.startsWith(`char-${ch.id}-`));
    const num = existing.length + 1;
    const rowId = `char-${ch.id}-${Date.now()}-${num}`;
    const newRow: InitiativeRow = {
      id: rowId,
      dex: ch.attrs.dex,
      name: existing.length > 0 ? `${ch.name} #${num}` : ch.name,
      is_pc: false,
      hp: ch.hp,
      hp_max: ch.hp_max,
    };
    setRows((prev) => [...prev, newRow]);
    setAddedCharIds((prev) => (prev.includes(ch.id) ? prev : [...prev, ch.id]));
    setFocused({ kind: "pc", char: ch, rowId });
    setWeaponIdx(0);
  };

  const onSelect = (row: InitiativeRow) => {
    // PC row (현재 캠페인 소속): pc-{id}
    const pcMatch = row.id.match(/^pc-(\d+)$/);
    if (pcMatch) {
      const c = pcChars.find((x) => x.id === Number(pcMatch[1]));
      if (c) {
        setFocused({ kind: "pc", char: c, rowId: row.id });
        setWeaponIdx(0);
        return;
      }
    }
    // 키퍼 캐릭터 NPC: char-{id}-...
    const charMatch = row.id.match(/^char-(\d+)-/);
    if (charMatch) {
      const c = keeperChars.find((x) => x.id === Number(charMatch[1]));
      if (c) {
        setFocused({ kind: "pc", char: c, rowId: row.id });
        setWeaponIdx(0);
        return;
      }
    }
    // 베스티어리 NPC
    if (row.source_slug) {
      const entry = bestiary.find((b) => b.slug === row.source_slug);
      if (entry) {
        setFocused({ kind: "npc", entry });
        return;
      }
    }
  };

  const applyToFocused = (amount: number) => {
    if (focused?.kind === "npc") {
      const target = rows.find((r) => r.source_slug === focused.entry.slug && !r.dead);
      if (target) damage(target.id, amount);
    } else if (focused?.kind === "pc") {
      damage(focused.rowId, amount);
    } else if (sorted[activeIndex] && !sorted[activeIndex].dead) {
      damage(sorted[activeIndex].id, amount);
    }
  };

  const fireAction = (action: CombatAction) => {
    if (!focused) return;
    const setup =
      focused.kind === "pc"
        ? getActionForPc(action, focused.char, weaponIdx)
        : getActionForNpc(action, focused.entry);
    const roll = rolld(100);
    const level = judgeCoc(roll, setup.skillVal);
    setLastRoll({
      actor: focused.kind === "pc" ? focused.char.name : focused.entry.name,
      label: setup.label,
      skillVal: setup.skillVal,
      roll,
      level,
    });
  };

  const otherNpcs = bestiary
    .filter((b) => focused?.kind === "npc" ? b.slug !== focused.entry.slug : true)
    .slice(0, 4);
  const addedChars = keeperChars.filter((c) => addedCharIds.includes(c.id));

  const focusedActiveStatblockId =
    focused?.kind === "npc"
      ? rows.find((r) => r.source_slug === focused.entry.slug)?.id
      : focused?.kind === "pc"
        ? focused.rowId
        : undefined;

  return (
    <>
      <div className="scene-grid cinematic">
        <div className="stk-panel">
          <div className="stk-head">
            <span className="stk-eyebrow">INITIATIVE</span>
            <span className="stk-title">트래커</span>
          </div>
          <div className="stk-body stk-body-flush">
            <InitiativeTracker
              rows={sortedWithActed}
              round={round}
              activeIndex={activeIndex}
              roundFlash={roundFlash}
              allActed={allActed}
              onAdvance={advance}
              onReset={reset}
              onDamage={damage}
              onRemove={remove}
              onSelect={onSelect}
              activeStatblockId={focusedActiveStatblockId}
            />
          </div>
        </div>

        <div className="stk-col">
          {/* 장면에 추가 */}
          <div className="stk-panel">
            <div className="stk-head">
              <span className="stk-eyebrow">ADD · 장면에 등장</span>
              <span className="stk-title">추가</span>
            </div>
            <div className="stk-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={addTab === "enemy"}
                className={`stk-tab${addTab === "enemy" ? " active" : ""}`}
                onClick={() => setAddTab("enemy")}
              >
                에너미
                <span className="stk-tab-count">{bestiary.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={addTab === "char"}
                className={`stk-tab${addTab === "char" ? " active" : ""}`}
                onClick={() => setAddTab("char")}
                disabled={keeperChars.length === 0}
                title={keeperChars.length === 0 ? "키퍼 소유 캐릭터 시트가 없습니다" : ""}
              >
                내 캐릭터
                <span className="stk-tab-count">{keeperChars.length}</span>
              </button>
            </div>
            {addTab === "enemy" ? (
              bestiary.length === 0 ? (
                <div className="stk-empty">
                  에너미에 등록된 항목이 없습니다.{" "}
                  <Link href="/bestiary" className="stk-link">
                    에너미 페이지에서 추가 →
                  </Link>
                </div>
              ) : (
                <ul className="stk-add-list">
                  {bestiary.map((b) => (
                    <li key={b.slug} className="stk-add-row">
                      <div className="stk-add-main">
                        <span className="stk-add-name">{b.name}</span>
                        <span className="stk-add-meta">
                          HP {b.attrs.hp ?? "?"} · DEX {b.attrs.dex ?? "?"} · {b.category}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="stk-add-btn"
                        onClick={() => addNpcFromSlug(b.slug)}
                        aria-label={`${b.name} 추가`}
                      >
                        + 추가
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : keeperChars.length === 0 ? (
              <div className="stk-empty">소유 캐릭터 시트가 없습니다.</div>
            ) : (
              <ul className="stk-add-list">
                {keeperChars.map((c) => (
                  <li key={c.id} className="stk-add-row">
                    <div className="stk-add-main">
                      <span className="stk-add-name">{c.name}</span>
                      <span className="stk-add-meta">
                        HP {c.hp_max} · DEX {c.attrs.dex} · {c.occupation || "직업 미기재"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="stk-add-btn"
                      onClick={() => addNpcFromChar(c.id)}
                      aria-label={`${c.name} 추가`}
                    >
                      + 추가
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 포커스 스탯블록 */}
          {focused ? (
            <div className="stk-panel">
              <div className="stk-head">
                <span className="stk-eyebrow">
                  FOCUS · {focused.kind === "pc" ? "캐릭터 시트" : "스탯블록"}
                </span>
                <span className="stk-title">
                  {focused.kind === "pc" ? focused.char.name : focused.entry.name}
                </span>
              </div>
              <div className="stk-body stk-body-flush">
                {focused.kind === "npc" ? (
                  <StatBlock entry={focused.entry} />
                ) : (
                  <PcStatBlock char={focused.char} />
                )}
              </div>

              {/* 전투 액션 */}
              <div className="stk-foot stk-actions stk-combat-actions">
                <span className="stk-foot-label">전투 액션</span>
                <button type="button" className="chip" onClick={() => fireAction("attack")}>공격</button>
                <button type="button" className="chip" onClick={() => fireAction("brawl")}>근접전</button>
                <button type="button" className="chip" onClick={() => fireAction("dodge")}>회피</button>
                <button type="button" className="chip" onClick={() => fireAction("fightback")}>반격</button>
                <button type="button" className="chip" onClick={() => fireAction("flee")}>도주</button>
              </div>

              {/* PC 무기 선택 */}
              {focused.kind === "pc" && focused.char.weapons.length > 1 ? (
                <div className="stk-weapon-row">
                  <span className="stk-foot-label">무기 선택</span>
                  {focused.char.weapons.map((w, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`chip${i === weaponIdx ? " accent" : ""}`}
                      onClick={() => setWeaponIdx(i)}
                      title={`${w.skill}% · ${w.damage}`}
                    >
                      {w.name} {w.skill}%
                    </button>
                  ))}
                </div>
              ) : null}

              {/* 라스트 굴림 결과 */}
              {lastRoll ? (
                <div className="stk-last-roll">
                  <span className="lr-actor">{lastRoll.actor}</span>
                  <span className="lr-label">{lastRoll.label}</span>
                  <span className="lr-skill">{lastRoll.skillVal}%</span>
                  <span className="lr-arrow">→</span>
                  <span className="lr-roll">{lastRoll.roll}</span>
                  <span className={`lr-level level ${lastRoll.level}`}>
                    {LEVEL_LABEL[lastRoll.level]}
                  </span>
                </div>
              ) : null}

              {/* HP 조절 */}
              <div className="stk-foot stk-actions">
                <span className="stk-foot-label">HP 조절</span>
                <button type="button" className="chip" onClick={() => applyToFocused(rolld(6))}>-1d6</button>
                <button type="button" className="chip" onClick={() => applyToFocused(rolld(4))}>-1d4</button>
                <button type="button" className="chip" onClick={() => applyToFocused(2)}>-2</button>
                <button type="button" className="chip" onClick={() => applyToFocused(-5)}>+5</button>
                {focused.kind === "npc" ? (
                  <button
                    type="button"
                    className="chip accent"
                    onClick={() => addNpcFromSlug(focused.entry.slug)}
                  >
                    + NPC 복제
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="stk-panel">
              <div className="stk-head">
                <span className="stk-eyebrow">FOCUS · 스탯블록</span>
                <span className="stk-title">선택 대기</span>
              </div>
              <div className="stk-empty">
                트래커에서 이름을 누르거나 위에서 추가하면 시트/스탯블록이 여기에 표시됩니다.
              </div>
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
              <span className="stk-badge">내 캐릭터</span>
            </div>
            <p className="desc">{c.occupation || "직업 미기재"}</p>
            <div className="stats">
              <span>HP <b>{c.hp_max}</b></span>
              <span>DEX <b>{c.attrs.dex}</b></span>
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

function PcStatBlock({ char }: { char: PcLite }) {
  const a = char.attrs;
  const combatSkills = char.skills.filter((s) => s.group === "combat");
  return (
    <div className="statblock pc-statblock">
      <div className="sb-body">
        <div className="stat-grid">
          {[
            ["STR", a.str], ["CON", a.con], ["SIZ", a.siz],
            ["DEX", a.dex], ["INT", a.int], ["POW", a.pow],
          ].map(([k, v]) => (
            <div key={k as string}>
              <div className="k">{k}</div>
              <div className="v">{v}</div>
            </div>
          ))}
        </div>
        <div className="sb-meta">
          <div className="mrow"><span className="k">HP</span><span className="v">{char.hp} / {char.hp_max}</span></div>
          <div className="mrow"><span className="k">DEX×5</span><span className="v">{char.attrs.dex * 5}</span></div>
        </div>

        {char.weapons.length > 0 ? (
          <>
            <h3 className="pc-sb-heading">무기</h3>
            <div className="attacks">
              {char.weapons.map((w, i) => (
                <div className="attack-row" key={i}>
                  <span className="name">{w.name}</span>
                  <span className="formula">{w.skill}% · {w.damage}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {combatSkills.length > 0 ? (
          <>
            <h3 className="pc-sb-heading">전투 기능</h3>
            <ul className="pc-skill-list">
              {combatSkills.map((s) => (
                <li key={s.name}>
                  <span className="pc-skill-name">{s.name}</span>
                  <span className="pc-skill-val">{s.value}%</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
