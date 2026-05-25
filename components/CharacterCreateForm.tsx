"use client";

import { useState } from "react";
import { createCharacterAction } from "@/app/actions";

export function CharacterCreateForm({ campaignId }: { campaignId: number }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        className="btn ghost"
        style={{ marginTop: "0.7rem" }}
        onClick={() => setOpen(true)}
      >
        + 새 캐릭터
      </button>
    );
  }
  return (
    <form className="form" action={createCharacterAction} style={{ marginTop: "0.7rem" }}>
      <input type="hidden" name="campaign_id" value={campaignId} />
      <label style={{ fontSize: "0.78rem", color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        이름
      </label>
      <input name="name" required maxLength={40} placeholder="예) 이도윤" />
      <label style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        직업
      </label>
      <input name="occupation" maxLength={40} placeholder="예) 사립탐정" />

      <p style={{ fontSize: "0.82rem", color: "var(--ink-2)", marginTop: "0.85rem", marginBottom: "0.4rem", fontFamily: "var(--font-anno)" }}>
        능력치를 어떻게 정할까요?
      </p>
      <div className="actions" style={{ gap: "0.4rem", flexWrap: "wrap" }}>
        <button type="submit" className="btn primary" name="use_template" value="random">
          🎲 굴려서 생성
        </button>
        <button type="submit" className="btn ghost" name="use_template" value="">
          빈 캐릭터 (50 균등)
        </button>
        <button type="submit" className="btn ghost" name="use_template" value="1">
          샘플 시트 (허버트 웨스트)
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => setOpen(false)}
          style={{ marginLeft: "auto" }}
        >
          취소
        </button>
      </div>
      <p style={{ fontSize: "0.74rem", color: "var(--ink-3)", marginTop: "0.5rem", fontFamily: "var(--font-mono)" }}>
        🎲: STR/CON/DEX/APP/POW = 3d6 × 5, SIZ/INT/EDU = (2d6+6) × 5
      </p>
    </form>
  );
}
