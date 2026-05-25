"use client";

import { useRef, useState } from "react";
import { createPostAction } from "@/app/actions";

export function PostForm({ boardSlug }: { boardSlug: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [skill, setSkill] = useState(50);
  const [skillName, setSkillName] = useState("");
  const [pending, setPending] = useState(false);

  const insert = (snippet: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(end);
    const prefix = before.length > 0 && !before.endsWith("\n") ? "\n" : "";
    const suffix = after.length > 0 && !after.startsWith("\n") ? "\n" : "";
    const text = `${before}${prefix}${snippet}${suffix}${after}`;
    ta.value = text;
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
          await createPostAction(fd);
        } finally {
          setPending(false);
        }
      }}
    >
      <input type="hidden" name="board_slug" value={boardSlug} />
      <div className="row">
        <div>
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
        <div style={{ flex: 3 }}>
          <label>제목</label>
          <input name="title" required maxLength={120} placeholder="제목" />
        </div>
      </div>
      <div>
        <label>내용</label>
        <div className="dice-toolbar">
          <button type="button" className="chip" onClick={() => insert("/roll 1d100")}>
            /roll 1d100
          </button>
          <button type="button" className="chip" onClick={() => insert("/roll 1d20")}>
            /roll 1d20
          </button>
          <button type="button" className="chip" onClick={() => insert("/roll 3d6")}>
            /roll 3d6
          </button>
          <span className="chip chip-inline">
            /cc
            <input
              type="text"
              placeholder="기능명"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              style={{ width: "5rem", padding: "0.2rem 0.35rem", fontSize: "0.78rem" }}
            />
            <input
              type="number"
              min={1}
              max={100}
              value={skill}
              onChange={(e) => setSkill(Number(e.target.value))}
            />
            <button
              type="button"
              className="chip"
              style={{ padding: "0.15rem 0.5rem" }}
              onClick={() =>
                insert(skillName.trim() ? `/cc ${skillName.trim()} ${skill}` : `/cc ${skill}`)
              }
            >
              삽입
            </button>
          </span>
        </div>
        <textarea
          ref={textareaRef}
          name="content"
          required
          maxLength={20000}
          placeholder={"내용을 입력하세요.\n다이스 명령은 한 줄에 한 개씩 작성하세요.\n예) /cc 탐색 65"}
        />
        <div className="hint">
          명령 한 줄로 입력 — <code>/roll NdM[±K]</code> · <code>/cc [이름] 기능치</code>
        </div>
      </div>
      <div className="actions">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "올리는 중..." : "글쓰기"}
        </button>
      </div>
    </form>
  );
}
