"use client";

import { useState } from "react";
import { createCharacterAction } from "@/app/actions";

export function CharacterCreateForm({ campaignId }: { campaignId: number }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button className="btn ghost" style={{ marginTop: "0.7rem" }} onClick={() => setOpen(true)}>
        + 새 캐릭터
      </button>
    );
  }
  return (
    <form className="form" action={createCharacterAction} style={{ marginTop: "0.7rem" }}>
      <input type="hidden" name="campaign_id" value={campaignId} />
      <label>이름</label>
      <input name="name" required maxLength={40} placeholder="캐릭터 이름" />
      <label style={{ marginTop: "0.5rem" }}>직업 (빈 캐릭터 생성 시)</label>
      <input name="occupation" maxLength={40} placeholder="예) 사립탐정" />
      <div className="actions" style={{ gap: "0.5rem" }}>
        <button type="submit" className="btn" name="use_template" value="0">빈 캐릭터</button>
        <button type="submit" className="btn ghost" name="use_template" value="1">샘플 시트로</button>
        <button type="button" className="btn ghost" onClick={() => setOpen(false)}>취소</button>
      </div>
    </form>
  );
}
