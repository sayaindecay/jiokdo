"use client";

import type { Character, CocSkill } from "@/lib/types";

export function SceneSkillBar({
  character, skills,
}: {
  character: Character | null;
  skills: CocSkill[];
}) {
  // 클릭 시 composer 의 textarea 끝에 /cc 명령을 삽입하고 포커스
  const insertCommand = (name: string, value: number) => {
    if (typeof document === "undefined") return;
    const ta = document.querySelector<HTMLTextAreaElement>(
      '#composer textarea[name="content"]'
    );
    if (!ta) return;
    // composer 가 접혀 있으면 펼치는 버튼을 클릭
    const expand = document.querySelector<HTMLButtonElement>(
      '#composer .composer-expand'
    );
    if (ta.offsetParent === null && expand) expand.click();

    const cmd = `/cc ${name} ${value}`;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(end);
    // 행동 묘사 뒤에 명령을 붙이도록, 텍스트가 있고 공백/줄바꿈으로 안 끝나면 공백 추가
    const prefix = before.length === 0 || /\s$/.test(before) ? "" : " ";
    const next = `${before}${prefix}${cmd}${after}`;
    ta.value = next;
    const pos = (before + prefix + cmd).length;
    setTimeout(() => {
      ta.scrollIntoView({ behavior: "smooth", block: "center" });
      ta.focus();
      ta.setSelectionRange(pos, pos);
    }, 60);
  };

  return (
    <div className="scene-hud">
      <div className="skills">
        {character && skills.length > 0 ? (
          skills.map((s) => (
            <button
              type="button"
              key={s.name}
              className="skill-chip"
              onClick={() => insertCommand(s.name, s.value)}
              title={`composer 에 /cc ${s.name} ${s.value} 삽입`}
            >
              {s.name}{" "}
              <span className="val">{s.value}</span>
            </button>
          ))
        ) : (
          <span
            style={{
              color: "rgba(245,243,238,0.5)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.78rem",
            }}
          >
            {character ? "기능 없음" : "캐릭터 미연결"}
          </span>
        )}
      </div>
      <div className="vitals">
        {character ? (
          <>
            <span>HP <b>{character.hp}/{character.hp_max}</b></span>
            <span>SAN <b>{character.san}/{character.san_max}</b></span>
          </>
        ) : (
          <span style={{ opacity: 0.5 }}>—</span>
        )}
      </div>
      <a href="#composer" className="speak" onClick={focusComposer}>💬 말하기</a>
    </div>
  );
}

function focusComposer(e: React.MouseEvent<HTMLAnchorElement>) {
  if (typeof document === "undefined") return;
  const ta = document.querySelector<HTMLTextAreaElement>(
    '#composer textarea[name="content"]'
  );
  if (ta) {
    e.preventDefault();
    ta.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => ta.focus(), 320);
  }
}
