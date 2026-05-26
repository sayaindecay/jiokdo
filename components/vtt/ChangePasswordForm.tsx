"use client";

import { useState } from "react";
import { changePasswordAction } from "@/app/actions";
import { PasswordInput } from "./PasswordInput";
import { SubmitButton } from "./SubmitButton";

export function ChangePasswordForm() {
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const matches = next.length > 0 && next === confirm;
  const tooShort = next.length > 0 && next.length < 6;

  return (
    <form action={changePasswordAction} className="acc-form">
      <label className="acc-form-field">
        <span className="acc-form-label">현재 비밀번호</span>
        <PasswordInput name="current_password" required maxLength={200} />
      </label>

      <label className="acc-form-field">
        <span className="acc-form-label">새 비밀번호 <span className="acc-form-hint">최소 6자</span></span>
        <PasswordInput
          name="new_password"
          required
          minLength={6}
          maxLength={200}
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        {tooShort ? (
          <span className="acc-form-error">6자 이상으로 입력하세요.</span>
        ) : null}
      </label>

      <label className="acc-form-field">
        <span className="acc-form-label">새 비밀번호 확인</span>
        <PasswordInput
          required
          maxLength={200}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={confirm.length > 0 && !matches ? "acc-form-mismatch" : undefined}
        />
        {confirm.length > 0 && !matches ? (
          <span className="acc-form-error">두 비밀번호가 일치하지 않습니다.</span>
        ) : null}
      </label>

      <p className="acc-form-note">
        변경 시 다른 디바이스의 세션은 모두 로그아웃됩니다.
      </p>

      <div className="acc-form-actions">
        <SubmitButton
          className="btn primary"
          disabled={!matches || tooShort}
          pendingLabel="변경 중…"
        >
          비밀번호 변경
        </SubmitButton>
      </div>
    </form>
  );
}
