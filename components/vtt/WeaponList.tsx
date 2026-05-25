"use client";

import { useTransition } from "react";
import type { CocWeapon } from "@/lib/types";
import { rollCharacterCheckAction, rollGenericAction } from "@/app/actions";

export function WeaponList({
  characterId, weapons, canRoll,
}: {
  characterId: number;
  weapons: CocWeapon[];
  canRoll: boolean;
}) {
  const [pending, start] = useTransition();

  const rollSkill = (w: CocWeapon) => {
    if (!canRoll) return;
    const fd = new FormData();
    fd.set("character_id", String(characterId));
    fd.set("roll_kind", "cc");
    fd.set("skill_name", w.name);
    fd.set("skill_value", String(w.skill));
    start(async () => {
      await rollCharacterCheckAction(fd);
      flashRecent();
    });
  };

  const rollDamage = (w: CocWeapon) => {
    if (!canRoll) return;
    const fd = new FormData();
    fd.set("character_id", String(characterId));
    fd.set("expression", w.damage);
    start(async () => {
      await rollGenericAction(fd);
      flashRecent();
    });
  };

  if (weapons.length === 0) {
    return (
      <ul className="weapon-list">
        <li className="weapon-row" style={{ color: "var(--ink-3)", display: "block" }}>
          등록된 무기 없음 — 편집 페이지에서 추가하세요.
        </li>
      </ul>
    );
  }

  return (
    <ul className="weapon-list">
      {weapons.map((w, i) => (
        <li className="weapon-row" key={i}>
          <span className="w-name">{w.name}</span>
          <span className="w-skill">{w.skill}%</span>
          <span className="w-damage">{w.damage}</span>
          {canRoll ? (
            <span className="w-rolls">
              <button
                type="button"
                className="roll-btn"
                onClick={() => rollSkill(w)}
                disabled={pending}
                title={`/cc ${w.name} ${w.skill}`}
              >
                d100
              </button>
              {w.damage ? (
                <button
                  type="button"
                  className="roll-btn"
                  onClick={() => rollDamage(w)}
                  disabled={pending}
                  title={`/roll ${w.damage}`}
                  style={{ background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }}
                >
                  피해
                </button>
              ) : null}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function flashRecent() {
  if (typeof document === "undefined") return;
  const t = document.querySelector("[data-recent-rolls]");
  if (!t) return;
  t.scrollIntoView({ behavior: "smooth", block: "center" });
  t.classList.add("flash-strong");
  setTimeout(() => t.classList.remove("flash-strong"), 1200);
}
