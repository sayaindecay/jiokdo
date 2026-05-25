"use client";

import { useState } from "react";
import { createCampaignAction, joinCampaignAction } from "@/app/actions";

export function CampaignForms() {
  const [tab, setTab] = useState<"create" | "join">("create");
  return (
    <div className="form-tabs">
      <div className="tab-bar">
        <button
          className={`tab ${tab === "create" ? "active" : ""}`}
          onClick={() => setTab("create")}
        >
          새 캠페인
        </button>
        <button
          className={`tab ${tab === "join" ? "active" : ""}`}
          onClick={() => setTab("join")}
        >
          초대 코드로 참여
        </button>
      </div>

      {tab === "create" ? (
        <form className="form" action={createCampaignAction}>
          <label>캠페인 이름</label>
          <input name="name" required maxLength={80} placeholder="예) 인스머스의 그림자" />
          <label style={{ marginTop: "0.7rem" }}>설명 (선택)</label>
          <textarea name="description" maxLength={600} placeholder="배경, 분위기, 진행 빈도 등" />
          <div className="actions">
            <button type="submit" className="btn">만들기</button>
          </div>
        </form>
      ) : (
        <form className="form" action={joinCampaignAction}>
          <label>초대 코드</label>
          <input name="code" required maxLength={16} placeholder="예) ABCDEF" style={{ textTransform: "uppercase" }} />
          <div className="actions">
            <button type="submit" className="btn">참여</button>
          </div>
        </form>
      )}
    </div>
  );
}
