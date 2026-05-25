"use client";

import { useState } from "react";
import { setNicknameAction } from "@/app/actions";

export function NicknameInline({ redirect }: { redirect: string }) {
  const [value, setValue] = useState("");
  return (
    <div className="dash-hero" style={{ marginBottom: "1rem" }}>
      <div className="label">먼저 닉네임이 필요합니다</div>
      <div className="campaign" style={{ marginTop: "0.5rem" }}>
        캠페인을 만들고 참여하려면 부를 이름을 알려주세요.
      </div>
      <div className="sub">가입은 없습니다. 이 이름은 캠페인 멤버 / 글 작성자 표시에 쓰입니다.</div>
      <form
        action={setNicknameAction}
        style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", maxWidth: 460 }}
      >
        <input type="hidden" name="redirect" value={redirect} />
        <input
          name="nickname"
          required
          maxLength={24}
          autoFocus
          placeholder="예) 이상한꿈"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ flex: 1, fontFamily: "var(--font-mono)" }}
        />
        <button type="submit" className="btn primary" disabled={!value.trim()}>
          시작하기 →
        </button>
      </form>
    </div>
  );
}
