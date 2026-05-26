"use client";

import { useState } from "react";
import { LEVEL_LABEL } from "@/lib/dice";
import { formatTime } from "@/lib/format";
import { speakerHueStyle } from "@/lib/hue";
import type { PlayEntry } from "@/lib/types";
import { EntryEditActions } from "./EntryEditActions";

function kindLabel(k: string): string {
  if (k === "narration") return "내레이션";
  if (k === "system") return "시스템";
  return "발화";
}

export function PostBoard({
  entries,
  keeperNick,
  currentNick,
  campaignId,
}: {
  entries: PlayEntry[];
  keeperNick: string;
  currentNick: string | null;
  campaignId: number;
}) {
  const [openId, setOpenId] = useState<number | null>(null);
  return (
    <ul className="post-board">
      {entries.map((e) => {
        const author = e.character_name || e.nickname;
        const isKeeperEntry = e.nickname === keeperNick;
        const isAuthor = currentNick != null && currentNick === e.nickname;
        const isKeeperViewer = currentNick != null && currentNick === keeperNick;
        const firstText = e.segments.find((s) => s.type === "text") as
          | { type: "text"; value: string } | undefined;
        const fallbackTitle = firstText
          ? firstText.value.split(/\n/)[0].slice(0, 60) || "(빈 글)"
          : "(굴림만 있는 글)";
        const title = e.title || fallbackTitle;
        const hasDice = e.segments.some((s) => s.type === "dice");
        const isOpen = openId === e.id;
        return (
          <li
            key={e.id}
            className={`post-board-row kind-${e.kind}${isKeeperEntry ? " is-keeper" : ""}${isOpen ? " is-open" : ""}`}
            style={speakerHueStyle(author)}
          >
            <button
              type="button"
              className="pb-link"
              onClick={() => setOpenId(isOpen ? null : e.id)}
              aria-expanded={isOpen}
              aria-controls={`pb-body-${e.id}`}
            >
              <span className={`kind-tag kind-${e.kind}`}>{kindLabel(e.kind)}</span>
              <span className="pb-title">{title}</span>
              {hasDice ? <span className="pb-dice-mark" title="다이스 굴림 포함">⌬</span> : null}
              <span className="pb-author">
                {isKeeperEntry ? <span aria-hidden="true" className="ks-crown">♛ </span> : null}
                {author}
              </span>
              <span className="pb-time">{formatTime(e.created_at)}</span>
              <span className="pb-toggle" aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
            </button>
            {isOpen ? (
              <div className="pb-body" id={`pb-body-${e.id}`}>
                <div className="pb-body-content">
                  {e.segments.length === 0 ? (
                    <p className="pb-empty">(내용 없음)</p>
                  ) : (
                    e.segments.map((seg, i) => {
                      if (seg.type === "text") {
                        return <p key={i} className="pb-text">{seg.value}</p>;
                      }
                      const r = seg.result;
                      if (r.kind === "cc") {
                        return (
                          <div key={i} className={`pb-dice cc level ${r.level}`}>
                            <span className="pb-dice-icon" aria-hidden="true">⌬</span>
                            <span className="pb-dice-expr">
                              {r.name ? `${r.name} (${r.skill})` : `1d100 ≤ ${r.skill}`}
                            </span>
                            <span className="pb-dice-arrow" aria-hidden="true">→</span>
                            <span className="pb-dice-total">{r.roll}</span>
                            <span className={`pb-dice-level level ${r.level}`}>
                              {LEVEL_LABEL[r.level]}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div key={i} className="pb-dice plain">
                          <span className="pb-dice-icon" aria-hidden="true">⌬</span>
                          <span className="pb-dice-expr">{r.notation}</span>
                          <span className="pb-dice-arrow" aria-hidden="true">=</span>
                          <span className="pb-dice-total">{r.total}</span>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="pb-body-foot">
                  <a
                    href={`/campaigns/${campaignId}/play/${e.id}`}
                    className="pb-permalink"
                    title="이 글의 고유 링크"
                  >
                    🔗 링크
                  </a>
                  {isAuthor ? (
                    <EntryEditActions
                      entryId={e.id}
                      initialTitle={e.title || fallbackTitle}
                      initialKind={e.kind}
                      isKeeper={isKeeperViewer}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
