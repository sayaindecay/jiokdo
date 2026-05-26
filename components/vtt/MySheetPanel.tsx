"use client";

import { Fragment, useState } from "react";
import type { Character, CocSkill, CocSkillGroup } from "@/lib/types";

const ATTR_KEYS: { key: keyof Character["attrs"]; label: string }[] = [
  { key: "str", label: "STR" }, { key: "con", label: "CON" }, { key: "siz", label: "SIZ" },
  { key: "dex", label: "DEX" }, { key: "app", label: "APP" }, { key: "int", label: "INT" },
  { key: "pow", label: "POW" }, { key: "edu", label: "EDU" },
];

const GROUP_FILTERS: { id: "all" | CocSkillGroup; label: string }[] = [
  { id: "all", label: "전부" },
  { id: "combat", label: "전투" },
  { id: "investigation", label: "조사" },
  { id: "social", label: "사회" },
  { id: "academic", label: "학문" },
];

const GROUP_LABELS: Record<CocSkillGroup, string> = {
  combat: "전투",
  investigation: "조사",
  social: "사회",
  academic: "학문",
  other: "기타",
};

const GROUP_ORDER: CocSkillGroup[] = [
  "combat", "investigation", "social", "academic", "other",
];

function insertIntoComposer(cmd: string) {
  if (typeof document === "undefined") return;
  const ta = document.querySelector<HTMLTextAreaElement>('#composer textarea[name="content"]');
  if (!ta) return;
  const expand = document.querySelector<HTMLButtonElement>('#composer .composer-expand');
  if (ta.offsetParent === null && expand) expand.click();

  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const before = ta.value.slice(0, start);
  const after = ta.value.slice(end);
  const prefix = before.length === 0 || /\s$/.test(before) ? "" : " ";
  ta.value = `${before}${prefix}${cmd}${after}`;
  const pos = (before + prefix + cmd).length;
  setTimeout(() => {
    ta.scrollIntoView({ behavior: "smooth", block: "center" });
    ta.focus();
    ta.setSelectionRange(pos, pos);
  }, 60);
}

export function MySheetPanel({ character }: { character: Character | null }) {
  const [tab, setTab] = useState<"attrs" | "skills">("attrs");
  const [group, setGroup] = useState<"all" | CocSkillGroup>("all");

  if (!character) {
    return (
      <div className="ms-panel ms-empty">
        <div className="ms-head">
          <span className="ms-title">내 시트</span>
        </div>
        <div className="ms-empty-body">
          이 캠페인에 내 캐릭터가 없습니다.
        </div>
      </div>
    );
  }

  const filtered = group === "all" ? character.skills : character.skills.filter((s) => s.group === group);
  const grouped: Record<CocSkillGroup, CocSkill[]> = {
    combat: [], investigation: [], social: [], academic: [], other: [],
  };
  for (const s of filtered) {
    const g = (s.group ?? "other") as CocSkillGroup;
    grouped[g].push(s);
  }

  return (
    <div className="ms-panel">
      <div className="ms-head">
        <span className="ms-title">{character.name}</span>
        <span className="ms-occu">{character.occupation || "직업 미기재"}</span>
      </div>

      <div className="ms-vitals" aria-hidden="true">
        <span className="ms-vital ms-vital-hp">HP <b>{character.hp}/{character.hp_max}</b></span>
        <span className="ms-vital ms-vital-mp">MP <b>{character.mp}/{character.mp_max}</b></span>
        <span className={`ms-vital ms-vital-san${character.san < 30 ? " warn" : ""}`}>
          SAN <b>{character.san}/{character.san_max}</b>
        </span>
        <span className="ms-vital ms-vital-luck">LUCK <b>{character.attrs.luck}</b></span>
      </div>

      <div className="ms-tabs" role="tablist">
        <button
          type="button"
          className={`ms-tab${tab === "attrs" ? " active" : ""}`}
          onClick={() => setTab("attrs")}
          role="tab"
          aria-selected={tab === "attrs"}
        >
          특성 <span className="ms-tab-count">8</span>
        </button>
        <button
          type="button"
          className={`ms-tab${tab === "skills" ? " active" : ""}`}
          onClick={() => setTab("skills")}
          role="tab"
          aria-selected={tab === "skills"}
        >
          기능 <span className="ms-tab-count">{character.skills.length}</span>
        </button>
      </div>

      {tab === "attrs" ? (
        <ul className="ms-list">
          {ATTR_KEYS.map(({ key, label }) => {
            const value = character.attrs[key];
            return (
              <li key={key}>
                <button
                  type="button"
                  className="ms-row"
                  onClick={() => insertIntoComposer(`/cc ${label} ${value}`)}
                  title={`composer 에 /cc ${label} ${value} 삽입`}
                >
                  <span className="ms-row-key">{label}</span>
                  <span className="ms-row-val">{value}</span>
                  <span className="ms-row-halves">
                    <span>½ {Math.floor(value / 2)}</span>
                    <span>⅕ {Math.floor(value / 5)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          <div className="ms-group-filter" role="group">
            {GROUP_FILTERS.map((g) => (
              <button
                type="button"
                key={g.id}
                className={`ms-group-chip${group === g.id ? " active" : ""}`}
                onClick={() => setGroup(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
          <ul className="ms-list ms-skills">
            {filtered.length === 0 ? (
              <li className="ms-row-empty">이 카테고리의 기능이 없습니다.</li>
            ) : group === "all" ? (
              GROUP_ORDER.map((g) => {
                const list = grouped[g];
                if (list.length === 0) return null;
                return (
                  <Fragment key={g}>
                    <li className="ms-group-head">
                      <span>{GROUP_LABELS[g]}</span>
                      <span className="ms-group-count">{list.length}</span>
                    </li>
                    {list.map((s) => (
                      <SkillItem key={s.name} skill={s} />
                    ))}
                  </Fragment>
                );
              })
            ) : (
              filtered.map((s) => <SkillItem key={s.name} skill={s} />)
            )}
          </ul>
        </>
      )}

      <div className="ms-foot">
        클릭 → composer 에 명령 삽입. 묘사를 덧붙여 함께 굴릴 수 있습니다.
      </div>
    </div>
  );
}

function SkillItem({ skill }: { skill: CocSkill }) {
  return (
    <li>
      <button
        type="button"
        className={`ms-row${skill.used ? " used" : ""}`}
        onClick={() => insertIntoComposer(`/cc ${skill.name} ${skill.value}`)}
        title={`composer 에 /cc ${skill.name} ${skill.value} 삽입`}
      >
        <span className="ms-row-name">{skill.name}</span>
        <span className="ms-row-val">{skill.value}</span>
      </button>
    </li>
  );
}
