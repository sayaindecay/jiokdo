"use client";

import { useState, useTransition } from "react";
import type { Clue } from "@/lib/types";
import { setCampaignScenePinAction } from "@/app/actions";

const MAX_PIN_LEN = 400;

export function SceneSpotlight({
  campaignId,
  scenePin,
  clues,
  isKeeper,
}: {
  campaignId: number;
  scenePin: string | null;
  clues: Clue[];
  isKeeper: boolean;
}) {
  const [pinText, setPinText] = useState(scenePin ?? "");
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const unresolved = clues.filter((c) => !c.resolved).slice(0, 4);

  const save = () => {
    const fd = new FormData();
    fd.set("campaign_id", String(campaignId));
    fd.set("scene_pin", pinText);
    setError(null);
    start(async () => {
      try {
        await setCampaignScenePinAction(fd);
        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장 실패");
      }
    });
  };

  const cancel = () => {
    setPinText(scenePin ?? "");
    setError(null);
    setEditing(false);
  };

  // 키퍼가 아니고 핀도 비고 미해결 단서도 없으면 띠 자체 숨김
  if (!isKeeper && !scenePin && unresolved.length === 0) return null;

  return (
    <div className="scene-spotlight">
      <div className="ss-pin">
        <div className="ss-pin-head">
          <span className="ss-pin-eyebrow">📌 현재 장면</span>
          {isKeeper && !editing ? (
            <button
              type="button"
              className="ss-pin-edit"
              onClick={() => setEditing(true)}
              aria-label="장면 핀 편집"
            >
              {scenePin ? "편집" : "+ 핀 작성"}
            </button>
          ) : null}
        </div>
        {editing ? (
          <div className="ss-pin-edit-form">
            <textarea
              value={pinText}
              onChange={(e) => setPinText(e.target.value.slice(0, MAX_PIN_LEN))}
              placeholder="안개 낀 부두. 가로등이 깜빡인다. 멀리서 끌리는 소리…"
              rows={2}
              maxLength={MAX_PIN_LEN}
              autoFocus
              disabled={pending}
            />
            <div className="ss-pin-edit-actions">
              <button
                type="button"
                className="btn primary"
                onClick={save}
                disabled={pending}
              >
                {pending ? "저장…" : "저장"}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={cancel}
                disabled={pending}
              >
                취소
              </button>
              <span className="ss-pin-counter">
                {pinText.length} / {MAX_PIN_LEN}
              </span>
            </div>
            {error ? <div className="ss-pin-error">{error}</div> : null}
          </div>
        ) : scenePin ? (
          <p className="ss-pin-text">{scenePin}</p>
        ) : (
          <p className="ss-pin-empty">
            {isKeeper
              ? "현재 장면을 한두 문장으로 핀하면 모든 플레이어가 같이 봅니다."
              : "키퍼가 아직 장면을 핀하지 않았습니다."}
          </p>
        )}
      </div>

      {unresolved.length > 0 ? (
        <div className="ss-clues">
          <div className="ss-clues-head">
            <span className="ss-clues-eyebrow">🔎 추적 중</span>
            <span className="ss-clues-count">{unresolved.length}건</span>
          </div>
          <ul className="ss-clue-strip">
            {unresolved.map((c) => (
              <li key={c.id} className="ss-clue-chip" title={c.body || c.title}>
                <span className="sscc-dot" aria-hidden="true">·</span>
                <span className="sscc-title">{c.title}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
