"use client";

import { useActionState, useState } from "react";
import { loginAction, signupAction } from "@/app/actions";
import { FormError } from "./FormError";
import { PasswordInput } from "./PasswordInput";

async function wrapAction(
  action: (fd: FormData) => Promise<void>,
  fd: FormData
): Promise<string | null> {
  try {
    await action(fd);
    return null;
  } catch (e) {
    // Next.js redirect 는 NEXT_REDIRECT 라는 에러를 throw 하지만 React가
    // 자동으로 잡아주므로 여기까지 도달하지 않는다.
    if (e instanceof Error) return e.message;
    return "오류가 발생했습니다";
  }
}

export function AuthTabs({
  initialTab,
  redirectTo,
}: {
  initialTab: "signup" | "login";
  redirectTo: string;
}) {
  const [tab, setTab] = useState<"signup" | "login">(initialTab);

  const [signupErr, signupForm, signupPending] = useActionState<string | null, FormData>(
    (_prev, fd) => wrapAction(signupAction, fd),
    null
  );
  const [loginErr, loginForm, loginPending] = useActionState<string | null, FormData>(
    (_prev, fd) => wrapAction(loginAction, fd),
    null
  );

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
        <form className="form" action={signupForm}>
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
          <PasswordInput
            name="password"
            required
            minLength={6}
            maxLength={200}
            placeholder="최소 6자"
          />
          <p className="hint" style={{ marginTop: "0.25rem" }}>
            잊으면 복구할 수 없습니다.
          </p>
          <FormError message={signupErr} />
          <div className="actions" style={{ marginTop: "0.85rem" }}>
            <button
              type="submit"
              className="btn primary"
              style={{ width: "100%" }}
              disabled={signupPending}
            >
              {signupPending ? "가입 중…" : "계정 만들기"}
            </button>
          </div>
        </form>
      ) : (
        <form className="form" action={loginForm}>
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
          <PasswordInput
            name="password"
            required
            maxLength={200}
          />
          <FormError message={loginErr} />
          <div className="actions" style={{ marginTop: "0.85rem" }}>
            <button
              type="submit"
              className="btn primary"
              style={{ width: "100%" }}
              disabled={loginPending}
            >
              {loginPending ? "확인 중…" : "로그인"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
