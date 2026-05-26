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

// 인라인형 vital bar — HP/MP 는 ± 스텝, SAN/LUCK 은 직접 숫자 입력.
// 저장 버튼은 카드 하단에 가로로 배치.
export function VitalsEditor({
  character, luck,
}: {
  character: VitalsRef;
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
    <form action={updateCharacterVitalsAction} className="vital-bar">
      <input type="hidden" name="character_id" value={character.id} />
      <div className="vital-cells">
        <StepVitalCell name="hp" label="HP" value={hp} max={character.hp_max} onChange={setHp} variant="hp" />
        <StepVitalCell name="mp" label="MP" value={mp} max={character.mp_max} onChange={setMp} variant="mp" />
        <NumVitalCell  name="san" label="SAN" value={san} max={character.san_max} onChange={setSan} variant="san" danger={san < 30} />
        {luck != null ? (
          <NumVitalCell name="luck" label="LUCK" value={luckVal} max={99} onChange={setLuckVal} variant="luck" />
        ) : null}
      </div>
      <div className="vital-foot">
        <SubmitButton
          className="btn small vital-save"
          disabled={!dirty}
          pendingLabel="저장 중…"
          title={dirty ? "변경된 vitals 저장" : "변경 사항 없음"}
        >
          저장
        </SubmitButton>
      </div>
    </form>
  );
}

function StepVitalCell({
  name, label, value, max, onChange, variant, danger,
}: {
  name: string;
  label: string;
  value: number;
  max: number;
  onChange: (n: number) => void;
  variant: "hp" | "mp";
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

function NumVitalCell({
  name, label, value, max, onChange, variant, danger,
}: {
  name: string;
  label: string;
  value: number;
  max: number;
  onChange: (n: number) => void;
  variant: "san" | "luck";
  danger?: boolean;
}) {
  return (
    <label className={`vital-cell vital-num vital-${variant}${danger ? " warn" : ""}`}>
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
    </label>
  );
}
