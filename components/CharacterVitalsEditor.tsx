"use client";

import { useState } from "react";
import type { Character } from "@/lib/types";
import { updateCharacterVitalsAction } from "@/app/actions";
import { CharacterSheetView } from "./CharacterSheetView";

export function CharacterVitalsEditor({ character }: { character: Character }) {
  const [hp, setHp] = useState(character.hp);
  const [mp, setMp] = useState(character.mp);
  const [san, setSan] = useState(character.san);

  return (
    <>
      <form
        action={updateCharacterVitalsAction}
        className="vitals-editor"
      >
        <input type="hidden" name="character_id" value={character.id} />
        <Field label="HP" name="hp" value={hp} max={character.hp_max} setter={setHp} />
        <Field label="MP" name="mp" value={mp} max={character.mp_max} setter={setMp} />
        <Field label="SAN" name="san" value={san} max={character.san_max} setter={setSan} />
        <button type="submit" className="btn">저장</button>
      </form>
      <CharacterSheetView character={{ ...character, hp, mp, san }} />
    </>
  );
}

function Field({
  label, name, value, max, setter,
}: { label: string; name: string; value: number; max: number; setter: (n: number) => void }) {
  return (
    <label className="vital-field">
      <span>{label}</span>
      <div className="vital-input">
        <button type="button" onClick={() => setter(Math.max(0, value - 1))}>-</button>
        <input
          type="number"
          name={name}
          value={value}
          min={0}
          max={max}
          onChange={(e) => setter(Math.max(0, Math.min(max, Number(e.target.value))))}
        />
        <button type="button" onClick={() => setter(Math.min(max, value + 1))}>+</button>
      </div>
      <span className="max-display">/ {max}</span>
    </label>
  );
}
