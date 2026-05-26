"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BestiaryEntry } from "@/lib/types";
import { createBestiaryAction, updateBestiaryAction } from "@/app/actions";
import { fileToResizedDataUrl } from "@/lib/image-resize";
import { FormError } from "./FormError";

const DEFAULT_CATEGORIES = [
  "신화 생물",
  "외계 종족",
  "사역수",
  "독립 종족",
  "인간 / NPC",
  "동물",
  "기타",
];

const MAX_IMAGE_BYTES = 10_000_000; // 10MB 원본까지 받고 클라이언트에서 리사이즈

export function BestiaryForm({
  initial,
  categories = [],
}: {
  initial?: BestiaryEntry;
  categories?: string[];
}) {
  const router = useRouter();
  const isEdit = !!initial;
  const action = isEdit ? updateBestiaryAction : createBestiaryAction;
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(initial?.category ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [imageErr, setImageErr] = useState<string | null>(null);

  const onPickImage = (file: File) => {
    setImageErr(null);
    if (!file.type.startsWith("image/")) {
      setImageErr("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageErr(`파일이 너무 큽니다. ${(file.size / 1024 / 1024).toFixed(1)}MB → 10MB 이하 권장.`);
      return;
    }
    fileToResizedDataUrl(file, { maxDim: 960, quality: 0.85 })
      .then((url) => setImageUrl(url))
      .catch(() => setImageErr("이미지를 처리하지 못했습니다."));
  };

  // 기본 추천 + DB 의 기존 카테고리 (중복 제거, 등록 순서 유지)
  const seen = new Set<string>();
  const chipCategories: string[] = [];
  for (const c of [...DEFAULT_CATEGORIES, ...categories]) {
    const trimmed = c.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    chipCategories.push(trimmed);
  }

  const submit = (fd: FormData) => {
    // 카테고리 chip 으로 선택된 값을 form data 에 반영 (controlled input 도 함께 동기화됨)
    setError(null);
    start(async () => {
      try {
        const res = await action(fd);
        if (res?.slug) {
          router.push(`/bestiary/${encodeURIComponent(res.slug)}`);
        } else {
          setError("저장은 되었으나 페이지 이동에 실패했습니다. 목록으로 돌아가서 확인하세요.");
        }
      } catch (e) {
        console.error("[BestiaryForm] save failed", e);
        setError(e instanceof Error ? e.message : "오류가 발생했습니다. 다시 시도해 주세요.");
      }
    });
  };

  return (
    <form className="form bestiary-form" action={submit}>
      {isEdit && initial ? (
        <input type="hidden" name="slug" value={initial.slug} />
      ) : null}

      <h3 style={{ marginBottom: "0.5rem" }}>이미지</h3>
      <div className="bf-image">
        <input type="hidden" name="image_url" value={imageUrl} />
        <div className="bf-image-preview">
          {imageUrl ? (
            <img src={imageUrl} alt="에너미 이미지 미리보기" />
          ) : (
            <div className="bf-image-empty" aria-hidden="true">
              <span className="bie-icon">🖼</span>
              <span className="bie-label">이미지 없음</span>
            </div>
          )}
        </div>
        <div className="bf-image-controls">
          <label className="bf-image-field">
            <span className="bf-image-label">파일 업로드 <span className="bf-hint">자동 리사이즈 · 최대 10MB · PNG/JPG/WebP</span></span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                if (f) onPickImage(f);
              }}
              disabled={pending}
            />
          </label>
          <label className="bf-image-field">
            <span className="bf-image-label">또는 이미지 URL</span>
            <input
              type="url"
              placeholder="https://..."
              value={imageUrl.startsWith("data:") ? "" : imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={pending}
            />
          </label>
          {imageUrl ? (
            <button
              type="button"
              className="btn ghost bf-image-clear"
              onClick={() => { setImageUrl(""); setImageErr(null); }}
              disabled={pending}
            >
              이미지 제거
            </button>
          ) : null}
          {imageErr ? <div className="bf-image-error">{imageErr}</div> : null}
        </div>
      </div>

      <h3 style={{ marginBottom: "0.5rem", marginTop: "1.25rem" }}>기본 정보</h3>
      <p className="bf-legend">
        <span className="bf-req">*</span> 표시는 필수 항목입니다.
      </p>
      <div className="row cols-2">
        <div>
          <label>이름 <span className="bf-req">*</span></label>
          <input
            name="name"
            required
            maxLength={80}
            defaultValue={initial?.name ?? ""}
            placeholder="예) 깊은 자"
          />
        </div>
        <div>
          <label>카테고리 <span className="bf-req">*</span></label>
          <div className="bf-cat-toggle" role="group" aria-label="카테고리 선택">
            {chipCategories.map((c) => {
              const active = category === c;
              return (
                <button
                  type="button"
                  key={c}
                  className={`bf-cat-chip${active ? " active" : ""}`}
                  onClick={() => setCategory(active ? "" : c)}
                  aria-pressed={active}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <input
            name="category"
            required
            maxLength={80}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="위에서 선택하거나 새로 입력"
          />
        </div>
      </div>

      <label>설명 / 키퍼 메모</label>
      <textarea
        name="description"
        maxLength={2000}
        defaultValue={initial?.description ?? ""}
        placeholder="생물의 외양, 행동 양식, 키퍼가 기억해 둘 만한 점"
      />

      <h3 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>능력치</h3>
      <div className="attr-grid">
        {(["str", "con", "siz", "dex", "int", "pow", "app", "edu"] as const).map((k) => (
          <label key={k}>
            {k.toUpperCase()}
            <input
              type="number"
              min={0}
              max={500}
              name={`attr_${k}`}
              defaultValue={initial?.attrs[k] != null ? String(initial.attrs[k]) : ""}
            />
          </label>
        ))}
        <label>
          HP <span className="bf-req">*</span>
          <input
            type="number"
            min={1}
            max={500}
            name="attr_hp"
            required
            defaultValue={initial?.attrs.hp != null ? String(initial.attrs.hp) : ""}
          />
        </label>
        <label>
          이동
          <input
            type="text"
            name="attr_move"
            defaultValue={initial?.attrs.move != null ? String(initial.attrs.move) : ""}
            placeholder="8/10 수영"
            style={{ width: "5.5rem" }}
          />
        </label>
        <label>
          체격
          <input
            type="number"
            name="attr_build"
            defaultValue={initial?.attrs.build != null ? String(initial.attrs.build) : ""}
          />
        </label>
        <label>
          DB
          <input
            type="text"
            name="attr_damage_bonus"
            defaultValue={initial?.attrs.damage_bonus ?? ""}
            placeholder="+1d6"
            style={{ width: "5rem" }}
          />
        </label>
      </div>

      <h3 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>
        공격 <span className="bf-req">*</span>
        <span className="bf-hint"> 최소 1개 (최대 5개)</span>
      </h3>
      {Array.from({ length: 5 }, (_, i) => {
        const a = initial?.attacks[i];
        const isFirst = i === 0;
        return (
          <div className="attack-row-input" key={i}>
            <input
              name={`attack_${i}_name`}
              defaultValue={a?.name ?? ""}
              maxLength={60}
              placeholder={isFirst ? "공격 이름 *" : "공격 이름"}
              required={isFirst && !isEdit}
            />
            <input
              name={`attack_${i}_skill`}
              type="number"
              min={0}
              max={100}
              defaultValue={a?.skill != null ? String(a.skill) : ""}
              placeholder={isFirst ? "% *" : "%"}
              required={isFirst && !isEdit}
            />
            <input
              name={`attack_${i}_damage`}
              defaultValue={a?.damage ?? ""}
              maxLength={80}
              placeholder={isFirst ? "1d6 + DB *" : "1d6 + DB"}
              required={isFirst && !isEdit}
            />
            <input
              name={`attack_${i}_note`}
              defaultValue={a?.note ?? ""}
              maxLength={120}
              placeholder="비고"
            />
          </div>
        );
      })}

      <h3 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>기타</h3>
      <div className="row cols-2">
        <div>
          <label>SAN 손실</label>
          <input
            name="sanity_loss"
            maxLength={24}
            defaultValue={initial?.sanity_loss ?? ""}
            placeholder="예) 0/1d6"
          />
        </div>
        <div>
          <label>출처</label>
          <input
            name="source"
            maxLength={80}
            defaultValue={initial?.source ?? ""}
            placeholder="예) 핸드북 p.217"
          />
        </div>
      </div>

      <FormError message={error} />

      <div className="bf-actions">
        <button type="submit" className="btn primary" disabled={pending}>
          {pending ? "저장 중…" : isEdit ? "변경 저장" : "등록"}
        </button>
        <Link
          href={isEdit && initial ? `/bestiary/${initial.slug}` : "/bestiary"}
          className="btn ghost"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
