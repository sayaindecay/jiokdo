"use client";

import { useState } from "react";
import Link from "next/link";
import type { Campaign, Character, PlayEntry } from "@/lib/types";
import { LEVEL_LABEL } from "@/lib/dice";
import { computeBuildDb, computeMove, formatBuild } from "@/lib/coc-derive";
import { Meter } from "./Meter";
import { SkillList } from "./SkillList";
import { RollButton } from "./RollButton";
import { VitalsEditor } from "./VitalsEditor";
import { WeaponList } from "./WeaponList";
import { PortraitSilhouette } from "./Illustrations";

const ATTR_KEYS: { key: keyof Character["attrs"]; label: string }[] = [
  { key: "str", label: "STR" }, { key: "con", label: "CON" }, { key: "siz", label: "SIZ" },
  { key: "dex", label: "DEX" }, { key: "app", label: "APP" }, { key: "int", label: "INT" },
  { key: "pow", label: "POW" }, { key: "edu", label: "EDU" },
];

export function MobileCharacterSheet({
  character, campaign, recentRolls, isOwner,
}: {
  character: Character;
  campaign: Campaign | null;
  recentRolls: PlayEntry[];
  isOwner: boolean;
}) {
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const buildDb = computeBuildDb(character.attrs.str + character.attrs.con);
  const move = computeMove(character.attrs.str, character.attrs.dex, character.attrs.siz);

  const diceRolls = recentRolls.flatMap((entry) =>
    entry.segments.flatMap((seg, segIdx) => {
      if (seg.type !== "dice") return [];
      const r = seg.result;
      if (r.kind === "cc") {
        return [
          <div key={`${entry.id}-${segIdx}`} className="dice-block cc">
            <span className="expr">{r.name ? `${r.name} (${r.skill})` : `1d100 ≤ ${r.skill}`}</span>
            <span className="total">→ {r.roll}</span>
            <span className={`level ${r.level}`}>{LEVEL_LABEL[r.level]}</span>
          </div>,
        ];
      }
      return [
        <div key={`${entry.id}-${segIdx}`} className="dice-block">
          <span className="expr">{r.notation}</span>
          <span className="total">= {r.total}</span>
        </div>,
      ];
    })
  );

  return (
    <div className="m-cs">
      {/* sticky 요약 + 편집 버튼 */}
      <div className="m-cs-summary">
        <div className="m-cs-portrait" aria-hidden="true">
          {character.portrait_url ? (
            <img src={character.portrait_url} alt="" />
          ) : (
            <PortraitSilhouette />
          )}
        </div>
        <div className="m-cs-id">
          <span className="m-cs-name">{character.name}</span>
          <span className="m-cs-occu">{character.occupation || "무직"}</span>
        </div>
        <div className="m-cs-vitals">
          <span>
            HP <b>{character.hp}</b>
          </span>
          <span>
            SAN <b className={character.san < 30 ? "warn" : ""}>{character.san}</b>
          </span>
          <span>
            MP <b>{character.mp}</b>
          </span>
        </div>
        {isOwner ? (
          <button
            type="button"
            className="m-cs-edit-btn"
            onClick={() => setVitalsOpen(true)}
            aria-label="vital 편집"
          >
            ✎
          </button>
        ) : null}
      </div>

      {/* 특성 — 기본 펼침 */}
      <details className="m-cs-sec" open>
        <summary>
          <span>특성 / Characteristics</span>
          <span className="m-cs-chev" aria-hidden="true">▾</span>
        </summary>
        <div className="m-cs-sec-body">
          <div className="m-cs-attrs">
            {ATTR_KEYS.map(({ key, label }) => {
              const value = character.attrs[key];
              const inner = (
                <>
                  <span className="m-attr-k">{label}</span>
                  <span className="m-attr-v">{value}</span>
                  <span className="m-attr-h">
                    {Math.floor(value / 2)} / {Math.floor(value / 5)}
                  </span>
                </>
              );
              return isOwner ? (
                <RollButton
                  key={key}
                  characterId={character.id}
                  skillName={label}
                  skillValue={value}
                  className="m-attr rollable"
                >
                  {inner}
                </RollButton>
              ) : (
                <div className="m-attr" key={key}>
                  {inner}
                </div>
              );
            })}
          </div>
          <div className="m-cs-derived">
            <div>
              <span className="k">체구</span>
              <span className="v">{formatBuild(buildDb.build)}</span>
            </div>
            <div>
              <span className="k">DB</span>
              <span className="v">{buildDb.db}</span>
            </div>
            <div>
              <span className="k">이동력</span>
              <span className="v">{move}</span>
            </div>
          </div>
        </div>
      </details>

      {/* 상태 */}
      <details className="m-cs-sec" open>
        <summary>
          <span>상태 / Status</span>
          <span className="m-cs-chev" aria-hidden="true">▾</span>
        </summary>
        <div className="m-cs-sec-body">
          <Meter label="HP" current={character.hp} max={character.hp_max} variant="hp" />
          <Meter label="MP" current={character.mp} max={character.mp_max} variant="mp" />
          <Meter
            label="SAN"
            current={character.san}
            max={character.san_max}
            variant="san"
            danger={character.san < 30}
          />
          <Meter label="LUCK" current={character.attrs.luck} max={99} variant="luck" />
          <div className="condition-row">
            {character.hp < character.hp_max / 2 ? <span className="tag-pill red">경상</span> : null}
            {character.san < 30 ? <span className="tag-pill red">위험 SAN</span> : null}
            {character.mp === 0 ? <span className="tag-pill">MP 고갈</span> : null}
          </div>
        </div>
      </details>

      {/* 기능 */}
      <details className="m-cs-sec">
        <summary>
          <span>기능 / Skills</span>
          <span className="m-cs-count">{character.skills.length}</span>
          <span className="m-cs-chev" aria-hidden="true">▾</span>
        </summary>
        <div className="m-cs-sec-body">
          <SkillList characterId={character.id} skills={character.skills} canRoll={isOwner} />
        </div>
      </details>

      {/* 무기 */}
      <details className="m-cs-sec">
        <summary>
          <span>무기 / Weapons</span>
          <span className="m-cs-count">{character.weapons.length}</span>
          <span className="m-cs-chev" aria-hidden="true">▾</span>
        </summary>
        <div className="m-cs-sec-body">
          <WeaponList characterId={character.id} weapons={character.weapons} canRoll={isOwner} />
        </div>
      </details>

      {/* 배경 */}
      <details className="m-cs-sec">
        <summary>
          <span>배경 / Backstory</span>
          <span className="m-cs-chev" aria-hidden="true">▾</span>
        </summary>
        <div className="m-cs-sec-body">
          {character.backstory ? (
            <div className="note-block note-ideology">
              <div className="note-title">배경 노트</div>
              {character.backstory}
            </div>
          ) : (
            <div className="note-block note-trait" style={{ color: "var(--ink-3)" }}>
              <div className="note-title">아직 비어 있음</div>
              이상·의미 있는 사람·소중한 장소를 적어보세요.
            </div>
          )}
        </div>
      </details>

      {/* 최근 굴림 */}
      <details className="m-cs-sec">
        <summary>
          <span>최근 굴림</span>
          {diceRolls.length > 0 ? <span className="m-cs-count">{diceRolls.length}</span> : null}
          <span className="m-cs-chev" aria-hidden="true">▾</span>
        </summary>
        <div className="m-cs-sec-body">
          {diceRolls.length === 0 ? (
            <div className="empty" style={{ padding: "0.8rem" }}>
              아직 굴림 기록이 없습니다.
            </div>
          ) : (
            <div className="recent-rolls" style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {diceRolls}
            </div>
          )}
        </div>
      </details>

      <div className="m-cs-actions">
        {isOwner ? (
          <Link href={`/characters/${character.id}/edit`} className="btn ghost">
            편집
          </Link>
        ) : null}
        {campaign ? (
          <Link href={`/campaigns/${campaign.id}/play`} className="btn primary">
            세션 입장 →
          </Link>
        ) : null}
      </div>

      {/* vital 편집 bottom-sheet */}
      {isOwner && vitalsOpen ? (
        <>
          <button
            type="button"
            className="m-cs-scrim"
            aria-label="닫기"
            onClick={() => setVitalsOpen(false)}
          />
          <div className="m-cs-sheet" role="dialog" aria-label="vital 편집">
            <div className="m-cs-sheet-grip" aria-hidden="true" />
            <div className="m-cs-sheet-head">
              <span>상태값 편집</span>
              <button type="button" onClick={() => setVitalsOpen(false)} aria-label="닫기">
                ✕
              </button>
            </div>
            <VitalsEditor character={character} luck={character.attrs.luck} />
          </div>
        </>
      ) : null}
    </div>
  );
}
