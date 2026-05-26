"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import type { Character, CocAttrs, CocSkill, CocSkillGroup, CocWeapon } from "@/lib/types";
import { updateCharacterProfileAction } from "@/app/actions";
import { computeBuildDb, computeHpMax, computeMove, formatBuild } from "@/lib/coc-derive";
import { FormError } from "./FormError";

const ATTR_LIST: { key: keyof CocAttrs; label: string }[] = [
  { key: "str", label: "STR" }, { key: "con", label: "CON" }, { key: "siz", label: "SIZ" },
  { key: "dex", label: "DEX" }, { key: "app", label: "APP" }, { key: "int", label: "INT" },
  { key: "pow", label: "POW" }, { key: "edu", label: "EDU" }, { key: "luck", label: "행운" },
];

const GROUP_OPTIONS: { value: CocSkillGroup; label: string }[] = [
  { value: "combat", label: "전투" },
  { value: "investigation", label: "조사" },
  { value: "social", label: "사회" },
  { value: "academic", label: "학문" },
  { value: "other", label: "기타" },
];

type SkillState = CocSkill & { id: string };
type WeaponState = CocWeapon & { id: string };

let _id = 0;
const newId = () => `s${++_id}_${Date.now().toString(36)}`;

async function wrap(action: (fd: FormData) => Promise<void>, fd: FormData) {
  try {
    await action(fd);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "오류";
  }
}

