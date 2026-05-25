"use client";

import { useState } from "react";
import type { CocSkill, CocSkillGroup } from "@/lib/types";
import { rollCharacterCheckAction } from "@/app/actions";

const GROUPS: { id: "all" | CocSkillGroup; label: string }[] = [
  { id: "all", label: "전부" },
  { id: "combat", label: "전투" },
  { id: "investigation", label: "조사" },
  { id: "social", label: "사회" },
  { id: "academic", label: "학문" },
];

export function SkillList({
  characterId, skills, canRoll,
}: {
  characterId: number;
  skills: CocSkill[];
  canRoll: boolean;
}) {
  const [active, setActive] = useState<"all" | CocSkillGroup>("all");
  const filtered = active === "all" ? skills : skills.filter((s) => s.group === active);
  const usedCount = skills.filter((s) => s.used).length;

  return (
    <>
      <h3>
        기능 / Skills{" "}
        <span style={{ fontWeight: 500, color: "var(--ink-3)", marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
          {skills.length}개{usedCount > 0 ? ` · ●=${usedCount}` : ""}
        </span>
      </h3>
      <div className="dice-toolbar" style={{ marginBottom: "0.85rem" }}>
        {GROUPS.map((g) => (
          <button
            type="button"
            key={g.id}
            className="chip"
            onClick={() => setActive(g.id)}
            style={
              active === g.id
                ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }
                : undefined
            }
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="skill-list">
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", padding: "1rem", textAlign: "center", color: "var(--ink-3)", fontFamily: "var(--font-anno)" }}>
            이 카테고리의 기능이 없습니다.
          </div>
        ) : (
          filtered.map((s) => (
            <button
              type="button"
              key={s.name}
              className={`skill-row${s.used ? " used" : ""}${canRoll ? " rollable" : ""}`}
              disabled={!canRoll}
              onClick={async () => {
                if (!canRoll) return;
                const fd = new FormData();
                fd.set("character_id", String(characterId));
                fd.set("roll_kind", "cc");
                fd.set("skill_name", s.name);
                fd.set("skill_value", String(s.value));
                await rollCharacterCheckAction(fd);
                if (typeof document !== "undefined") {
                  const target = document.querySelector('[data-recent-rolls]');
                  if (target) {
                    target.scrollIntoView({ behavior: "smooth", block: "center" });
                    target.classList.add("flash-strong");
                    setTimeout(() => target.classList.remove("flash-strong"), 1200);
                  }
                }
              }}
              title={canRoll ? `/cc ${s.name} ${s.value} 굴리기` : "본인 캐릭터만 굴릴 수 있습니다"}
            >
              <span className="name">{s.name}</span>
              <span className="val">{s.value}</span>
              {canRoll ? <span className="roll-hint" aria-hidden="true">d100 →</span> : null}
            </button>
          ))
        )}
      </div>
    </>
  );
}
