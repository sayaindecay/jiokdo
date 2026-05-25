"use client";

import { useState } from "react";
import { changePasswordAction } from "@/app/actions";

export function ChangePasswordForm() {
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const matches = next.length > 0 && next === confirm;
  const tooShort = next.length > 0 && next.length < 6;

  return (
    <form action={changePasswordAction}>
      <label>현재 비밀번호</label>
      <input name="current_password" type="password" required maxLength={200} />

      <label style={{ marginTop: "0.6rem" }}>새 비밀번호 (최소 6자)</label>
      <input
        name="new_password"
        type="password"
        required
        minLength={6}
        maxLength={200}
        value={next}
        onChange={(e) => setNext(e.target.value)}
      />
      {tooShort ? (
        <p className="hint" style={{ color: "var(--accent)", marginTop: "0.2rem" }}>
          6자 이상으로 입력하세요.
        </p>
      ) : null}

      <label style={{ marginTop: "0.6rem" }}>새 비밀번호 확인</label>
      <input
        type="password"
        required
        maxLength={200}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        style={confirm.length > 0 && !matches ? { borderColor: "var(--accent)" } : undefined}
      />
      {confirm.length > 0 && !matches ? (
        <p className="hint" style={{ color: "var(--accent)", marginTop: "0.2rem" }}>
          두 비밀번호가 일치하지 않습니다.
        </p>
      ) : null}

      <p className="hint" style={{ marginTop: "0.55rem" }}>
        변경 시 다른 디바이스의 세션은 모두 로그아웃됩니다.
      </p>

      <div className="actions" style={{ marginTop: "0.75rem" }}>
        <button
          type="submit"
          className="btn primary"
          disabled={!matches || tooShort}
        >
          비밀번호 변경
        </button>
      </div>
    </form>
  );
}
