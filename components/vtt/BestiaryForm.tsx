"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BestiaryEntry, CocSkillGroup } from "@/lib/types";
import { createBestiaryAction, updateBestiaryAction } from "@/app/actions";
import { fileToResizedDataUrl } from "@/lib/image-resize";
import { computeBuildDb, computeHpMax, computeMove, formatDbSuffix } from "@/lib/coc-derive";
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

const MAX_IMAGE_BYTES = 10_000_000;

type SkillRow = { name: string; value: string; group: CocSkillGroup | "" };
type AttackRow = { name: string; skill: string; damage: string; note: string };

const SKILL_GROUPS: { value: CocSkillGroup; label: string }[] = [
  { value: "combat", label: "전투" },
  { value: "investigation", label: "조사" },
  { value: "social", label: "사회" },
  { value: "academic", label: "지식" },
  { value: "other", label: "기타" },
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
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(initial?.category ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [imageErr, setImageErr] = useState<string | null>(null);

  // 특성치 — 입력 가능 (자유 입력으로 두되 음수/큰값 방지)
  const [str, setStr] = useState<string>(initial?.attrs.str != null ? String(initial.attrs.str) : "");
  const [con, setCon] = useState<string>(initial?.attrs.con != null ? String(initial.attrs.con) : "");
  const [siz, setSiz] = useState<string>(initial?.attrs.siz != null ? String(initial.attrs.siz) : "");
  const [dex, setDex] = useState<string>(initial?.attrs.dex != null ? String(initial.attrs.dex) : "");
  const [intel, setIntel] = useState<string>(initial?.attrs.int != null ? String(initial.attrs.int) : "");
  const [pow, setPow] = useState<string>(initial?.attrs.pow != null ? String(initial.attrs.pow) : "");
  const [app, setApp] = useState<string>(initial?.attrs.app != null ? String(initial.attrs.app) : "");
  const [edu, setEdu] = useState<string>(initial?.attrs.edu != null ? String(initial.attrs.edu) : "");

  const nStr = Number(str) || 0;
  const nCon = Number(con) || 0;
  const nSiz = Number(siz) || 0;
  const nDex = Number(dex) || 0;

  const buildDb = useMemo(() => computeBuildDb(nStr + nCon), [nStr, nCon]);
  const moveVal = useMemo(() => computeMove(nStr, nDex, nSiz), [nStr, nDex, nSiz]);
  const hpVal = useMemo(() => computeHpMax(nCon, nSiz), [nCon, nSiz]);

  // 공격 — 기본 피해(base)만 입력받고 DB는 자동 접미. 저장 직전에 합쳐서 hidden 으로 넘김.
  const seedAttacks = (initial?.attacks ?? []).slice(0, 5);
  const [attacks, setAttacks] = useState<AttackRow[]>(
    Array.from({ length: 5 }, (_, i) => {
      const a = seedAttacks[i];
      // 기존 damage 가 "1d6 + 1d4" 같은 형식이면 DB 부분을 분리 시도
      let baseDmg = a?.damage ?? "";
      if (a) {
        const m = a.damage.match(/^(.*?)\s*[+\-]\s*([0-9]+d?[0-9]*|\d+)\s*$/);
        if (m) baseDmg = m[1].trim();
      }
      return {
        name: a?.name ?? "",
        skill: a?.skill != null ? String(a.skill) : "",
        damage: baseDmg,
        note: a?.note ?? "",
      };
    }),
  );

  // 기능 (skills)
  const seedSkills = initial?.skills ?? [];
  const [skills, setSkills] = useState<SkillRow[]>(
    seedSkills.length > 0
      ? seedSkills.map((s) => ({ name: s.name, value: String(s.value), group: s.group ?? "" }))
      : [{ name: "", value: "", group: "" }],
  );

  const addSkill = () => setSkills((prev) => [...prev, { name: "", value: "", group: "" }]);
  const removeSkill = (i: number) =>
    setSkills((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  const updateSkill = (i: number, patch: Partial<SkillRow>) =>
    setSkills((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const updateAttack = (i: number, patch: Partial<AttackRow>) =>
    setAttacks((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));

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

  const seen = new Set<string>();
  const chipCategories: string[] = [];
  for (const c of [...DEFAULT_CATEGORIES, ...categories]) {
    const trimmed = c.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    chipCategories.push(trimmed);
  }

  const submit = (fd: FormData) => {
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

  const dbSuffix = formatDbSuffix(buildDb.db);

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

      <h3 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>특성치</h3>
      <div className="attr-grid">
        <label>
          STR
          <input type="number" min={0} max={500} name="attr_str"
            value={str} onChange={(e) => setStr(e.target.value)} />
        </label>
        <label>
          CON
          <input type="number" min={0} max={500} name="attr_con"
            value={con} onChange={(e) => setCon(e.target.value)} />
        </label>
        <label>
          SIZ
          <input type="number" min={0} max={500} name="attr_siz"
            value={siz} onChange={(e) => setSiz(e.target.value)} />
        </label>
        <label>
          DEX
          <input type="number" min={0} max={500} name="attr_dex"
            value={dex} onChange={(e) => setDex(e.target.value)} />
        </label>
        <label>
          INT
          <input type="number" min={0} max={500} name="attr_int"
            value={intel} onChange={(e) => setIntel(e.target.value)} />
        </label>
        <label>
          POW
          <input type="number" min={0} max={500} name="attr_pow"
            value={pow} onChange={(e) => setPow(e.target.value)} />
        </label>
        <label>
          APP
          <input type="number" min={0} max={500} name="attr_app"
            value={app} onChange={(e) => setApp(e.target.value)} />
        </label>
        <label>
          EDU
          <input type="number" min={0} max={500} name="attr_edu"
            value={edu} onChange={(e) => setEdu(e.target.value)} />
        </label>
      </div>

      <h3 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>
        자동 계산 <span className="bf-hint">특성치로부터 산출</span>
      </h3>
      <div className="bf-derived">
        <div className="bf-derived-cell">
          <div className="bf-derived-label">체력 (HP)</div>
          <div className="bf-derived-val">{hpVal}</div>
          <div className="bf-derived-formula">⌊(CON+SIZ)/10⌋</div>
          <input type="hidden" name="attr_hp" value={String(hpVal || 1)} />
        </div>
        <div className="bf-derived-cell">
          <div className="bf-derived-label">이동력</div>
          <div className="bf-derived-val">{moveVal}</div>
          <div className="bf-derived-formula">STR · DEX vs SIZ</div>
          <input type="hidden" name="attr_move" value={String(moveVal)} />
        </div>
        <div className="bf-derived-cell">
          <div className="bf-derived-label">체격</div>
          <div className="bf-derived-val">{buildDb.build > 0 ? `+${buildDb.build}` : buildDb.build}</div>
          <div className="bf-derived-formula">STR+CON 기반</div>
          <input type="hidden" name="attr_build" value={String(buildDb.build)} />
        </div>
        <div className="bf-derived-cell">
          <div className="bf-derived-label">DB (피해 보너스)</div>
          <div className="bf-derived-val">{buildDb.db}</div>
          <div className="bf-derived-formula">STR+CON 기반</div>
          <input type="hidden" name="attr_damage_bonus" value={buildDb.db} />
        </div>
      </div>

      <h3 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>
        기능 <span className="bf-hint"> 탐사자와 동일한 형식 (최대 20개)</span>
      </h3>
      <div className="bf-skills">
        {skills.map((s, i) => (
          <div className="bf-skill-row" key={i}>
            <input
              name={`skill_${i}_name`}
              value={s.name}
              onChange={(e) => updateSkill(i, { name: e.target.value })}
              maxLength={40}
              placeholder="예) 위협, 관찰력, 회피"
            />
            <input
              name={`skill_${i}_value`}
              type="number"
              min={0}
              max={100}
              value={s.value}
              onChange={(e) => updateSkill(i, { value: e.target.value })}
              placeholder="%"
            />
            <select
              name={`skill_${i}_group`}
              value={s.group}
              onChange={(e) => updateSkill(i, { group: e.target.value as CocSkillGroup | "" })}
            >
              <option value="">분류 없음</option>
              {SKILL_GROUPS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
            <button
              type="button"
              className="btn ghost small"
              onClick={() => removeSkill(i)}
              disabled={skills.length === 1}
              aria-label="이 기능 삭제"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn ghost small bf-skill-add"
          onClick={addSkill}
          disabled={skills.length >= 20}
        >
          + 기능 추가
        </button>
      </div>

      <h3 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>
        공격 <span className="bf-req">*</span>
        <span className="bf-hint"> 최소 1개 (최대 5개) · 피해에는 DB({buildDb.db})가 자동 추가됩니다</span>
      </h3>
      {attacks.map((a, i) => {
        const isFirst = i === 0;
        const combined = a.damage ? `${a.damage}${dbSuffix}` : "";
        return (
          <div className="attack-row-input" key={i}>
            <input
              name={`attack_${i}_name`}
              value={a.name}
              onChange={(e) => updateAttack(i, { name: e.target.value })}
              maxLength={60}
              placeholder={isFirst ? "공격 이름 *" : "공격 이름"}
              required={isFirst && !isEdit}
            />
            <input
              name={`attack_${i}_skill`}
              type="number"
              min={0}
              max={100}
              value={a.skill}
              onChange={(e) => updateAttack(i, { skill: e.target.value })}
              placeholder={isFirst ? "% *" : "%"}
              required={isFirst && !isEdit}
            />
            <input
              type="text"
              value={a.damage}
              onChange={(e) => updateAttack(i, { damage: e.target.value })}
              maxLength={80}
              placeholder={isFirst ? "기본 피해 (1d6) *" : "기본 피해 (1d6)"}
              required={isFirst && !isEdit}
              title={combined ? `최종 피해: ${combined}` : undefined}
            />
            <input
              type="hidden"
              name={`attack_${i}_damage`}
              value={combined}
            />
            <input
              name={`attack_${i}_note`}
              value={a.note}
              onChange={(e) => updateAttack(i, { note: e.target.value })}
              maxLength={120}
              placeholder="비고"
            />
            {a.damage ? (
              <div className="bf-attack-preview">최종 피해: <b>{combined}</b></div>
            ) : null}
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
