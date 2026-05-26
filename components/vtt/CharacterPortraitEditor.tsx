"use client";

import { useRef, useState, useTransition } from "react";
import { setCharacterPortraitAction } from "@/app/actions";
import { fileToResizedDataUrl } from "@/lib/image-resize";
import { PortraitSilhouette } from "./Illustrations";

const MAX_FILE_BYTES = 8_000_000; // 8MB 원본까지 받고 클라이언트에서 리사이즈

export function CharacterPortraitEditor({
  characterId,
  currentUrl,
}: {
  characterId: number;
  currentUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(`파일이 너무 큽니다. ${(file.size / 1024 / 1024).toFixed(1)}MB → 8MB 이하 권장.`);
      return;
    }
    fileToResizedDataUrl(file, { maxDim: 640, quality: 0.85 })
      .then((url) => { setPreview(url); setUrlInput(""); })
      .catch(() => setError("이미지를 처리하지 못했습니다."));
  };

  const submit = () => {
    const value = preview ?? urlInput.trim();
    if (!value) {
      setError("URL을 입력하거나 파일을 선택하세요.");
      return;
    }
    const fd = new FormData();
    fd.set("character_id", String(characterId));
    fd.set("portrait_url", value);
    start(async () => {
      try {
        await setCharacterPortraitAction(fd);
        setOpen(false);
        setPreview(null);
        setUrlInput("");
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "저장 실패");
      }
    });
  };

  const remove = () => {
    if (!confirm("프로필 사진을 제거할까요?")) return;
    const fd = new FormData();
    fd.set("character_id", String(characterId));
    fd.set("portrait_url", "");
    start(async () => {
      try {
        await setCharacterPortraitAction(fd);
        setOpen(false);
        setPreview(null);
        setUrlInput("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "제거 실패");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        className={`portrait-editor-trigger${currentUrl ? " has-image" : ""}`}
        onClick={() => setOpen(true)}
        title="프로필 사진 업로드"
        aria-label="프로필 사진 업로드"
      >
        {currentUrl ? (
          <img src={currentUrl} alt="프로필" />
        ) : (
          <PortraitSilhouette />
        )}
        <span className="pet-overlay" aria-hidden="true">
          <span className="pet-icon">📷</span>
          <span className="pet-label">{currentUrl ? "변경" : "업로드"}</span>
        </span>
      </button>

      {open ? (
        <div className="portrait-editor-backdrop" role="dialog" aria-label="프로필 사진 업로드">
          <div className="portrait-editor-panel">
            <div className="pep-head">
              <span className="pep-title">프로필 사진</span>
              <button
                type="button"
                className="pep-close"
                onClick={() => { setOpen(false); setError(null); setPreview(null); }}
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <div className="pep-body">
              <label className="pep-field">
                <span className="pep-label">파일 업로드 (자동 리사이즈 · 최대 8MB · PNG/JPG/WebP)</span>
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

              <div className="pep-or">— 또는 —</div>

              <label className="pep-field">
                <span className="pep-label">이미지 URL</span>
                <input
                  type="url"
                  placeholder="https://..."
                  value={urlInput}
                  onChange={(e) => { setUrlInput(e.target.value); setPreview(null); }}
                  disabled={pending}
                />
              </label>

              {preview ? (
                <div className="pep-preview">
                  <img src={preview} alt="미리보기" />
                  <span className="pep-preview-tag">미리보기</span>
                </div>
              ) : null}

              {error ? <div className="pep-error">{error}</div> : null}
            </div>

            <div className="pep-actions">
              <button
                type="button"
                className="btn primary"
                onClick={submit}
                disabled={pending || (!preview && !urlInput.trim())}
              >
                {pending ? "저장 중..." : "적용"}
              </button>
              {currentUrl ? (
                <button
                  type="button"
                  className="btn ghost danger"
                  onClick={remove}
                  disabled={pending}
                >
                  제거
                </button>
              ) : null}
              <button
                type="button"
                className="btn ghost"
                onClick={() => { setOpen(false); setError(null); setPreview(null); }}
                disabled={pending}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
