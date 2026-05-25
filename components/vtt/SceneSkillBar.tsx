"use client";

import { useState, useTransition } from "react";
import type { Character, CocSkill } from "@/lib/types";
import { rollCharacterCheckAction } from "@/app/actions";

export function SceneSkillBar({
  character, skills,
}: {
  character: Character | null;
  skills: CocSkill[];
}) {
  const [pending, start] = useTransition();
  // 굴린 횟수 클라이언트 카운트 (세션 동안만)
  const [rollCounts, setRollCounts] = useState<Record<string, number>>({});

  const roll = (name: string, value: number) => {
    if (!character) return;
    const fd = new FormData();
    fd.set("character_id", String(character.id));
    fd.set("roll_kind", "cc");
    fd.set("skill_name", name);
    fd.set("skill_value", String(value));
    setRollCounts((m) => ({ ...m, [name]: (m[name] ?? 0) + 1 }));
    start(async () => {
      await rollCharacterCheckAction(fd);
    });
  };

  // 굴림 많은 순 → 정렬 + 굴림 0 인 것은 used/value 기준
  const sorted = [...skills].sort((a, b) => {
    const ca = rollCounts[a.name] ?? 0;
    const cb = rollCounts[b.name] ?? 0;
    if (cb !== ca) return cb - ca;
    return Number(!!b.used) - Number(!!a.used) || b.value - a.value;
  });

  return (
    <div className="scene-hud">
      <div className="skills">
        {character && sorted.length > 0 ? (
          sorted.map((s) => {
            const count = rollCounts[s.name] ?? 0;
            return (
              <button
                type="button"
                key={s.name}
                className="skill-chip"
                disabled={pending}
                onClick={() => roll(s.name, s.value)}
                title={`/cc ${s.name} ${s.value}`}
              >
                {s.name}{" "}
                <span className="val">{s.value}</span>
                {count > 0 ? (
                  <span className="chip-count" aria-label={`${count}회 굴림`}>×{count}</span>
                ) : null}
              </button>
            );
          })
        ) : (
          <span
            style={{
              color: "rgba(245,243,238,0.5)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.78rem",
            }}
          >
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
      <a href="#composer" className="speak" onClick={focusComposer}>💬 말하기</a>
    </div>
  );
}

function focusComposer(e: React.MouseEvent<HTMLAnchorElement>) {
  // 5.3 "💬 말하기" → composer 의 textarea 로 직접 포커스 이동
  if (typeof document === "undefined") return;
  const ta = document.querySelector<HTMLTextAreaElement>(
    '#composer textarea[name="content"]'
  );
  if (ta) {
    e.preventDefault();
    ta.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => ta.focus(), 320);
  }
}
