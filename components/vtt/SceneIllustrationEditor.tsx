"use client";

import { useRef, useState, useTransition } from "react";
import { setCampaignIllustrationAction } from "@/app/actions";
import { fileToResizedDataUrl } from "@/lib/image-resize";

const MAX_FILE_BYTES = 10_000_000; // 10MB 원본까지 받고 클라이언트에서 리사이즈

export function SceneIllustrationEditor({
  campaignId,
  currentUrl,
}: {
  campaignId: number;
  currentUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(`파일이 너무 큽니다. ${(file.size / 1024 / 1024).toFixed(1)}MB → 10MB 이하 권장.`);
      return;
    }
    fileToResizedDataUrl(file, { maxDim: 1280, quality: 0.82 })
      .then((url) => { setPreview(url); setUrlInput(""); })
      .catch(() => setError("이미지를 처리하지 못했습니다."));
  };

  const submitUpload = () => {
    const value = preview ?? urlInput.trim();
    if (!value) {
      setError("URL을 입력하거나 파일을 선택하세요.");
      return;
    }
    const fd = new FormData();
    fd.set("campaign_id", String(campaignId));
    fd.set("illustration_url", value);
    start(async () => {
      try {
        await setCampaignIllustrationAction(fd);
        setOpen(false);
        setPreview(null);
        setUrlInput("");
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "저장 실패");
      }
    });
  };

  const removeIllustration = () => {
    if (!confirm("장면 일러스트를 제거할까요?")) return;
    const fd = new FormData();
    fd.set("campaign_id", String(campaignId));
    fd.set("illustration_url", "");
    start(async () => {
      try {
        await setCampaignIllustrationAction(fd);
        setOpen(false);
        setPreview(null);
        setUrlInput("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "제거 실패");
      }
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        className="scene-illust-trigger"
        onClick={() => setOpen(true)}
        title="장면 일러스트 업로드"
      >
        <span aria-hidden="true">📷</span>
        <span className="sit-label">
          {currentUrl ? "일러스트 변경" : "일러스트 업로드"}
        </span>
      </button>
    );
  }

  return (
    <div className="scene-illust-panel" role="dialog" aria-label="장면 일러스트 업로드">
      <div className="sip-head">
        <span className="sip-title">장면 일러스트</span>
        <button
          type="button"
          className="sip-close"
          onClick={() => { setOpen(false); setError(null); setPreview(null); }}
          aria-label="닫기"
        >
          ×
        </button>
      </div>

      <div className="sip-body">
        <label className="sip-field">
          <span className="sip-label">파일 업로드 (자동 리사이즈 · 최대 10MB · PNG/JPG/WebP)</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              if (f) onPickFile(f);
            }}
            disabled={pending}
          />
        </label>

        <div className="sip-or">— 또는 —</div>

        <label className="sip-field">
          <span className="sip-label">이미지 URL</span>
          <input
            type="url"
            placeholder="https://..."
            value={urlInput}
            onChange={(e) => { setUrlInput(e.target.value); setPreview(null); }}
            disabled={pending}
          />
        </label>

        {preview ? (
          <div className="sip-preview">
            <img src={preview} alt="미리보기" />
            <span className="sip-preview-tag">미리보기</span>
          </div>
        ) : null}

        {error ? <div className="sip-error">{error}</div> : null}
      </div>

      <div className="sip-actions">
        <button
          type="button"
          className="btn primary"
          onClick={submitUpload}
          disabled={pending || (!preview && !urlInput.trim())}
        >
          {pending ? "저장 중..." : "적용"}
        </button>
        {currentUrl ? (
          <button
            type="button"
            className="btn ghost danger"
            onClick={removeIllustration}
            disabled={pending}
          >
            제거
          </button>
        ) : null}
      </div>
    </div>
  );
}
