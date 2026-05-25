"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BestiaryEntry } from "@/lib/types";
import { createBestiaryAction, updateBestiaryAction } from "@/app/actions";
import { FormError } from "./FormError";

type ActionResult = { ok: boolean; slug?: string; error?: string };

async function wrap(
  action: (fd: FormData) => Promise<{ slug: string }>,
  fd: FormData
): Promise<ActionResult> {
  try {
    const res = await action(fd);
    return { ok: true, slug: res.slug };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "오류" };
  }
}

const DEFAULT_CATEGORIES = [
  "신화 생물",
  "외계 종족",
  "사역수",
  "독립 종족",
  "인간 / NPC",
  "동물",
  "기타",
];

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
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    (_p, fd) => wrap(action, fd),
    null
  );
  const [category, setCategory] = useState(initial?.category ?? "");
  const err = state?.error ?? null;

  // 저장 성공 시 상세 페이지로 이동 — 서버 액션 안에서 redirect() 하던 것을
  // 클라이언트에서 router.push 로 대체 (useActionState 환경에서 더 안정적).
  useEffect(() => {
    if (state?.ok && state.slug) {
      router.push(`/bestiary/${encodeURIComponent(state.slug)}`);
    }
  }, [state, router]);

  // 기본 추천 + DB 의 기존 카테고리 (중복 제거, 등록 순서 유지)
  const seen = new Set<string>();
  const chipCategories: string[] = [];
  for (const c of [...DEFAULT_CATEGORIES, ...categories]) {
    const trimmed = c.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    chipCategories.push(trimmed);
  }

  return (
    <form className="form bestiary-form" action={formAction}>
      {isEdit && initial ? (
        <input type="hidden" name="slug" value={initial.slug} />
      ) : null}

      <h3 style={{ marginBottom: "0.5rem" }}>기본 정보</h3>
      <div className="row cols-2">
        <div>
          <label>이름</label>
          <input name="name" required maxLength={80} defaultValue={initial?.name ?? ""} placeholder="예) 깊은 자" />
        </div>
        <div>
          <label>카테고리</label>
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
        {(["str", "con", "siz", "dex", "int", "pow", "app", "edu", "hp"] as const).map((k) => (
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

      <h3 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>공격 (최대 5)</h3>
      {Array.from({ length: 5 }, (_, i) => {
        const a = initial?.attacks[i];
        return (
          <div className="attack-row-input" key={i}>
            <input
              name={`attack_${i}_name`}
              defaultValue={a?.name ?? ""}
              maxLength={60}
              placeholder={i === 0 ? "공격 이름" : ""}
            />
            <input
              name={`attack_${i}_skill`}
              type="number"
              min={0}
              max={100}
              defaultValue={a?.skill != null ? String(a.skill) : ""}
              placeholder="%"
            />
            <input
              name={`attack_${i}_damage`}
              defaultValue={a?.damage ?? ""}
              maxLength={80}
              placeholder="1d6 + DB"
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

      <FormError message={err} />

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
