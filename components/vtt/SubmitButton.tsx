"use client";

import { useFormStatus } from "react-dom";

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  pendingLabel?: React.ReactNode;
};

/**
 * <form action={...}> 내부에서 사용. useFormStatus 의 pending 으로
 * 제출 중일 때 자동 disable + 라벨 변경. 연속 클릭 / 중복 제출 차단.
 */
export function SubmitButton({
  children,
  pendingLabel,
  disabled,
  className,
  ...rest
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      {...rest}
      type="submit"
      className={className}
      disabled={pending || disabled}
      aria-busy={pending || undefined}
    >
      {pending ? (pendingLabel ?? "처리 중…") : children}
    </button>
  );
}
