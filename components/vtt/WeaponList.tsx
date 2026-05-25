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
      <div className="weapon-empty">
        <span className="we-icon" aria-hidden="true">⚔</span>
        <span>등록된 무기가 없습니다. 편집 페이지에서 추가하세요.</span>
      </div>
    );
  }

  return (
    <ul className="weapon-list">
      {weapons.map((w, i) => (
        <li className="weapon-card" key={i}>
          <div className="wc-head">
            <span className="wc-name">{w.name}</span>
            <span className="wc-skill" title="명중 기능치">{w.skill}%</span>
          </div>
          <div className="wc-meta">
            <span className="wc-meta-row">
              <span className="wc-meta-label">피해</span>
              <span className="wc-meta-val">{w.damage || "—"}</span>
            </span>
            {w.range ? (
              <span className="wc-meta-row">
                <span className="wc-meta-label">사거리</span>
                <span className="wc-meta-val">{w.range}</span>
              </span>
            ) : null}
            {w.attacks ? (
              <span className="wc-meta-row">
                <span className="wc-meta-label">공격</span>
                <span className="wc-meta-val">{w.attacks}</span>
              </span>
            ) : null}
          </div>
          {canRoll ? (
            <div className="wc-actions">
              <button
                type="button"
                className="wc-roll wc-roll-hit"
                onClick={() => rollSkill(w)}
                disabled={pending}
                title={`/cc ${w.name} ${w.skill}`}
              >
                명중 굴림
              </button>
              {w.damage ? (
                <button
                  type="button"
                  className="wc-roll wc-roll-dmg"
                  onClick={() => rollDamage(w)}
                  disabled={pending}
                  title={`/roll ${w.damage}`}
                >
                  피해 굴림
                </button>
              ) : null}
            </div>
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
