"use client";

import { useState } from "react";
import type { Character } from "@/lib/types";
import { updateCharacterVitalsAction } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

export function VitalsEditor({ character }: { character: Character }) {
  const [hp, setHp] = useState(character.hp);
  const [mp, setMp] = useState(character.mp);
  const [san, setSan] = useState(character.san);
  const dirty =
    hp !== character.hp || mp !== character.mp || san !== character.san;

  return (
    <form
      action={updateCharacterVitalsAction}
      style={{
        marginTop: "0.8rem",
        padding: "0.7rem 0.85rem",
        border: "1.5px dashed var(--line-strong)",
        borderRadius: "var(--radius)",
        display: "flex",
        gap: "0.45rem",
        alignItems: "center",
        flexWrap: "wrap",
        fontFamily: "var(--font-mono)",
        fontSize: "0.78rem",
      }}
    >
      <input type="hidden" name="character_id" value={character.id} />
      <span style={{ color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.7rem" }}>
        편집
      </span>
      <NumField label="HP" name="hp" value={hp} max={character.hp_max} onChange={setHp} />
      <NumField label="MP" name="mp" value={mp} max={character.mp_max} onChange={setMp} />
      <NumField label="SAN" name="san" value={san} max={character.san_max} onChange={setSan} />
      <SubmitButton className="btn small" disabled={!dirty} pendingLabel="저장 중…" style={{ marginLeft: "auto" }}>
        저장
      </SubmitButton>
    </form>
  );
}

function NumField({
  label, name, value, max, onChange,
}: {
  label: string;
  name: string;
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        style={{ width: 22, height: 22, border: "1.5px solid var(--line)", background: "var(--bg-elev)", borderRadius: 3, cursor: "pointer" }}
        aria-label={`${label} 감소`}
      >−</button>
      <input
        type="number"
        name={name}
        value={value}
        min={0}
        max={max}
        onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value))))}
        style={{ width: 50, padding: "0.2rem 0.3rem", textAlign: "center", fontSize: "0.78rem" }}
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{ width: 22, height: 22, border: "1.5px solid var(--line)", background: "var(--bg-elev)", borderRadius: 3, cursor: "pointer" }}
        aria-label={`${label} 증가`}
      >+</button>
      <span style={{ color: "var(--ink-3)" }}>/ {max}</span>
    </label>
  );
}
