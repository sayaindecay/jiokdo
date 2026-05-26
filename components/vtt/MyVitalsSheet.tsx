"use client";

import { useState } from "react";
import { updateCharacterVitalsAction } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

export type VitalsRefForSheet = {
  id: number;
  hp: number; hp_max: number;
  mp: number; mp_max: number;
  san: number; san_max: number;
};

// 플레이 화면 캐릭터 시트용 vital 편집 — 한 줄당 한 vital, 메터 + 입력 + ± 형태.
// 트래커의 grid 형 칩과는 다른 시트 친화적 레이아웃.
export function MyVitalsSheet({
  character, luck,
}: {
  character: VitalsRefForSheet;
  luck?: number;
}) {
  const [hp, setHp] = useState(character.hp);
  const [mp, setMp] = useState(character.mp);
  const [san, setSan] = useState(character.san);
  const [luckVal, setLuckVal] = useState(luck ?? 0);
  const dirty =
    hp !== character.hp ||
    mp !== character.mp ||
    san !== character.san ||
    (luck != null && luckVal !== luck);

  return (
    <form action={updateCharacterVitalsAction} className="mvs-sheet">
      <input type="hidden" name="character_id" value={character.id} />
      <StepRow name="hp"  label="HP"  value={hp}  max={character.hp_max}  onChange={setHp}  variant="hp" />
      <StepRow name="mp"  label="MP"  value={mp}  max={character.mp_max}  onChange={setMp}  variant="mp" />
      <NumRow  name="san" label="SAN" value={san} max={character.san_max} onChange={setSan} variant="san" danger={san < 30} />
      {luck != null ? (
        <NumRow name="luck" label="LUCK" value={luckVal} max={99} onChange={setLuckVal} variant="luck" />
      ) : null}
      <div className="mvs-foot">
        <SubmitButton
          className="btn small mvs-save"
          disabled={!dirty}
          pendingLabel="저장 중…"
        >
          저장
        </SubmitButton>
      </div>
    </form>
  );
}

function Meter({ pct, variant }: { pct: number; variant: string }) {
  return (
    <span className={`mvs-bar mvs-bar-${variant}`} aria-hidden="true">
      <i style={{ width: `${pct}%` }} />
    </span>
  );
}

function StepRow({
  name, label, value, max, onChange, variant,
}: {
  name: string; label: string; value: number; max: number;
  onChange: (n: number) => void;
  variant: "hp" | "mp";
}) {
  const safeMax = Math.max(1, max);
  const pct = Math.min(100, Math.max(0, (value / safeMax) * 100));
  return (
    <div className={`mvs-row mvs-row-${variant}`}>
      <span className="mvs-label">{label}</span>
      <Meter pct={pct} variant={variant} />
      <span className="mvs-num">
        <input
          type="number"
          name={name}
          value={value}
          min={0}
          max={max}
          onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
          aria-label={`${label} 현재값`}
        />
        <span className="mvs-slash">/</span>
        <span className="mvs-max">{max}</span>
      </span>
      <span className="mvs-steps">
        <button
          type="button"
          className="mvs-step"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`${label} 감소`}
          tabIndex={-1}
        >−</button>
        <button
          type="button"
          className="mvs-step"
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`${label} 증가`}
          tabIndex={-1}
        >+</button>
      </span>
    </div>
  );
}

function NumRow({
  name, label, value, max, onChange, variant, danger,
}: {
  name: string; label: string; value: number; max: number;
  onChange: (n: number) => void;
  variant: "san" | "luck";
  danger?: boolean;
}) {
  const safeMax = Math.max(1, max);
  const pct = Math.min(100, Math.max(0, (value / safeMax) * 100));
  return (
    <div className={`mvs-row mvs-row-${variant}${danger ? " warn" : ""}`}>
      <span className="mvs-label">{label}</span>
      <Meter pct={pct} variant={variant} />
      <span className="mvs-num mvs-num-direct">
        <input
          type="number"
          name={name}
          value={value}
          min={0}
          max={max}
          onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
          aria-label={`${label} 현재값`}
        />
        <span className="mvs-slash">/</span>
        <span className="mvs-max">{max}</span>
      </span>
      <span className="mvs-steps mvs-steps-empty" aria-hidden="true" />
    </div>
  );
}
