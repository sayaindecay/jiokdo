"use client";

import { useTransition } from "react";
import type { Character, CocSkill } from "@/lib/types";
import { rollCharacterCheckAction } from "@/app/actions";

export function SceneSkillBar({
  character, skills,
}: {
  character: Character | null;
  skills: CocSkill[];
}) {
  const [pending, start] = useTransition();

  const roll = (name: string, value: number) => {
    if (!character) return;
    const fd = new FormData();
    fd.set("character_id", String(character.id));
    fd.set("roll_kind", "cc");
    fd.set("skill_name", name);
    fd.set("skill_value", String(value));
    start(() => {
      rollCharacterCheckAction(fd);
    });
  };

  return (
    <div className="scene-hud">
      <div className="skills">
        {character && skills.length > 0 ? (
          skills.map((s) => (
            <button
              type="button"
              key={s.name}
              className="skill-chip"
              disabled={pending}
              onClick={() => roll(s.name, s.value)}
              title={`/cc ${s.name} ${s.value}`}
            >
              {s.name} <span className="val">{s.value}</span>
            </button>
          ))
        ) : (
          <span style={{ color: "rgba(245,243,238,0.5)", fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
            {character ? "기능 없음" : "캐릭터 미연결"}
          </span>
        )}
      </div>
      <div className="vitals">
        {character ? (
          <>
            <span>HP <b>{character.hp}/{character.hp_max}</b></span>
            <span>SAN <b>{character.san}/{character.san_max}</b></span>
          </>
        ) : (
          <span style={{ opacity: 0.5 }}>—</span>
        )}
      </div>
      <a href="#composer" className="speak">💬 말하기</a>
    </div>
  );
}
