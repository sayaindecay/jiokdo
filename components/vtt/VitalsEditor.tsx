"use client";

import { useState } from "react";
import { updateCharacterVitalsAction } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

export type VitalsRef = {
  id: number;
  hp: number; hp_max: number;
  mp: number; mp_max: number;
  san: number; san_max: number;
};

// 인라인형 vital bar — HP/MP/SAN(+ optional LUCK) 를 한 줄 카드로 표시하고
// 각 셀의 ± 버튼으로 직접 조절. dirty 일 때만 '저장' 버튼 노출.
export function VitalsEditor({
  character, luck,
}: {
  character: VitalsRef;
  luck?: number;
}) {
  const [hp, setHp] = useState(character.hp);
  const [mp, setMp] = useState(character.mp);
  const [san, setSan] = useState(character.san);
  const dirty =
    hp !== character.hp || mp !== character.mp || san !== character.san;

  return (
    <form action={updateCharacterVitalsAction} className="vital-bar">
      <input type="hidden" name="character_id" value={character.id} />
      <VitalCell name="hp"  label="HP"  value={hp}  max={character.hp_max}  onChange={setHp}  variant="hp" />
      <VitalCell name="mp"  label="MP"  value={mp}  max={character.mp_max}  onChange={setMp}  variant="mp" />
      <VitalCell name="san" label="SAN" value={san} max={character.san_max} onChange={setSan} variant="san" danger={san < 30} />
      {luck != null ? (
        <div className="vital-cell vital-luck is-readonly" aria-label={`LUCK ${luck}`}>
          <span className="vital-label">LUCK</span>
          <span className="vital-val">{luck}</span>
        </div>
      ) : null}
      <SubmitButton
        className="btn small vital-save"
        disabled={!dirty}
        pendingLabel="저장 중…"
        title={dirty ? "변경된 vitals 저장" : "변경 사항 없음"}
      >
        저장
      </SubmitButton>
    </form>
  );
}

function VitalCell({
  name, label, value, max, onChange, variant, danger,
}: {
  name: string;
  label: string;
  value: number;
  max: number;
  onChange: (n: number) => void;
  variant: "hp" | "mp" | "san";
  danger?: boolean;
}) {
  return (
    <div className={`vital-cell vital-${variant}${danger ? " warn" : ""}`}>
      <button
        type="button"
        className="vital-step"
        onClick={() => onChange(Math.max(0, value - 1))}
        aria-label={`${label} 감소`}
        tabIndex={-1}
      >−</button>
      <div className="vital-main">
        <span className="vital-label">{label}</span>
        <span className="vital-val">
          <input
            type="number"
            name={name}
            value={value}
            min={0}
            max={max}
            onChange={(e) =>
              onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))
            }
            aria-label={`${label} 현재값`}
          />
          <span className="vital-sep">/</span>
          <span className="vital-max">{max}</span>
        </span>
      </div>
      <button
        type="button"
        className="vital-step"
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label={`${label} 증가`}
        tabIndex={-1}
      >+</button>
    </div>
  );
}
