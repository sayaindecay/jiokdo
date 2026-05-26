"use client";

import { useState } from "react";
import { CampaignForms } from "@/components/CampaignForms";

export function CampaignFormsCollapsible({
  initialTab,
  initialCode,
}: {
  initialTab?: "create" | "join";
  initialCode?: string;
}) {
  // 초대 코드로 진입한 경우엔 펼친 상태로 시작
  const [open, setOpen] = useState(!!initialCode);
  if (!open) {
    return (
      <div className="cl-forms-collapsed">
        <button
          type="button"
          className="cl-forms-expand"
          onClick={() => setOpen(true)}
        >
          + 새 캠페인 / 초대 코드
        </button>
      </div>
    );
  }
  return (
    <div className="cl-forms-open">
      <button
        type="button"
        className="cl-forms-collapse"
        onClick={() => setOpen(false)}
        title="접기"
        aria-label="새 캠페인 / 초대 코드 폼 접기"
      >
        − 접기
      </button>
      <CampaignForms initialTab={initialTab} initialCode={initialCode} />
    </div>
  );
}
