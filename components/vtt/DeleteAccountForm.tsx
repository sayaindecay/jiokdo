"use client";

import { useState } from "react";
import { deleteAccountAction } from "@/app/actions";

export function DeleteAccountForm({
  nickname,
  keeperCampaignCount,
}: {
  nickname: string;
  keeperCampaignCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === nickname;
  const blocked = keeperCampaignCount > 0;

  if (blocked) {
    return (
      <>
        <p style={{ color: "var(--ink-2)", fontSize: "0.88rem", margin: 0 }}>
          현재 키퍼로 운영 중인 캠페인이{" "}
          <b style={{ color: "var(--accent)" }}>{keeperCampaignCount}개</b> 남아 있습니다.
          협업자들의 데이터 보호를 위해 먼저 캠페인을 정리해야 합니다.
        </p>
        <p style={{ color: "var(--ink-3)", fontSize: "0.82rem", marginTop: "0.4rem", fontFamily: "var(--font-anno)" }}>
          각 캠페인 대시보드 하단의 <b style={{ color: "var(--ink)" }}>위험 영역</b>에서 삭제하세요.
        </p>
        <div className="actions" style={{ marginTop: "0.7rem" }}>
          <button type="button" className="btn" disabled>
            계정 삭제 (차단됨)
          </button>
        </div>
      </>
    );
  }

  if (!open) {
    return (
      <>
        <p style={{ color: "var(--ink-2)", fontSize: "0.88rem", margin: 0 }}>
          계정을 삭제하면 닉네임이 풀려나며 다시 가입할 수는 있지만, 과거 활동 로그(굴림·발화·캐릭터 등)는
          그대로 남습니다. 동일 닉네임으로 재가입하면 그 데이터에 다시 접근할 수 있습니다.
        </p>
        <div className="actions" style={{ marginTop: "0.7rem" }}>
          <button
            type="button"
            className="btn"
            onClick={() => setOpen(true)}
            style={{ background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }}
          >
            계정 삭제…
          </button>
        </div>
      </>
    );
  }

  return (
    <form action={deleteAccountAction}>
      <p style={{ color: "var(--ink-2)", fontSize: "0.88rem", margin: "0 0 0.6rem" }}>
        <b style={{ color: "var(--accent)" }}>{nickname}</b> 계정을 삭제하려면 비밀번호와 닉네임을 다시 입력하세요.
      </p>

      <label>비밀번호</label>
      <input name="password" type="password" required maxLength={200} autoFocus />

      <label style={{ marginTop: "0.6rem" }}>
        닉네임 확인 — <b style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{nickname}</b>
      </label>
      <input
        name="confirm_nickname"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={nickname}
        maxLength={32}
        style={{ fontFamily: "var(--font-mono)" }}
      />

      <div className="actions" style={{ marginTop: "0.75rem", gap: "0.5rem" }}>
        <button
          type="submit"
          className="btn"
          disabled={!matches}
          style={{
            background: matches ? "var(--accent)" : undefined,
            borderColor: matches ? "var(--accent)" : undefined,
            color: matches ? "#fff" : undefined,
            opacity: matches ? 1 : 0.5,
          }}
        >
          영구 삭제
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
        >
          취소
        </button>
      </div>
    </form>
  );
}
