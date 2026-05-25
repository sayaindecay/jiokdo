"use client";

import { useState, useTransition } from "react";
import { updateCampaignProfileAction } from "@/app/actions";

export function CampaignProfileEditor({
  campaignId,
  campaignNum,
  system,
  initialName,
  initialDescription,
}: {
  campaignId: number;
  campaignNum: string;
  system: string;
  initialName: string;
  initialDescription: string;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("캠페인 이름은 비울 수 없습니다");
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.set("campaign_id", String(campaignId));
    fd.set("name", name.trim());
    fd.set("description", description);
    start(async () => {
      try {
        await updateCampaignProfileAction(fd);
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "저장 실패");
      }
    });
  };

  const cancel = () => {
    setName(initialName);
    setDescription(initialDescription);
    setError(null);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="cd-head-text">
        <div className="cd-eyebrow">
          캠페인 №{campaignNum} · {system.toUpperCase()}
        </div>
        <div className="cd-title-row">
          <h1 className="cd-title">{initialName}</h1>
          <button
            type="button"
            className="btn ghost cd-edit-btn"
            onClick={() => setEditing(true)}
            aria-label="캠페인 제목·설명 편집"
          >
            ✎ 편집
          </button>
        </div>
        {initialDescription ? (
          <p className="cd-description">{initialDescription}</p>
        ) : (
          <p className="cd-description cd-description-empty">
            설명이 아직 비어 있습니다.
          </p>
        )}
      </div>
    );
  }

  return (
    <form className="cd-head-text cd-edit-form" onSubmit={submit}>
      <div className="cd-eyebrow">
        캠페인 №{campaignNum} · {system.toUpperCase()} · 편집 중
      </div>
      <label className="cd-edit-field">
        <span className="cd-edit-label">캠페인 이름</span>
        <input
          type="text"
          className="cd-edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
          autoFocus
        />
      </label>
      <label className="cd-edit-field">
        <span className="cd-edit-label">설명</span>
        <textarea
          className="cd-edit-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={600}
          rows={4}
          placeholder="사건의 배경, 분위기, 첫 인상을 짧게 적어 두세요."
        />
        <span className="cd-edit-count">{description.length} / 600</span>
      </label>
      {error ? <div className="cd-edit-error">{error}</div> : null}
      <div className="cd-edit-actions">
        <button type="submit" className="btn primary" disabled={pending}>
          {pending ? "저장 중..." : "저장"}
        </button>
        <button type="button" className="btn ghost" onClick={cancel} disabled={pending}>
          취소
        </button>
      </div>
    </form>
  );
}
