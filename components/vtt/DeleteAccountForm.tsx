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
      <div className="acc-danger-body">
        <p className="acc-danger-text">
          현재 키퍼로 운영 중인 캠페인이{" "}
          <b className="acc-danger-num">{keeperCampaignCount}개</b> 남아 있습니다.
          협업자들의 데이터 보호를 위해 먼저 캠페인을 정리해야 합니다.
        </p>
        <p className="acc-danger-hint">
          각 캠페인 대시보드 하단의 <b>위험 영역</b>에서 삭제할 수 있습니다.
        </p>
        <div className="acc-form-actions">
          <button type="button" className="btn" disabled>
            계정 삭제 (차단됨)
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="acc-danger-body">
        <p className="acc-danger-text">
          계정을 삭제하면 닉네임이 풀려나며 다시 가입할 수는 있지만, 과거 활동 로그(굴림·발화·캐릭터 등)는
          그대로 남습니다. 동일 닉네임으로 재가입하면 그 데이터에 다시 접근할 수 있습니다.
        </p>
        <div className="acc-form-actions">
          <button
            type="button"
            className="btn danger"
            onClick={() => setOpen(true)}
          >
            계정 삭제…
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={deleteAccountAction} className="acc-form acc-danger-form">
      <p className="acc-danger-text">
        <b className="acc-danger-num">{nickname}</b> 계정을 삭제하려면 비밀번호와 닉네임을 다시 입력하세요.
      </p>

      <label className="acc-form-field">
        <span className="acc-form-label">비밀번호</span>
        <input name="password" type="password" required maxLength={200} autoFocus />
      </label>

      <label className="acc-form-field">
        <span className="acc-form-label">
          닉네임 확인 — <code className="acc-form-code">{nickname}</code>
        </span>
        <input
          name="confirm_nickname"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={nickname}
          maxLength={32}
          className="acc-form-mono"
        />
      </label>

      <div className="acc-form-actions">
        <button
          type="submit"
          className="btn danger"
          disabled={!matches}
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
