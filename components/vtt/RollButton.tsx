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
        start(() => {
          rollCharacterCheckAction(fd);
        });
      }}
    >
      {pending ? "굴리는 중…" : children}
    </button>
  );
}
