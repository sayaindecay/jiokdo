"use client";

import { useRef, useState } from "react";
import { createCommentAction } from "@/app/actions";

export function CommentForm({ postId }: { postId: number }) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [pending, setPending] = useState(false);

  const insert = (snippet: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(end);
    const prefix = before.length > 0 && !before.endsWith("\n") ? "\n" : "";
    const suffix = after.length > 0 && !after.startsWith("\n") ? "\n" : "";
    ta.value = `${before}${prefix}${snippet}${suffix}${after}`;
    const pos = (before + prefix + snippet).length;
    ta.setSelectionRange(pos, pos);
    ta.focus();
  };

  return (
    <form
      className="form"
      action={async (fd) => {
        setPending(true);
        try {
          await createCommentAction(fd);
          if (taRef.current) taRef.current.value = "";
        } finally {
          setPending(false);
        }
      }}
    >
      <input type="hidden" name="post_id" value={postId} />
      <div className="row">
        <div style={{ maxWidth: "12rem" }}>
          <label>닉네임</label>
          <input
            name="nickname"
            placeholder="익명의 탐사자"
            maxLength={24}
            defaultValue={typeof window !== "undefined" ? localStorage.getItem("nick") ?? "" : ""}
            onBlur={(e) => {
              if (typeof window !== "undefined") localStorage.setItem("nick", e.target.value);
            }}
          />
        </div>
      </div>
      <div className="dice-toolbar">
        <button type="button" className="chip" onClick={() => insert("/roll 1d100")}>
          /roll 1d100
        </button>
        <button type="button" className="chip" onClick={() => insert("/cc 50")}>
          /cc 50
        </button>
        <button type="button" className="chip" onClick={() => insert("/cc 탐색 60")}>
          /cc 탐색 60
        </button>
      </div>
      <textarea
        ref={taRef}
        name="content"
        required
        maxLength={8000}
        placeholder="댓글을 입력하세요. 다이스도 굴릴 수 있습니다."
      />
      <div className="actions">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "올리는 중..." : "댓글 달기"}
        </button>
      </div>
    </form>
  );
}
