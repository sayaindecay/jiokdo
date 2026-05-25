"use client";

import { useTransition } from "react";
import { rollCharacterCheckAction } from "@/app/actions";

type Props = {
  characterId: number;
  skillName: string;
  skillValue: number;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

function scrollAndFlashRecentRolls() {
  if (typeof document === "undefined") return;
  const target = document.querySelector('[data-recent-rolls]');
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.add("flash-strong");
  setTimeout(() => target.classList.remove("flash-strong"), 1200);
}

export function RollButton({
  characterId, skillName, skillValue, children, className, disabled,
}: Props) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={disabled || pending}
      onClick={() => {
        const fd = new FormData();
        fd.set("character_id", String(characterId));
        fd.set("roll_kind", "cc");
        fd.set("skill_name", skillName);
        fd.set("skill_value", String(skillValue));
        start(async () => {
          await rollCharacterCheckAction(fd);
          scrollAndFlashRecentRolls();
        });
      }}
    >
      {pending ? "굴리는 중…" : children}
    </button>
  );
}
