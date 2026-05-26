"use client";

import { useState } from "react";
import { createCharacterAction } from "@/app/actions";
import { SubmitButton } from "@/components/vtt/SubmitButton";

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
      <div className="cc-options">
        <label className="cc-option cc-option-primary">
          <SubmitButton className="btn primary" name="use_template" value="random" pendingLabel="생성 중…">
            🎲 굴려서 생성
          </SubmitButton>
          <span className="cc-option-hint">기본 추천. 3d6×5 / 2d6+6×5 정통 방식으로 능력치를 굴립니다.</span>
        </label>
        <label className="cc-option">
          <SubmitButton className="btn ghost" name="use_template" value="" pendingLabel="생성 중…">
            빈 캐릭터
          </SubmitButton>
          <span className="cc-option-hint">모든 능력치 50 으로 시작. 편집 페이지에서 수동으로 정하고 싶을 때.</span>
        </label>
        <label className="cc-option">
          <SubmitButton className="btn ghost" name="use_template" value="1" pendingLabel="생성 중…">
            샘플 시트
          </SubmitButton>
          <span className="cc-option-hint">사전 작성된 의사 NPC(허버트 웨스트). 룰을 빠르게 체험할 때.</span>
        </label>
      </div>
      <div style={{ marginTop: "0.6rem", display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="btn ghost"
          onClick={() => setOpen(false)}
        >
          취소
        </button>
      </div>
    </form>
  );
}
