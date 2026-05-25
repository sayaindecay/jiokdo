"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { BestiaryEntry } from "@/lib/types";
import { createBestiaryAction, updateBestiaryAction } from "@/app/actions";
import { FormError } from "./FormError";

async function wrap(action: (fd: FormData) => Promise<void>, fd: FormData) {
  try {
    await action(fd);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "오류";
  }
}

export function BestiaryForm({ initial }: { initial?: BestiaryEntry }) {
  const isEdit = !!initial;
  const action = isEdit ? updateBestiaryAction : createBestiaryAction;
  const [err, formAction, pending] = useActionState<string | null, FormData>(
    (_p, fd) => wrap(action, fd),
    null
  );

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
          <input name="category" maxLength={80} defaultValue={initial?.category ?? ""} placeholder="예) 신화 생물 / 외계 종족" />
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

      <div className="actions" style={{ marginTop: "1rem", gap: "0.5rem" }}>
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
