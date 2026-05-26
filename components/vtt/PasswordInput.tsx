"use client";

import { useState, useId } from "react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  name?: string;
};

export function PasswordInput(props: Props) {
  const { className, ...rest } = props;
  const [reveal, setReveal] = useState(false);
  const id = useId();
  const inputId = props.id ?? id;
  return (
    <span className={`password-input${className ? " " + className : ""}`}>
      <input
        {...rest}
        id={inputId}
        type={reveal ? "text" : "password"}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setReveal((v) => !v)}
        aria-label={reveal ? "비밀번호 숨기기" : "비밀번호 보이기"}
        aria-pressed={reveal}
        tabIndex={-1}
      >
        <span aria-hidden="true">{reveal ? "🙈" : "👁"}</span>
      </button>
    </span>
  );
}
