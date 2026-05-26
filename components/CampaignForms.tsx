"use client";

import { useActionState, useState } from "react";
import { createCampaignAction, joinCampaignAction } from "@/app/actions";
import { FormError } from "./vtt/FormError";

async function wrap(action: (fd: FormData) => Promise<void>, fd: FormData) {
  try {
    await action(fd);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "오류가 발생했습니다";
  }
}

export function CampaignForms({
  initialTab = "create",
  initialCode = "",
}: {
  initialTab?: "create" | "join";
  initialCode?: string;
}) {
  const [tab, setTab] = useState<"create" | "join">(initialTab);
  const [code, setCode] = useState(initialCode);
  const [createErr, createForm, createPending] = useActionState<string | null, FormData>(
    (_p, fd) => wrap(createCampaignAction, fd),
    null
  );
  const [joinErr, joinForm, joinPending] = useActionState<string | null, FormData>(
    (_p, fd) => wrap(joinCampaignAction, fd),
    null
  );

  return (
    <div className="form-tabs">
      <div className="tab-bar">
        <button
          type="button"
          className={`tab ${tab === "create" ? "active" : ""}`}
          onClick={() => setTab("create")}
        >
          새 캠페인
        </button>
        <button
          type="button"
          className={`tab ${tab === "join" ? "active" : ""}`}
          onClick={() => setTab("join")}
        >
          초대 코드로 참여
        </button>
      </div>

      {tab === "create" ? (
        <form className="form" action={createForm}>
          <label>캠페인 이름</label>
          <input name="name" required maxLength={80} placeholder="예) 인스머스의 그림자" />
          <label style={{ marginTop: "0.7rem" }}>설명 (선택)</label>
          <textarea name="description" maxLength={600} placeholder="배경, 분위기, 진행 빈도 등" />
          <FormError message={createErr} />
          <div className="actions">
            <button type="submit" className="btn" disabled={createPending}>
              {createPending ? "만드는 중…" : "만들기"}
            </button>
          </div>
        </form>
      ) : (
        <form className="form" action={joinForm}>
          <label>초대 코드</label>
          <input
            name="code"
            required
            maxLength={16}
            placeholder="예) ABCDEF"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ textTransform: "uppercase" }}
            autoFocus={initialCode.length > 0}
          />
          <FormError message={joinErr} />
          <div className="actions">
            <button type="submit" className="btn" disabled={joinPending}>
              {joinPending ? "참여 중…" : "참여"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
