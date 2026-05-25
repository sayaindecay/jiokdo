"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { logoutAction, setNicknameAction } from "@/app/actions";

export function NicknameBadge({
  nickname,
  authenticated,
}: {
  nickname: string | null;
  authenticated: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // 정식 로그인 사용자
  if (authenticated && nickname) {
    return (
      <div className="nick-badge" aria-label={`로그인: ${nickname}`}>
        <Link
          href="/account"
          className="nick-badge-inner"
          title="내 계정"
          style={{ color: "var(--ink)" }}
        >
          <span className="dot" aria-hidden="true" />
          {nickname}
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="link-btn" title="로그아웃">로그아웃</button>
        </form>
      </div>
    );
  }

  // legacy 닉네임 cookie 만 있는 경우 — 가입 유도
  if (nickname) {
    return (
      <div
        className="nick-badge"
        style={{ borderStyle: "dashed", borderColor: "var(--accent)" }}
        aria-label={`임시 닉네임: ${nickname}`}
      >
        <span className="nick-badge-inner">
          <span className="dot" aria-hidden="true" style={{ background: "var(--accent)" }} />
          {nickname}
        </span>
        <Link
          href={`/login?tab=signup&redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/campaigns")}`}
          className="link-btn"
          title="이 닉네임을 본인 계정으로 등록"
        >
          가입
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/campaigns")}`}
        className="btn small"
      >
        로그인 / 가입
      </Link>
      {/* legacy 인라인 닉네임 모달은 비공개적으로 유지 (시드 / 임시 용도) */}
      {open ? (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>임시 닉네임</h2>
            <p className="text-dim">계정 없이 잠시 둘러보기. 정식 계정으로 옮기려면 동일 닉네임으로 가입하세요.</p>
            <form action={setNicknameAction}>
              <input name="nickname" maxLength={24} required autoFocus />
              <input type="hidden" name="redirect" value={typeof window !== "undefined" ? window.location.pathname : "/"} />
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setOpen(false)}>취소</button>
                <button type="submit" className="btn">설정</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
