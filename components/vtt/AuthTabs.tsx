"use client";

import { useState } from "react";
import { loginAction, signupAction } from "@/app/actions";

export function AuthTabs({
  initialTab,
  redirectTo,
}: {
  initialTab: "signup" | "login";
  redirectTo: string;
}) {
  const [tab, setTab] = useState<"signup" | "login">(initialTab);

  return (
    <div className="form-tabs">
      <div className="tab-bar">
        <button
          type="button"
          className={`tab ${tab === "signup" ? "active" : ""}`}
          onClick={() => setTab("signup")}
        >
          가입
        </button>
        <button
          type="button"
          className={`tab ${tab === "login" ? "active" : ""}`}
          onClick={() => setTab("login")}
        >
          로그인
        </button>
      </div>

      {tab === "signup" ? (
        <form className="form" action={signupAction}>
          <input type="hidden" name="redirect" value={redirectTo} />
          <label>닉네임</label>
          <input
            name="nickname"
            required
            maxLength={24}
            autoFocus
            placeholder="예) 이상한꿈"
            style={{ fontFamily: "var(--font-mono)" }}
          />
          <p className="hint" style={{ marginTop: "0.25rem", marginBottom: "0.6rem" }}>
            2–24자, 한글·영문·숫자·_·- 가능
          </p>
          <label>비밀번호</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            maxLength={200}
            placeholder="최소 6자"
          />
          <p className="hint" style={{ marginTop: "0.25rem" }}>
            잊으면 복구할 수 없습니다.
          </p>
          <div className="actions" style={{ marginTop: "0.85rem" }}>
            <button type="submit" className="btn primary" style={{ width: "100%" }}>
              계정 만들기
            </button>
          </div>
        </form>
      ) : (
        <form className="form" action={loginAction}>
          <input type="hidden" name="redirect" value={redirectTo} />
          <label>닉네임</label>
          <input
            name="nickname"
            required
            maxLength={32}
            autoFocus
            style={{ fontFamily: "var(--font-mono)" }}
          />
          <label style={{ marginTop: "0.6rem" }}>비밀번호</label>
          <input
            name="password"
            type="password"
            required
            maxLength={200}
          />
          <div className="actions" style={{ marginTop: "0.85rem" }}>
            <button type="submit" className="btn primary" style={{ width: "100%" }}>
              로그인
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
