"use client";

import { Fragment, useState } from "react";
import type { CocSkill, CocSkillGroup } from "@/lib/types";
import { rollCharacterCheckAction } from "@/app/actions";

const GROUPS: { id: "all" | CocSkillGroup; label: string }[] = [
  { id: "all", label: "전부" },
  { id: "combat", label: "전투" },
  { id: "investigation", label: "조사" },
  { id: "social", label: "사회" },
  { id: "academic", label: "학문" },
];

const GROUP_LABELS: Record<CocSkillGroup, string> = {
  combat: "전투",
  investigation: "조사",
  social: "사회",
  academic: "학문",
  other: "기타",
};

const GROUP_ORDER: CocSkillGroup[] = [
  "combat", "investigation", "social", "academic", "other",
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

  // 그룹별 정렬 (전부 보기 시)
  const grouped: Record<CocSkillGroup, CocSkill[]> = {
    combat: [], investigation: [], social: [], academic: [], other: [],
  };
  for (const s of filtered) {
    const g = (s.group ?? "other") as CocSkillGroup;
    grouped[g].push(s);
  }

  const roll = async (s: CocSkill) => {
    if (!canRoll) return;
    const fd = new FormData();
    fd.set("character_id", String(characterId));
    fd.set("roll_kind", "cc");
    fd.set("skill_name", s.name);
    fd.set("skill_value", String(s.value));
    await rollCharacterCheckAction(fd);
    if (typeof document !== "undefined") {
      const target = document.querySelector("[data-recent-rolls]");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("flash-strong");
        setTimeout(() => target.classList.remove("flash-strong"), 1200);
      }
    }
  };

  const renderSkill = (s: CocSkill) => (
    <button
      type="button"
      key={s.name}
      className={`skill-row${s.used ? " used" : ""}${canRoll ? " rollable" : ""}`}
      disabled={!canRoll}
      onClick={() => roll(s)}
      title={canRoll ? `/cc ${s.name} ${s.value} 굴리기` : "본인 캐릭터만 굴릴 수 있습니다"}
    >
      <span className="name">{s.name}</span>
      <span className="val">{s.value}</span>
    </button>
  );

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

      {filtered.length === 0 ? (
        <div
          style={{
            gridColumn: "1 / -1",
            padding: "1rem",
            textAlign: "center",
            color: "var(--ink-3)",
            fontFamily: "var(--font-anno)",
          }}
        >
          이 카테고리의 기능이 없습니다.
        </div>
      ) : active === "all" ? (
        // 전부 보기 — 그룹 헤더로 시각 분할 (7.5)
        <>
          {GROUP_ORDER.map((g) => {
            const list = grouped[g];
            if (list.length === 0) return null;
            return (
              <Fragment key={g}>
                <div className="skill-group-head">
                  <span className="label">{GROUP_LABELS[g]}</span>
                  <span className="num">{list.length}개</span>
                </div>
                <div className="skill-list">{list.map(renderSkill)}</div>
              </Fragment>
            );
          })}
        </>
      ) : (
        // 특정 카테고리 보기 — 단일 그리드
        <div className="skill-list">{filtered.map(renderSkill)}</div>
      )}
    </>
  );
}
