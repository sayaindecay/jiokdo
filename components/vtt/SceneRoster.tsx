"use client";

import { useState, useTransition } from "react";
import type { CampaignMember, Character, Clue } from "@/lib/types";
import { createClueAction, deleteClueAction, toggleClueAction } from "@/app/actions";

export function SceneRoster({
  members, characters, myNick,
}: {
  members: CampaignMember[];
  characters: Character[];
  myNick: string | null;
}) {
  return (
    <div className="scene-roster">
      <div className="head">참여자 · {members.length}명</div>
      {members.map((m) => {
        const ownChar = characters.find((c) => c.owner_nick === m.nickname);
        const isMe = myNick === m.nickname;
        return (
          <div className="member" key={m.nickname}>
            <div className="av">{m.nickname.slice(0, 1)}</div>
            <div>
              <div className="name">
                @{m.nickname}
                {isMe ? " (당신)" : null}
              </div>
              <div className="info">
                {m.role === "keeper" ? (
                  "GM · 운영 중"
                ) : ownChar ? (
                  <>
                    {ownChar.name} · SAN {ownChar.san}
                    {ownChar.san < 30 ? (
                      <span aria-label="위험" title="SAN 30 미만 — 위험 상태"> ⚠</span>
                    ) : null}
                    {" · HP "}{ownChar.hp}
                  </>
                ) : (
                  "캐릭터 미생성"
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CluesPanel({
  clues,
  campaignId,
  isKeeper,
}: {
  clues: Clue[];
  campaignId: number;
  isKeeper: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  const unresolved = clues.filter((c) => !c.resolved);
  const resolved = clues.filter((c) => c.resolved);

  const submitNew = () => {
    if (!title.trim()) return;
    const fd = new FormData();
    fd.set("campaign_id", String(campaignId));
    fd.set("title", title);
    fd.set("body", body);
    start(async () => {
      try {
        await createClueAction(fd);
        setTitle("");
        setBody("");
        setOpen(false);
      } catch {
        // ignore — keep form open
      }
    });
  };

  const toggle = (clueId: number, resolved: boolean) => {
    const fd = new FormData();
    fd.set("campaign_id", String(campaignId));
    fd.set("clue_id", String(clueId));
    fd.set("resolved", resolved ? "1" : "0");
    start(async () => { await toggleClueAction(fd); });
  };

  const remove = (clueId: number) => {
    if (!confirm("이 단서를 삭제할까요?")) return;
    const fd = new FormData();
    fd.set("campaign_id", String(campaignId));
    fd.set("clue_id", String(clueId));
    start(async () => { await deleteClueAction(fd); });
  };

  return (
    <div className="scene-roster clues-panel">
      <div className="head clues-head">
        <span>단서 · {clues.length}개</span>
        {isKeeper && !open ? (
          <button
            type="button"
            className="clues-add-btn"
            onClick={() => setOpen(true)}
            title="단서 추가"
          >
            + 추가
          </button>
        ) : null}
      </div>

      {open && isKeeper ? (
        <div className="clue-form">
          <label className="cf-label">제목</label>
          <input
            type="text"
            className="cf-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="단서 제목 — 예) 도서관 지하의 봉인된 문"
            maxLength={120}
            autoFocus
            disabled={pending}
          />
          <label className="cf-label">내용 <span className="cf-label-sub">선택</span></label>
          <textarea
            className="cf-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={"단서를 발견한 정황·관련된 NPC·다음 단서 힌트.\n줄바꿈으로 단락을 나눌 수 있습니다."}
            maxLength={1200}
            rows={5}
            disabled={pending}
          />
          <div className="cf-meta">
            <span className="cf-counter">{body.length} / 1200</span>
          </div>
          <div className="clue-form-actions">
            <button
              type="button"
              className="btn primary"
              onClick={submitNew}
              disabled={pending || !title.trim()}
            >
              {pending ? "저장…" : "추가"}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => { setOpen(false); setTitle(""); setBody(""); }}
              disabled={pending}
            >
              취소
            </button>
          </div>
        </div>
      ) : null}

      {clues.length === 0 && !open ? (
        <div className="member clue-empty">
          <div className="name">
            {isKeeper ? "아직 등록된 단서가 없습니다." : "단서가 공개되면 여기에 표시됩니다."}
          </div>
        </div>
      ) : null}

      {unresolved.length > 0 ? (
        <>
          {unresolved.map((c) => (
            <ClueRow
              key={c.id}
              clue={c}
              isKeeper={isKeeper}
              onToggle={() => toggle(c.id, true)}
              onDelete={() => remove(c.id)}
            />
          ))}
        </>
      ) : null}

      {resolved.length > 0 ? (
        <details className="clues-resolved">
          <summary>해결된 단서 {resolved.length}개</summary>
          {resolved.map((c) => (
            <ClueRow
              key={c.id}
              clue={c}
              isKeeper={isKeeper}
              onToggle={() => toggle(c.id, false)}
              onDelete={() => remove(c.id)}
            />
          ))}
        </details>
      ) : null}
    </div>
  );
}

function ClueRow({
  clue, isKeeper, onToggle, onDelete,
}: {
  clue: Clue;
  isKeeper: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`member clue-row${clue.resolved ? " is-resolved" : ""}`}>
      <button
        type="button"
        className="clue-check"
        onClick={onToggle}
        disabled={!isKeeper}
        title={isKeeper ? (clue.resolved ? "미해결로 되돌리기" : "해결로 표시") : "키퍼만 표시 가능"}
        aria-label={clue.resolved ? "해결됨" : "미해결"}
      >
        {clue.resolved ? "✓" : "·"}
      </button>
      <div className="clue-text">
        <div className="name">📌 {clue.title}</div>
        {clue.body ? <div className="info">{clue.body}</div> : null}
      </div>
      {isKeeper ? (
        <button
          type="button"
          className="clue-delete"
          onClick={onDelete}
          title="단서 삭제"
          aria-label="삭제"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
