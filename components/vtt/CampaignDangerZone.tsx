"use client";

import { useState } from "react";
import { deleteCampaignAction } from "@/app/actions";

export function CampaignDangerZone({
  campaignId,
  campaignName,
  counts,
}: {
  campaignId: number;
  campaignName: string;
  counts: { members: number; characters: number; sessions: number; clues: number; play_entries: number };
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === campaignName;

  const totalAffected = counts.members + counts.characters + counts.sessions + counts.clues + counts.play_entries;

  return (
    <section
      style={{
        marginTop: "2rem",
        padding: "1rem 1.2rem",
        border: "1.5px dashed var(--accent)",
        borderRadius: "var(--radius)",
        background: "var(--accent-soft)",
      }}
    >
      <h3 style={{ color: "var(--accent)", marginBottom: "0.4rem" }}>위험 영역 — 키퍼 전용</h3>

      {!open ? (
        <>
          <p style={{ color: "var(--ink-2)", fontSize: "0.88rem", margin: 0 }}>
            캠페인을 삭제하면 멤버, 캐릭터, 세션, 단서, 모든 플레이 로그가 영구히 사라집니다.
            플레이어들의 캐릭터 시트도 함께 삭제됩니다. 되돌릴 수 없습니다.
          </p>
          <div style={{ marginTop: "0.7rem" }}>
            <button
              type="button"
              className="btn"
              onClick={() => setOpen(true)}
              style={{ background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }}
            >
              캠페인 삭제…
            </button>
          </div>
        </>
      ) : (
        <form action={deleteCampaignAction}>
          <input type="hidden" name="campaign_id" value={campaignId} />

          <p style={{ color: "var(--ink-2)", fontSize: "0.9rem", margin: "0 0 0.6rem" }}>
            <b style={{ color: "var(--accent)" }}>{campaignName}</b> 을 삭제하면 다음이 함께 사라집니다:
          </p>
          <ul
            style={{
              margin: "0 0 0.8rem",
              padding: "0.5rem 0.8rem 0.5rem 1.6rem",
              background: "rgba(255,255,255,0.4)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.84rem",
              color: "var(--ink-2)",
            }}
          >
            <li>멤버 <b style={{ color: "var(--ink)" }}>{counts.members}</b>명</li>
            <li>캐릭터 시트 <b style={{ color: "var(--ink)" }}>{counts.characters}</b>개</li>
            <li>세션 <b style={{ color: "var(--ink)" }}>{counts.sessions}</b>개</li>
            <li>단서 <b style={{ color: "var(--ink)" }}>{counts.clues}</b>개</li>
            <li>플레이 로그 <b style={{ color: "var(--ink)" }}>{counts.play_entries}</b>건</li>
            {totalAffected === 0 ? (
              <li style={{ color: "var(--ink-3)" }}>(아직 비어 있는 캠페인입니다)</li>
            ) : null}
          </ul>

          <p style={{ color: "var(--ink-2)", fontSize: "0.88rem", margin: "0 0 0.5rem" }}>
            계속하려면 캠페인 이름{" "}
            <b style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{campaignName}</b>
            {" "}을 그대로 입력하세요.
          </p>
          <input
            name="confirm_name"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={campaignName}
            autoFocus
            maxLength={80}
            style={{ fontFamily: "var(--font-mono)" }}
          />

          <div className="actions" style={{ marginTop: "0.7rem", gap: "0.5rem" }}>
            <button
              type="submit"
              className="btn"
              disabled={!matches}
              style={{
                background: matches ? "var(--accent)" : undefined,
                borderColor: matches ? "var(--accent)" : undefined,
                color: matches ? "#fff" : undefined,
                opacity: matches ? 1 : 0.5,
              }}
            >
              영구 삭제
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setOpen(false);
                setTyped("");
              }}
            >
              취소
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
