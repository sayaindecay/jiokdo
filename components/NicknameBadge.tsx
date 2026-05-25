"use client";

import { useState } from "react";
import { clearNicknameAction, setNicknameAction } from "@/app/actions";

export function NicknameBadge({ nickname }: { nickname: string | null }) {
  const [open, setOpen] = useState(false);

  if (nickname) {
    return (
      <div className="nick-badge">
        <span className="nick-badge-inner">
          <span className="dot" />
          {nickname}
        </span>
        <form action={clearNicknameAction}>
          <button type="submit" className="link-btn" title="닉네임 변경">변경</button>
        </form>
      </div>
    );
  }

  return (
    <>
      <button className="btn small" onClick={() => setOpen(true)}>닉네임 설정</button>
      {open ? (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>닉네임 설정</h2>
            <p className="text-dim">캠페인 참여, 글 작성에 사용됩니다.</p>
            <form action={setNicknameAction}>
              <input
                name="nickname"
                placeholder="예) 이상한꿈"
                maxLength={24}
                autoFocus
                required
              />
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
