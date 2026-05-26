"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { BestiaryEntry, CocAttrs, CocSkillGroup, DiceLevel, Segment } from "@/lib/types";
import { InitiativeTracker, type InitiativeRow } from "@/components/vtt/InitiativeTracker";
import { VitalsEditor } from "@/components/vtt/VitalsEditor";
import { judgeCoc, LEVEL_LABEL } from "@/lib/dice";
import { formatTime } from "@/lib/format";
import { appendTrackerEntryAction } from "@/app/actions";

export type PcLite = {
  id: number;
  name: string;
  occupation: string;
  owner_nick: string;
  attrs: CocAttrs;
  hp: number;
  hp_max: number;
  mp: number;
  mp_max: number;
  san: number;
  san_max: number;
  skills: Array<{ name: string; value: number; group?: CocSkillGroup }>;
  weapons: Array<{ name: string; skill: number; damage: string }>;
};

type AddTab = "enemy" | "char";

type FocusedEntity =
  | { kind: "npc"; entry: BestiaryEntry; rowId: string }
  | { kind: "pc"; char: PcLite; rowId: string };

type CombatAction = "attack" | "brawl" | "dodge" | "fightback" | "flee";

type CombatLogEntry = {
  id: number;
  ts: number;
  kind: "roll" | "system";
  actor: string;
  character_id: number | null;
  label: string;
  detail?: string;
  skill_name?: string;
  skill_val?: number;
  roll?: number;
  level?: DiceLevel;
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
      if (w) return { label: `공격 (${w.name})`, skillName: w.name, skillVal: w.skill };
      return { label: "공격 (주먹)", skillName: "주먹", skillVal: findSkill(c, ["주먹", "근접전(주먹)"]) ?? 25 };
    }
    case "brawl":
      return { label: "근접전 액션 (주먹)", skillName: "주먹", skillVal: findSkill(c, ["주먹", "근접전(주먹)"]) ?? 25 };
    case "dodge":
      return { label: "회피", skillName: "회피", skillVal: findSkill(c, ["회피"]) ?? Math.floor(c.attrs.dex / 2) };
    case "fightback":
      return { label: "반격 (주먹)", skillName: "주먹", skillVal: findSkill(c, ["주먹", "근접전(주먹)"]) ?? 25 };
    case "flee":
      return { label: "도주 (DEX)", skillName: "DEX", skillVal: c.attrs.dex };
  }
}

function getActionForNpc(action: CombatAction, e: BestiaryEntry) {
  const first = e.attacks[0];
  const dex = Number(e.attrs.dex ?? 50);
  switch (action) {
    case "attack":
      if (first) return { label: `공격 (${first.name})`, skillName: first.name, skillVal: first.skill };
      return { label: "공격", skillName: "공격", skillVal: dex };
    case "brawl":
      if (first) return { label: `근접전 (${first.name})`, skillName: first.name, skillVal: first.skill };
      return { label: "근접전", skillName: "근접전", skillVal: dex };
    case "dodge":
      return { label: "회피", skillName: "회피", skillVal: Math.floor(dex / 2) };
    case "fightback":
      if (first) return { label: `반격 (${first.name})`, skillName: first.name, skillVal: first.skill };
      return { label: "반격", skillName: "반격", skillVal: dex };
    case "flee":
      return { label: "도주 (DEX)", skillName: "DEX", skillVal: dex };
  }
}

const ATTR_LABELS: { key: keyof CocAttrs; label: string }[] = [
  { key: "str", label: "STR" }, { key: "con", label: "CON" }, { key: "siz", label: "SIZ" },
  { key: "dex", label: "DEX" }, { key: "int", label: "INT" }, { key: "pow", label: "POW" },
];

const NPC_ATTR_LABELS: { key: keyof BestiaryEntry["attrs"]; label: string }[] = [
  { key: "str", label: "STR" }, { key: "con", label: "CON" }, { key: "siz", label: "SIZ" },
  { key: "dex", label: "DEX" }, { key: "int", label: "INT" }, { key: "pow", label: "POW" },
];

