"use client";

import { useTransition } from "react";
import type { CampaignStatus } from "@/lib/types";
import { setCampaignStatusAction } from "@/app/actions";

const OPTIONS: { value: CampaignStatus; label: string; description: string }[] = [
  { value: "active", label: "활성", description: "현재 진행 중인 캠페인" },
  { value: "dormant", label: "휴면", description: "잠시 멈춘 캠페인 — 데이터는 보존" },
  { value: "closed", label: "종료", description: "이야기가 끝난 캠페인" },
];

export function CampaignStatusToggle({
  campaignId,
  current,
}: {
  campaignId: number;
  current: CampaignStatus;
}) {
  const [pending, start] = useTransition();

  const setStatus = (next: CampaignStatus) => {
    if (next === current || pending) return;
    const fd = new FormData();
    fd.set("campaign_id", String(campaignId));
    fd.set("status", next);
    start(async () => {
      await setCampaignStatusAction(fd);
    });
  };

  return (
    <div className="status-toggle" role="radiogroup" aria-label="캠페인 상태">
      <div className="st-label">캠페인 상태</div>
      <div className="st-options">
        {OPTIONS.map((opt) => {
          const active = opt.value === current;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setStatus(opt.value)}
              disabled={pending}
              className={`st-option st-${opt.value}${active ? " is-active" : ""}`}
              title={opt.description}
            >
              <span className="st-dot" aria-hidden="true" />
              <span className="st-text">{opt.label}</span>
            </button>
          );
        })}
      </div>
      <p className="st-hint">
        {OPTIONS.find((o) => o.value === current)?.description}
        {pending ? " · 저장 중..." : ""}
      </p>
    </div>
  );
}
