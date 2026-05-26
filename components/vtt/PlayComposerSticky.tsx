"use client";

import { useEffect, useRef, useState } from "react";
import { postPlayEntryAction } from "@/app/actions";

export function PlayComposerSticky({
  campaignId,
  characters,
  isKeeper,
}: {
  campaignId: number;
  characters: { id: number; name: string }[];
  isKeeper: boolean;
}) {
  const [kind, setKind] = useState<"dialogue" | "narration" | "system">("dialogue");
  const [characterId, setCharacterId] = useState<string>(
    characters[0] ? String(characters[0].id) : ""
  );
  const [collapsed, setCollapsed] = useState(true);
  const [pending, setPending] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // 펼쳤을 때 textarea 자동 포커스
  useEffect(() => {
    if (!collapsed) {
      setTimeout(() => taRef.current?.focus(), 100);
    }
  }, [collapsed]);

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
    <div className="play-composer-sticky" id="composer">
      <form
        className="composer compact"
        action={async (fd) => {
          setPending(true);
          try {
            await postPlayEntryAction(fd);
            if (taRef.current) taRef.current.value = "";
            setCollapsed(true);
          } finally {
            setPending(false);
          }
        }}
      >
        <input type="hidden" name="campaign_id" value={campaignId} />
        <input type="hidden" name="kind" value={kind} />
        {(characters.length === 0 || kind !== "dialogue") ? (
          <input type="hidden" name="character_id" value="" />
        ) : null}

        <div className="composer-bar">
          <div className="kind-picker">
            <KindBtn current={kind} value="dialogue" onClick={setKind}>발화</KindBtn>
            <KindBtn current={kind} value="narration" onClick={setKind}>내레이션</KindBtn>
            {isKeeper ? (
              <KindBtn current={kind} value="system" onClick={setKind}>시스템</KindBtn>
            ) : null}
          </div>

          {characters.length > 0 && kind === "dialogue" ? (
            <select
              name="character_id"
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value)}
              className="composer-char"
            >
              <option value="">— 캐릭터 없이 —</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          ) : null}

          {collapsed ? (
            <button
              type="button"
              className="composer-expand"
              onClick={() => setCollapsed(false)}
            >
              + 입력 펼치기
            </button>
          ) : (
            <button
              type="button"
              className="composer-expand"
              onClick={() => setCollapsed(true)}
            >
              − 접기
            </button>
          )}
        </div>

        {!collapsed ? (
          <>
            <div className="dice-toolbar">
              <button type="button" className="chip" onClick={() => insert("/roll 1d100")}>/roll 1d100</button>
              <button type="button" className="chip" onClick={() => insert("/roll 3d6")}>/roll 3d6</button>
              <button type="button" className="chip" onClick={() => insert("/cc 50")}>/cc 50</button>
              <button type="button" className="chip" onClick={() => insert("/cc 탐색 65")}>/cc 탐색 65</button>
            </div>

            <textarea
              ref={taRef}
              name="content"
              required
              maxLength={8000}
              rows={kind === "narration" ? 5 : 3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  const form = e.currentTarget.form;
                  if (form) form.requestSubmit();
                }
              }}
              placeholder={
                kind === "narration"
                  ? "장면을 묘사하세요. 같은 줄 끝에 /cc 탐색 65 처럼 굴림 명령을 붙일 수 있습니다."
                  : kind === "system"
                    ? "키퍼 공지나 룰 설명."
                    : "예) 책을 살핀다 /cc 도서관 60 — 텍스트 뒤에 굴림 명령을 붙이세요"
              }
            />

            <div className="composer-actions">
              <button type="submit" className="btn primary" disabled={pending}>
                {pending ? "올리는 중..." : "올리기"}
              </button>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  color: "var(--ink-3)",
                  letterSpacing: "0.02em",
                }}
              >
                ↵ 제출 · ⇧↵ 줄바꿈
              </span>
            </div>
          </>
        ) : null}
      </form>
    </div>
  );
}

function KindBtn({
  current, value, onClick, children,
}: {
  current: string;
  value: "dialogue" | "narration" | "system";
  onClick: (v: "dialogue" | "narration" | "system") => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`kind-pill ${current === value ? "active" : ""}`}
      onClick={() => onClick(value)}
    >
      {children}
    </button>
  );
}
