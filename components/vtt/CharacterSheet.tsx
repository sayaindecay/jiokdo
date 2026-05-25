import Link from "next/link";
import type { Campaign, Character, PlayEntry } from "@/lib/types";
import { LEVEL_LABEL } from "@/lib/dice";
import { Meter } from "./Meter";
import { SkillList } from "./SkillList";
import { RollButton } from "./RollButton";
import { VitalsEditor } from "./VitalsEditor";
import { WeaponList } from "./WeaponList";
import { PortraitSilhouette } from "./Illustrations";
import { CharacterPortraitEditor } from "./CharacterPortraitEditor";

const ATTR_KEYS: { key: keyof Character["attrs"]; label: string }[] = [
  { key: "str", label: "STR" }, { key: "con", label: "CON" }, { key: "siz", label: "SIZ" },
  { key: "dex", label: "DEX" }, { key: "app", label: "APP" }, { key: "int", label: "INT" },
  { key: "pow", label: "POW" }, { key: "edu", label: "EDU" },
];

export function CharacterSheet({
  character, campaign, recentRolls, isOwner,
}: {
  character: Character;
  campaign: Campaign | null;
  recentRolls: PlayEntry[];
  isOwner: boolean;
}) {
  return (
    <>
      <div className="breadcrumb">
        {campaign ? (
          <>
            <Link href={`/campaigns/${campaign.id}`}>{campaign.name}</Link>
            <span className="sep">/</span>
            <span>캐릭터</span>
            <span className="sep">/</span>
          </>
        ) : null}
        <span>{character.name}</span>
      </div>

      {/* 모바일 sticky 요약 (P17) */}
      <div className="sheet-sticky-summary" aria-hidden="false">
        <div className="ss-name">{character.name}</div>
        <div className="ss-vitals">
          <span>HP <b>{character.hp}/{character.hp_max}</b></span>
          <span>SAN <b className={character.san < 30 ? "warn" : ""}>{character.san}/{character.san_max}</b></span>
          <span>MP <b>{character.mp}/{character.mp_max}</b></span>
        </div>
      </div>

      <div className={`sheet-frame${isOwner ? " is-owner" : ""}`}>
        {isOwner ? (
          <span className="sheet-owner-pin" aria-hidden="true">내 캐릭터</span>
        ) : null}
        <div className={`sheet-shell${isOwner ? " is-owner" : ""}`}>
        <div className="sheet-header">
          <div className="sheet-portrait">
            {isOwner ? (
              <CharacterPortraitEditor
                characterId={character.id}
                currentUrl={character.portrait_url}
              />
            ) : character.portrait_url ? (
              <img
                src={character.portrait_url}
                alt={`${character.name} 프로필`}
                className="sheet-portrait-img"
              />
            ) : (
              <PortraitSilhouette />
            )}
          </div>
          <div className="sheet-title">
            <h1>{character.name}</h1>
            <div className="occupation">
              {character.occupation || "무직"}
              {character.age ? (
                <>
                  <span className="sep">·</span>
                  <span>{character.age}세</span>
                </>
              ) : null}
            </div>
            <div className="meta">
              <span>POW {character.attrs.pow}</span>
              <span className="sep">·</span>
              <span>EDU {character.attrs.edu}</span>
              <span className="sep">·</span>
              <span>SAN {character.san}/{character.san_max}</span>
            </div>
          </div>
          <div className="sheet-actions">
            {isOwner ? (
              <Link href={`/characters/${character.id}/edit`} className="btn ghost">
                편집
              </Link>
            ) : null}
            {campaign ? (
              <Link href={`/campaigns/${campaign.id}/play`} className="btn">
                세션 입장
              </Link>
            ) : null}
          </div>
        </div>

        <div className="sheet-body">
          {/* Col 1: attrs + status */}
          <div className="sheet-col">
            <h3>특성 / Characteristics</h3>
            {ATTR_KEYS.map(({ key, label }) => {
              const value = character.attrs[key];
              return (
                <div className="char-row" key={key}>
                  <span className="key">{label}</span>
                  <span className="val">{value}</span>
                  <span className="halves" aria-label={`반값 ${Math.floor(value / 2)}, 5분의 1값 ${Math.floor(value / 5)}`}>
                    <span className="half-chip">
                      <span className="hc-label">½</span>
                      <span className="hc-val">{Math.floor(value / 2)}</span>
                    </span>
                    <span className="half-chip">
                      <span className="hc-label">⅕</span>
                      <span className="hc-val">{Math.floor(value / 5)}</span>
                    </span>
                  </span>
                  {isOwner ? (
                    <RollButton
                      characterId={character.id}
                      skillName={label}
                      skillValue={value}
                      className="roll-btn"
                    >
                      d100
                    </RollButton>
                  ) : (
                    <span className="roll-btn" style={{ opacity: 0.4, cursor: "default" }}>d100</span>
                  )}
                </div>
              );
            })}

            <h3>상태 / Status</h3>
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
              {character.hp < character.hp_max / 2
                ? <span className="tag-pill red">경상</span>
                : null}
              {character.san < 30
                ? <span className="tag-pill red">위험 SAN</span>
                : null}
              {character.mp === 0
                ? <span className="tag-pill">MP 고갈</span>
                : null}
            </div>

            {isOwner ? (
              <VitalsEditor character={character} />
            ) : null}
          </div>

          {/* Col 2: skills */}
          <div className="sheet-col">
            <SkillList
              characterId={character.id}
              skills={character.skills}
              canRoll={isOwner}
            />
          </div>

          {/* Col 3: backstory + inventory + recent rolls */}
          <div className="sheet-col">
            <h3>배경 / Backstory</h3>
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

            <h3>무기 / Weapons</h3>
            <WeaponList
              characterId={character.id}
              weapons={character.weapons}
              canRoll={isOwner}
            />

            <h3 data-recent-rolls>최근 굴림</h3>
            {recentRolls.length === 0 ? (
              <div className="empty" style={{ padding: "1rem", marginTop: "0.4rem" }}>
                아직 굴림 기록이 없습니다.
              </div>
            ) : (
              <div className="recent-rolls" style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {recentRolls.map((entry) =>
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
                )}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