export function TrackerPanel({
  campaignId,
  initialRows,
  bestiary,
  pcChars,
  keeperChars,
  currentNick,
}: {
  campaignId: number;
  initialRows: InitiativeRow[];
  bestiary: BestiaryEntry[];
  pcChars: PcLite[];
  keeperChars: PcLite[];
  currentNick: string | null;
}) {
  const [rows, setRows] = useState<InitiativeRow[]>(initialRows);
  const [round, setRound] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [roundFlash, setRoundFlash] = useState(false);
  const [actedIds, setActedIds] = useState<Set<string>>(new Set());
  const [focused, setFocused] = useState<FocusedEntity | null>(null);
  const [addTab, setAddTab] = useState<AddTab>("enemy");
  const [addedCharIds, setAddedCharIds] = useState<number[]>([]);
  const [weaponIdx, setWeaponIdx] = useState(0);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [logSeq, setLogSeq] = useState(1);
  const [exporting, startExport] = useTransition();
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportedAt, setExportedAt] = useState<number | null>(null);

  const sorted = useMemo(() => [...rows].sort((a, b) => b.dex - a.dex), [rows]);
  const sortedWithActed = useMemo(
    () => sorted.map((r) => ({ ...r, acted: actedIds.has(r.id) })),
    [sorted, actedIds],
  );
  const liveRows = sortedWithActed.filter((r) => !r.dead);
  const allActed = liveRows.length > 0 && liveRows.every((r) => r.acted);

  const focusedRow = focused
    ? rows.find((r) => r.id === focused.rowId) ?? null
    : null;

  const flash = () => {
    setRoundFlash(true);
    setTimeout(() => setRoundFlash(false), 700);
  };

  // 메모리에만 적재되는 전투 로그 — 익스포트 전까지는 세션 로그에 합쳐지지 않음.
  const pushLog = (e: Omit<CombatLogEntry, "id" | "ts">) => {
    setCombatLog((prev) => [...prev, { ...e, id: logSeq, ts: Date.now() }]);
    setLogSeq((s) => s + 1);
  };

  const logRoll = (
    actor: string,
    label: string,
    skillName: string,
    skillVal: number,
    roll: number,
    level: DiceLevel,
    characterId: number | null,
  ) => {
    pushLog({
      kind: "roll",
      actor,
      character_id: characterId,
      label,
      skill_name: skillName,
      skill_val: skillVal,
      roll,
      level,
    });
  };

  const logSystem = (actor: string, label: string, detail?: string) => {
    pushLog({ kind: "system", actor, character_id: null, label, detail });
  };

  const exportToSession = () => {
    if (combatLog.length === 0) return;
    const segments: Segment[] = combatLog.map((e) => {
      if (e.kind === "roll" && e.skill_name && e.skill_val != null && e.roll != null && e.level) {
        return {
          type: "dice",
          result: {
            kind: "cc",
            expression: `/cc ${e.skill_name} ${e.skill_val}`,
            name: `[${e.actor}] ${e.label}`,
            skill: e.skill_val,
            roll: e.roll,
            level: e.level,
          },
        };
      }
      return {
        type: "text",
        value: `[${e.actor}] ${e.label}${e.detail ? ` — ${e.detail}` : ""}`,
      };
    });
    const fd = new FormData();
    fd.set("campaign_id", String(campaignId));
    fd.set("title", `전투 로그 (${combatLog.length}건 · 라운드 ${round}까지)`);
    fd.set("kind", "system");
    fd.set("segments_json", JSON.stringify(segments));
    setExportError(null);
    startExport(async () => {
      try {
        await appendTrackerEntryAction(fd);
        setExportedAt(Date.now());
        setCombatLog([]);
      } catch (e) {
        setExportError(e instanceof Error ? e.message : "익스포트 실패");
      }
    });
  };

  const advance = () => {
    if (liveRows.length === 0) return;
    if (allActed) {
      setActedIds(new Set());
      const nextRound = round + 1;
      setRound(nextRound);
      flash();
      const firstLiveIdx = sorted.findIndex((r) => r.id === liveRows[0].id);
      setActiveIndex(firstLiveIdx >= 0 ? firstLiveIdx : 0);
      logSystem("시스템", `라운드 ${nextRound} 시작`, "전원 행동 완료 — 다음 라운드");
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
  };

  const reset = () => {
    setRound(1);
    setActedIds(new Set());
    flash();
    setActiveIndex(0);
    setRows((prev) => prev.map((r) => ({ ...r, dead: false, hp: r.hp_max })));
    logSystem("시스템", "라운드 초기화", "전원 부활 / HP 복구");
  };

  const damage = (rowId: string, amount: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const hp = Math.max(0, Math.min(r.hp_max, r.hp - amount));
        const died = hp === 0 && !r.dead;
        if (died) {
          logSystem(r.name, "사망", `HP 0/${r.hp_max} — 전투에서 이탈`);
        }
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
    if (focused && focused.rowId === rowId) setFocused(null);
  };

  const addNpcFromSlug = (slug: string) => {
    const entry = bestiary.find((b) => b.slug === slug);
    if (!entry) return;
    const existing = rows.filter((r) => r.source_slug === entry.slug);
    const num = existing.length + 1;
    const hp = Number(entry.attrs.hp ?? 5);
    const dex = Number(entry.attrs.dex ?? 50);
    const rowId = `npc-${entry.slug}-${Date.now()}-${num}`;
    const newRow: InitiativeRow = {
      id: rowId,
      dex,
      name: existing.length > 0 ? `${entry.name} #${num}` : entry.name,
      is_pc: false,
      hp,
      hp_max: hp,
      source_slug: entry.slug,
    };
    setRows((prev) => [...prev, newRow]);
    setFocused({ kind: "npc", entry, rowId });
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
    const pcMatch = row.id.match(/^pc-(\d+)$/);
    if (pcMatch) {
      const c = pcChars.find((x) => x.id === Number(pcMatch[1]));
      if (c) {
        setFocused({ kind: "pc", char: c, rowId: row.id });
        setWeaponIdx(0);
        return;
      }
    }
    const charMatch = row.id.match(/^char-(\d+)-/);
    if (charMatch) {
      const c = keeperChars.find((x) => x.id === Number(charMatch[1]));
      if (c) {
        setFocused({ kind: "pc", char: c, rowId: row.id });
        setWeaponIdx(0);
        return;
      }
    }
    if (row.source_slug) {
      const entry = bestiary.find((b) => b.slug === row.source_slug);
      if (entry) {
        setFocused({ kind: "npc", entry, rowId: row.id });
        return;
      }
    }
  };

  const rollAndLog = (
    actor: string,
    label: string,
    skillName: string,
    skillVal: number,
    characterId: number | null,
  ) => {
    const roll = rolld(100);
    const level = judgeCoc(roll, skillVal);
    logRoll(actor, label, skillName, skillVal, roll, level, characterId);
  };

  const fireAction = (action: CombatAction) => {
    if (!focused) return;
    const setup =
      focused.kind === "pc"
        ? getActionForPc(action, focused.char, weaponIdx)
        : getActionForNpc(action, focused.entry);
    const actor = focusedRow?.name ?? (focused.kind === "pc" ? focused.char.name : focused.entry.name);
    const characterId = focused.kind === "pc" && focused.rowId.startsWith("pc-")
      ? focused.char.id
      : null;
    rollAndLog(actor, setup.label, setup.skillName, setup.skillVal, characterId);
  };

  const focusedActiveStatblockId = focused?.rowId;
  const myPc = currentNick
    ? pcChars.find((c) => c.owner_nick === currentNick) ?? null
    : null;

  return (
    <>
    <div className="scene-grid cinematic tracker-embed">
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
        {myPc ? (
          <div className="stk-panel">
            <div className="stk-head">
              <span className="stk-eyebrow">MY · 내 캐릭터</span>
              <span className="stk-title">{myPc.name}</span>
            </div>
            <div className="stk-my-vitals">
              <VitalsEditor
                character={{
                  id: myPc.id,
                  hp: myPc.hp, hp_max: myPc.hp_max,
                  mp: myPc.mp, mp_max: myPc.mp_max,
                  san: myPc.san, san_max: myPc.san_max,
                }}
                luck={myPc.attrs.luck}
              />
            </div>
          </div>
        ) : null}

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
                <Link href="/bestiary" className="stk-link">에너미 페이지에서 추가 →</Link>
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

        {focused ? (
          <div className="stk-panel">
            <div className="stk-head">
              <span className="stk-eyebrow">
                FOCUS · {focused.kind === "pc" ? "캐릭터 시트" : "스탯블록"}
              </span>
              <span className="stk-title">
                {focusedRow?.name ?? (focused.kind === "pc" ? focused.char.name : focused.entry.name)}
              </span>
            </div>
            <div className="stk-body stk-body-flush">
              {focused.kind === "npc" ? (
                <NpcStatSheet
                  entry={focused.entry}
                  rowName={focusedRow?.name ?? focused.entry.name}
                  currentHp={focusedRow?.hp ?? Number(focused.entry.attrs.hp ?? 0)}
                  hpMax={focusedRow?.hp_max ?? Number(focused.entry.attrs.hp ?? 0)}
                  onRoll={(actor, label, skillName, skillVal) =>
                    rollAndLog(actor, label, skillName, skillVal, null)
                  }
                />
              ) : (
                <PcStatSheet
                  char={focused.char}
                  actorName={focusedRow?.name ?? focused.char.name}
                  currentHp={focusedRow?.hp ?? focused.char.hp}
                  hpMax={focusedRow?.hp_max ?? focused.char.hp_max}
                  characterId={focused.rowId.startsWith("pc-") ? focused.char.id : null}
                  onRoll={rollAndLog}
                />
              )}
            </div>

            <div className="stk-foot stk-actions stk-combat-actions">
              <span className="stk-foot-label">전투 액션</span>
              <button type="button" className="chip" onClick={() => fireAction("attack")}>공격</button>
              <button type="button" className="chip" onClick={() => fireAction("brawl")}>근접전</button>
              <button type="button" className="chip" onClick={() => fireAction("dodge")}>회피</button>
              <button type="button" className="chip" onClick={() => fireAction("fightback")}>반격</button>
              <button type="button" className="chip" onClick={() => fireAction("flee")}>도주</button>
            </div>

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

    <div className="section-head section-head-tracker-log">
      <h2>전투 트래커 로그</h2>
      <span className="count">
        {combatLog.length}건
        {exportedAt ? ` · 마지막 익스포트 ${formatTime(exportedAt)}` : " · 익스포트 전"}
      </span>
      <div className="actions">
        <button
          type="button"
          className="btn ghost small"
          onClick={() => { setCombatLog([]); setExportedAt(null); }}
          disabled={combatLog.length === 0 || exporting}
          title="현재까지의 전투 로그를 비웁니다 (세션 로그엔 영향 없음)"
        >
          ↺ 비우기
        </button>
        <button
          type="button"
          className="btn primary small"
          onClick={exportToSession}
          disabled={combatLog.length === 0 || exporting}
          title="전투 로그를 세션 플레이 로그에 단일 게시물로 저장"
        >
          {exporting ? "익스포트 중…" : "세션 로그로 익스포트 →"}
        </button>
      </div>
    </div>
    {exportError ? (
      <div className="empty" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
        익스포트 실패 — {exportError}
      </div>
    ) : null}
    {combatLog.length === 0 ? (
      <div className="empty">
        전투 액션 · 굴림 · 사망 / 라운드 변동이 여기에 쌓입니다. 전투 종료 시 익스포트하면 한 건의 게시물로 세션 로그에 보존됩니다.
      </div>
    ) : (
      <ul className="combat-log combat-log-tracker">
        {[...combatLog].reverse().map((e) => {
          const isSystem = e.kind === "system";
          return (
            <li
              key={e.id}
              className={`cl-row${isSystem ? " is-system" : " is-roll"}${e.character_id != null ? " is-pc" : ""}`}
            >
              <span className="cl-actor" title={e.character_id != null ? "PC" : (isSystem ? "시스템" : "NPC")}>
                {isSystem ? "·" : (e.character_id != null ? "♟" : "▲")} {e.actor}
              </span>
              <span className="cl-label">{e.label}</span>
              {e.kind === "roll" && e.skill_val != null ? (
                <>
                  <span className="cl-skill">{e.skill_val}%</span>
                  <span className="cl-arrow">→</span>
                  <span className="cl-roll">{e.roll}</span>
                  <span className={`cl-level level ${e.level ?? "fail"}`}>
                    {e.level ? LEVEL_LABEL[e.level] : ""}
                  </span>
                </>
              ) : e.detail ? (
                <span className="cl-detail">— {e.detail}</span>
              ) : null}
              <span className="cl-time">{formatTime(e.ts)}</span>
            </li>
          );
        })}
      </ul>
    )}
    </>
  );
}

function PcStatSheet({
  char, actorName, currentHp, hpMax, characterId, onRoll,
}: {
  char: PcLite;
  actorName: string;
  currentHp: number;
  hpMax: number;
  characterId: number | null;
  onRoll: (
    actor: string, label: string, skillName: string, skillVal: number, characterId: number | null,
  ) => void;
}) {
  const a = char.attrs;
  return (
    <div className="statblock pc-statblock">
      <div className="sb-body">
        <div className="stat-grid stat-grid-rollable">
          {ATTR_LABELS.map(({ key, label }) => {
            const v = a[key];
            return (
              <button
                key={key}
                type="button"
                className="stat-cell-btn"
                onClick={() => onRoll(actorName, label, label, v, characterId)}
                title={`${label} ${v}% 굴림`}
              >
                <div className="k">{label}</div>
                <div className="v">{v}</div>
              </button>
            );
          })}
        </div>
        <div className="sb-meta">
          <div className="mrow"><span className="k">HP</span><span className="v">{currentHp} / {hpMax}</span></div>
          <div className="mrow"><span className="k">MP</span><span className="v">{char.mp} / {char.mp_max}</span></div>
          <div className="mrow"><span className="k">SAN</span><span className="v">{char.san} / {char.san_max}</span></div>
          <div className="mrow"><span className="k">DEX (도주)</span><span className="v">{a.dex}</span></div>
        </div>

        {char.weapons.length > 0 ? (
          <>
            <h3 className="pc-sb-heading">무기 (클릭 → 굴림)</h3>
            <div className="attacks">
              {char.weapons.map((w, i) => (
                <button
                  type="button"
                  className="attack-row attack-row-btn"
                  key={i}
                  onClick={() => onRoll(actorName, `공격 (${w.name})`, w.name, w.skill, characterId)}
                  title={`${w.name} ${w.skill}% 굴림`}
                >
                  <span className="name">{w.name}</span>
                  <span className="formula">{w.skill}% · {w.damage}</span>
                  <span className="roll-mark" aria-hidden="true">⌬</span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {char.skills.length > 0 ? (
          <>
            <h3 className="pc-sb-heading">기능 (클릭 → 굴림)</h3>
            <ul className="pc-skill-list">
              {char.skills.map((s) => (
                <li key={s.name}>
                  <button
                    type="button"
                    className="pc-skill-btn"
                    onClick={() => onRoll(actorName, s.name, s.name, s.value, characterId)}
                    title={`${s.name} ${s.value}% 굴림`}
                  >
                    <span className="pc-skill-name">{s.name}</span>
                    <span className="pc-skill-val">{s.value}%</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}

function NpcStatSheet({
  entry, rowName, currentHp, hpMax, onRoll,
}: {
  entry: BestiaryEntry;
  rowName: string;
  currentHp: number;
  hpMax: number;
  onRoll: (actor: string, label: string, skillName: string, skillVal: number) => void;
}) {
  const a = entry.attrs;
  return (
    <div className="statblock npc-statsheet">
      <div className="sb-body">
        <div className="stat-grid stat-grid-rollable">
          {NPC_ATTR_LABELS.map(({ key, label }) => {
            const v = a[key];
            if (v == null) return null;
            const num = Number(v);
            return (
              <button
                key={key}
                type="button"
                className="stat-cell-btn"
                onClick={() => onRoll(rowName, label, label, num)}
                title={`${label} ${num}% 굴림`}
              >
                <div className="k">{label}</div>
                <div className="v">{v}</div>
              </button>
            );
          })}
        </div>

        <div className="sb-meta">
          <div className="mrow"><span className="k">HP</span><span className="v">{currentHp} / {hpMax}</span></div>
          {a.move != null ? (
            <div className="mrow"><span className="k">이동</span><span className="v">{a.move}</span></div>
          ) : null}
          {a.build != null ? (
            <div className="mrow"><span className="k">체격</span><span className="v">{a.build}</span></div>
          ) : null}
          {entry.sanity_loss ? (
            <div className="mrow"><span className="k">SAN 손실</span><span className="v">{entry.sanity_loss}</span></div>
          ) : null}
          {a.damage_bonus ? (
            <div className="mrow"><span className="k">DB</span><span className="v">{a.damage_bonus}</span></div>
          ) : null}
        </div>

        {entry.attacks.length > 0 ? (
          <>
            <h3 className="pc-sb-heading">공격 (클릭 → 굴림)</h3>
            <div className="attacks">
              {entry.attacks.map((atk, i) => (
                <button
                  type="button"
                  className="attack-row attack-row-btn"
                  key={i}
                  onClick={() => onRoll(rowName, `공격 (${atk.name})`, atk.name, atk.skill)}
                  title={`${atk.name} ${atk.skill}% 굴림`}
                >
                  <span className="name">{atk.name}</span>
                  <span className="formula">{atk.skill}% · {atk.damage}</span>
                  <span className="roll-mark" aria-hidden="true">⌬</span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {entry.skills.length > 0 ? (
          <>
            <h3 className="pc-sb-heading">기능 (클릭 → 굴림)</h3>
            <ul className="pc-skill-list">
              {entry.skills.map((s) => (
                <li key={s.name}>
                  <button
                    type="button"
                    className="pc-skill-btn"
                    onClick={() => onRoll(rowName, s.name, s.name, s.value)}
                    title={`${s.name} ${s.value}% 굴림`}
                  >
                    <span className="pc-skill-name">{s.name}</span>
                    <span className="pc-skill-val">{s.value}%</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {entry.description ? (
          <div className="wiki-callout statblock-memo" style={{ marginTop: "0.85rem" }}>
            <b>키퍼 메모 ─</b> {entry.description}
          </div>
        ) : null}
      </div>
    </div>
  );
}