export function CharacterEditClient({ character }: { character: Character }) {
  const initial = useMemo(
    () => ({
      name: character.name,
      occupation: character.occupation,
      age: character.age ?? null,
      backstory: character.backstory,
      attrs: { ...character.attrs },
      hp_max: character.hp_max,
      mp_max: character.mp_max,
      san_max: character.san_max,
      skills: character.skills.map((s) => ({ ...s, _id: newId() })),
      weapons: character.weapons.map((w) => ({ ...w, _id: newId() })),
    }),
    [character]
  );

  const [name, setName] = useState(initial.name);
  const [occupation, setOccupation] = useState(initial.occupation);
  const [age, setAge] = useState<string>(initial.age == null ? "" : String(initial.age));
  const [backstory, setBackstory] = useState(initial.backstory);
  const [attrs, setAttrs] = useState<CocAttrs>(initial.attrs);
  const [hpMax, setHpMax] = useState<string>(String(initial.hp_max));
  const [mpMax, setMpMax] = useState<string>(String(initial.mp_max));
  const [sanMax, setSanMax] = useState<string>(String(initial.san_max));

  const [skills, setSkills] = useState<SkillState[]>(
    character.skills.map((s) => ({ ...s, id: newId() }))
  );
  const [weapons, setWeapons] = useState<WeaponState[]>(
    character.weapons.map((w) => ({ ...w, id: newId() }))
  );

  // ─── 파생: 체구, DB, 이동력, HP MAX ───
  const derivedBuildDb = useMemo(
    () => computeBuildDb((attrs.str || 0) + (attrs.con || 0)),
    [attrs.str, attrs.con],
  );
  const derivedMove = useMemo(
    () => computeMove(attrs.str || 0, attrs.dex || 0, attrs.siz || 0),
    [attrs.str, attrs.dex, attrs.siz],
  );
  const derivedHpMax = useMemo(
    () => computeHpMax(attrs.con || 0, attrs.siz || 0),
    [attrs.con, attrs.siz],
  );
  // 자동 계산값을 hpMax 상태와 동기화 (dirty 검사가 이 값을 기준으로 동작하도록)
  useEffect(() => {
    setHpMax(String(derivedHpMax));
  }, [derivedHpMax]);

  const [err, formAction, pending] = useActionState<string | null, FormData>(
    (_p, fd) => wrap(updateCharacterProfileAction, fd),
    null
  );

  // dirty 검사
  const dirty =
    name !== initial.name ||
    occupation !== initial.occupation ||
    age !== (initial.age == null ? "" : String(initial.age)) ||
    backstory !== initial.backstory ||
    Number(hpMax) !== initial.hp_max ||
    Number(mpMax) !== initial.mp_max ||
    Number(sanMax) !== initial.san_max ||
    JSON.stringify(attrs) !== JSON.stringify(initial.attrs) ||
    JSON.stringify(skills.map(({ id: _i, ...s }) => s)) !==
      JSON.stringify(initial.skills.map(({ _id: _i, ...s }) => s)) ||
    JSON.stringify(weapons.map(({ id: _i, ...w }) => w)) !==
      JSON.stringify(initial.weapons.map(({ _id: _i, ...w }) => w));

  const updateSkill = (id: string, patch: Partial<CocSkill>) => {
    setSkills((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };
  const removeSkill = (id: string) => {
    setSkills((arr) => arr.filter((s) => s.id !== id));
  };
  const addSkill = () => {
    setSkills((arr) => [...arr, { id: newId(), name: "", value: 25, group: "other", used: false }]);
  };

  const updateWeapon = (id: string, patch: Partial<CocWeapon>) => {
    setWeapons((arr) => arr.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  };
  const removeWeapon = (id: string) => {
    setWeapons((arr) => arr.filter((w) => w.id !== id));
  };
  const addWeapon = () => {
    setWeapons((arr) => [
      ...arr,
      { id: newId(), name: "", skill: 25, damage: "1d3 + DB" },
    ]);
  };

  // 검증
  const nameInvalid = name.trim().length === 0;
  const ageInvalid = age !== "" && (Number.isNaN(Number(age)) || Number(age) < 1 || Number(age) > 120);
  const dupSkillNames = new Set<string>();
  const dupSet = new Set<string>();
  for (const s of skills) {
    const n = s.name.trim();
    if (n && dupSkillNames.has(n)) dupSet.add(n);
    dupSkillNames.add(n);
  }
  const validationErrors: string[] = [];
  if (nameInvalid) validationErrors.push("이름을 입력하세요");
  if (ageInvalid) validationErrors.push("나이는 1–120 사이");
  if (dupSet.size > 0) validationErrors.push(`중복 기능 이름: ${[...dupSet].join(", ")}`);
  const canSubmit = dirty && validationErrors.length === 0;

  return (
    <form className="form ce-form" action={formAction}>
      <input type="hidden" name="character_id" value={character.id} />
      <input
        type="hidden"
        name="skills_json"
        value={JSON.stringify(
          skills.map(({ id: _i, ...s }) => ({
            ...s,
            name: s.name.trim(),
          }))
        )}
      />
      <input
        type="hidden"
        name="weapons_json"
        value={JSON.stringify(
          weapons.map(({ id: _i, ...w }) => ({
            ...w,
            name: w.name.trim(),
            damage: (w.damage ?? "").trim(),
          }))
        )}
      />

      {/* ─── 기본 정보 ─── */}
      <h3>기본 정보</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 100px",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <label>이름</label>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={40}
            style={nameInvalid ? { borderColor: "var(--accent)" } : undefined}
            aria-invalid={nameInvalid}
          />
        </div>
        <div>
          <label>직업</label>
          <input
            name="occupation"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            maxLength={40}
          />
        </div>
        <div>
          <label>나이</label>
          <input
            name="age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min={1}
            max={120}
            style={ageInvalid ? { borderColor: "var(--accent)" } : undefined}
            aria-invalid={ageInvalid}
          />
        </div>
      </div>

      {/* ─── 능력치 (8.3) ─── */}
      <h3>능력치</h3>
      <p className="hint" style={{ marginBottom: "0.5rem" }}>
        1–100 사이의 정수. 능력치 변경은 신중히 — 보통 캐릭터 생성 시 한 번만 정합니다.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "0.45rem",
          marginBottom: "1rem",
        }}
      >
        {ATTR_LIST.map(({ key, label }) => (
          <label
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              margin: 0,
              fontFamily: "var(--font-mono)",
              fontSize: "0.78rem",
              color: "var(--ink-2)",
            }}
          >
            <span style={{ flex: 1 }}>{label}</span>
            <input
              name={`attr_${key}`}
              type="number"
              min={1}
              max={100}
              value={attrs[key]}
              onChange={(e) =>
                setAttrs({ ...attrs, [key]: Math.max(1, Math.min(100, Number(e.target.value) || 0)) })
              }
              style={{ width: "4.5rem", textAlign: "center", fontFamily: "var(--font-mono)" }}
            />
          </label>
        ))}
      </div>

      {/* ─── 파생 — 체구 / DB / 이동력 / HP MAX (자동) ─── */}
      <h3>자동 계산 <span className="hint" style={{ fontWeight: 400, fontSize: "0.8rem" }}>특성치로부터 산출</span></h3>
      <div className="bestiary-form bf-derived" style={{ marginBottom: "1rem" }}>
        <div className="bf-derived-cell">
          <div className="bf-derived-label">체력 (HP MAX)</div>
          <div className="bf-derived-val">{derivedHpMax}</div>
          <div className="bf-derived-formula">⌊(CON+SIZ)/10⌋</div>
        </div>
        <div className="bf-derived-cell">
          <div className="bf-derived-label">이동력</div>
          <div className="bf-derived-val">{derivedMove}</div>
          <div className="bf-derived-formula">STR · DEX vs SIZ</div>
        </div>
        <div className="bf-derived-cell">
          <div className="bf-derived-label">체구</div>
          <div className="bf-derived-val">{formatBuild(derivedBuildDb.build)}</div>
          <div className="bf-derived-formula">STR+CON 기반</div>
        </div>
        <div className="bf-derived-cell">
          <div className="bf-derived-label">DB</div>
          <div className="bf-derived-val">{derivedBuildDb.db}</div>
          <div className="bf-derived-formula">STR+CON 기반</div>
        </div>
      </div>

      {/* ─── 최대치 (MP / SAN — HP 는 위 자동 계산값을 사용) ─── */}
      <h3>최대치 (MP / SAN)</h3>
      <p className="hint" style={{ marginBottom: "0.5rem" }}>
        최대치를 줄이면 현재값이 자동으로 그 이하로 떨어집니다. HP MAX 는 위 체력값을 자동 적용합니다.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "0.6rem",
          marginBottom: "1rem",
        }}
      >
        <input type="hidden" name="hp_max" value={String(derivedHpMax)} />
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", margin: 0 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--ink-3)" }}>MP MAX</span>
          <input name="mp_max" type="number" min={1} max={99} value={mpMax} onChange={(e) => setMpMax(e.target.value)} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", margin: 0 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--ink-3)" }}>SAN MAX</span>
          <input name="san_max" type="number" min={1} max={99} value={sanMax} onChange={(e) => setSanMax(e.target.value)} />
        </label>
      </div>

      {/* ─── 배경 ─── */}
      <h3>배경 / Backstory</h3>
      <textarea
        name="backstory"
        value={backstory}
        onChange={(e) => setBackstory(e.target.value)}
        maxLength={2000}
        placeholder="이상 · 의미 있는 사람 · 소중한 장소 · 특성"
        style={{ minHeight: "9rem", marginBottom: "1rem" }}
      />

      {/* ─── 기능치 (8.4 동적 추가/제거) ─── */}
      <div className="section-head" style={{ marginTop: "0.5rem", marginBottom: "0.6rem" }}>
        <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)" }}>
          기능치 ({skills.length})
        </h2>
        <button type="button" className="btn ghost small" onClick={addSkill}>
          + 새 기능
        </button>
      </div>

      <div className="skill-edit-list">
        {skills.length === 0 ? (
          <p className="text-faint" style={{ fontFamily: "var(--font-anno)" }}>
            기능치가 비어 있습니다. "+ 새 기능"으로 추가하세요.
          </p>
        ) : (
          skills.map((s) => {
            const isDup = dupSet.has(s.name.trim());
            return (
              <div className="skill-edit-row" key={s.id}>
                <input
                  type="text"
                  value={s.name}
                  onChange={(e) => updateSkill(s.id, { name: e.target.value })}
                  placeholder="기능 이름"
                  maxLength={40}
                  aria-invalid={isDup}
                  style={isDup ? { borderColor: "var(--accent)" } : undefined}
                />
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={s.value}
                  onChange={(e) =>
                    updateSkill(s.id, {
                      value: Math.max(0, Math.min(99, Number(e.target.value) || 0)),
                    })
                  }
                  style={{ fontFamily: "var(--font-mono)", textAlign: "center" }}
                />
                <select
                  value={s.group ?? "other"}
                  onChange={(e) => updateSkill(s.id, { group: e.target.value as CocSkillGroup })}
                >
                  {GROUP_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    color: "var(--ink-3)",
                    margin: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!s.used}
                    onChange={(e) => updateSkill(s.id, { used: e.target.checked })}
                    style={{ width: "auto" }}
                  />
                  자주 씀
                </label>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => removeSkill(s.id)}
                  aria-label={`${s.name || "이름 없는 기능"} 제거`}
                  style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* ─── 무기 (skills 와 같은 동적 패턴) ─── */}
      <div className="section-head" style={{ marginTop: "1.25rem", marginBottom: "0.6rem" }}>
        <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)" }}>
          무기 ({weapons.length})
        </h2>
        <button type="button" className="btn ghost small" onClick={addWeapon}>
          + 새 무기
        </button>
      </div>

      <div className="weapon-edit-list">
        {weapons.length === 0 ? (
          <p className="text-faint" style={{ fontFamily: "var(--font-anno)" }}>
            무기가 비어 있습니다. &quot;+ 새 무기&quot;로 추가하세요. (예: 권총 30% · 1d10 + DB)
          </p>
        ) : (
          weapons.map((w) => (
            <div className="weapon-edit-row" key={w.id}>
              <input
                type="text"
                value={w.name}
                onChange={(e) => updateWeapon(w.id, { name: e.target.value })}
                placeholder="무기 이름 (예: 리볼버 .32)"
                maxLength={60}
              />
              <input
                type="number"
                min={0}
                max={99}
                value={w.skill}
                onChange={(e) =>
                  updateWeapon(w.id, {
                    skill: Math.max(0, Math.min(99, Number(e.target.value) || 0)),
                  })
                }
                style={{ fontFamily: "var(--font-mono)", textAlign: "center" }}
                title="기능치 (사격 / 격투 등)"
              />
              <input
                type="text"
                value={w.damage}
                onChange={(e) => updateWeapon(w.id, { damage: e.target.value })}
                placeholder="피해 (예: 1d10 + DB)"
                maxLength={60}
                style={{ fontFamily: "var(--font-mono)" }}
              />
              <input
                type="text"
                value={w.range ?? ""}
                onChange={(e) => updateWeapon(w.id, { range: e.target.value })}
                placeholder="사거리 (선택)"
                maxLength={40}
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}
              />
              <button
                type="button"
                className="link-btn"
                onClick={() => removeWeapon(w.id)}
                aria-label={`${w.name || "이름 없는 무기"} 제거`}
                style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {validationErrors.length > 0 ? (
        <FormError message={validationErrors.join(" · ")} />
      ) : null}
      {err ? <FormError message={err} /> : null}

      {/* ─── Sticky 저장 바 (8.1) ─── */}
      <div className="sticky-save" role="status">
        <div className={`save-bar ${dirty ? "dirty" : ""}`}>
          <span className="status-pill" aria-live="polite">
            {dirty ? (
              <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                ● 저장되지 않은 변경 있음
              </span>
            ) : (
              <span style={{ color: "var(--ink-3)" }}>저장됨</span>
            )}
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href={`/characters/${character.id}`} className="btn ghost">취소</Link>
            <button type="submit" className="btn primary" disabled={!canSubmit || pending}>
              {pending ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
