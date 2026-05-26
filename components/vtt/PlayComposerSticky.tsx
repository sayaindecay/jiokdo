"use client";

import { useEffect, useRef, useState } from "react";
import { postPlayEntryAction } from "@/app/actions";
import { CommandHelp } from "./CommandHelp";

export function PlayComposerSticky({
  campaignId,
  characters,
  isKeeper,
  isMyTurn = false,
  hasEntries = false,
}: {
  campaignId: number;
  characters: { id: number; name: string }[];
  isKeeper: boolean;
  isMyTurn?: boolean;
  hasEntries?: boolean;
}) {
  const [kind, setKind] = useState<"dialogue" | "narration" | "system">(
    isKeeper && !hasEntries ? "narration" : "dialogue"
  );
  const [characterId, setCharacterId] = useState<string>(
    characters[0] ? String(characters[0].id) : ""
  );
  // 기본 펼침 — 첫 사용자 발견성 우선
  const [collapsed, setCollapsed] = useState(false);
  const [pending, setPending] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!collapsed) {
      // 사용자가 다른 입력에 포커스 중이 아니면 textarea 로
      const t = document.activeElement;
      if (!t || (t.tagName !== "INPUT" && t.tagName !== "TEXTAREA")) {
        setTimeout(() => taRef.current?.focus(), 100);
      }
    }
  }, [collapsed]);

  const insert = (snippet: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(end);
    const prefix = before.length > 0 && !before.endsWith("\n") && !before.endsWith(" ") ? " " : "";
    ta.value = `${before}${prefix}${snippet}${after}`;
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

        {isMyTurn && !hasEntries === false ? (
          <div className="composer-nudge" aria-live="polite">
            <span aria-hidden="true">↘</span>
            <span>방금 다른 사람이 글을 올렸습니다. 응답하시겠습니까?</span>
          </div>
        ) : null}
        {!hasEntries ? (
          <div className="composer-nudge first">
            <span aria-hidden="true">✦</span>
            <span>
              {isKeeper
                ? "첫 묘사로 장면을 시작하세요. 내레이션으로 분위기를 잡으면 플레이어가 응답합니다."
                : "첫 글을 남기세요. 내 캐릭터의 행동·대사를 짧게."}
            </span>
          </div>
        ) : null}

        <div className="composer-bar">
          <div className="kind-picker" role="radiogroup" aria-label="글 종류">
            <KindBtn current={kind} value="dialogue" onClick={setKind} icon="💬" subtitle="내 캐릭터의 말·행동">
              발화
            </KindBtn>
            <KindBtn current={kind} value="narration" onClick={setKind} icon="🎬" subtitle={isKeeper ? "장면·NPC 묘사" : "(주로 키퍼)"} dim={!isKeeper}>
              내레이션
            </KindBtn>
            {isKeeper ? (
              <KindBtn current={kind} value="system" onClick={setKind} icon="⚙" subtitle="룰·공지">
                시스템
              </KindBtn>
            ) : null}
          </div>

          {characters.length > 0 && kind === "dialogue" ? (
            <select
              name="character_id"
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value)}
              className="composer-char"
              aria-label="발화 캐릭터"
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
              title="composer 접기"
            >
              − 접기
            </button>
          )}
          <CommandHelp />
        </div>

        {!collapsed ? (
          <>
            <div className="dice-toolbar" aria-label="자주 쓰는 명령">
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
              <span className="composer-shortcut-hint">
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
  current, value, onClick, icon, subtitle, dim, children,
}: {
  current: string;
  value: "dialogue" | "narration" | "system";
  onClick: (v: "dialogue" | "narration" | "system") => void;
  icon: string;
  subtitle: string;
  dim?: boolean;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      className={`kind-pill ${active ? "active" : ""}${dim ? " dim" : ""}`}
      onClick={() => onClick(value)}
      role="radio"
      aria-checked={active}
      title={subtitle}
    >
      <span className="kp-icon" aria-hidden="true">{icon}</span>
      <span className="kp-label">{children}</span>
      <span className="kp-sub" aria-hidden="true">{subtitle}</span>
    </button>
  );
}
