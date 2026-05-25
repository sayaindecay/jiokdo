"use client";

import { useState } from "react";
import { deleteCharacterAction } from "@/app/actions";

export function DangerZone({ characterId, characterName }: { characterId: number; characterName: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === characterName;

  return (
    <section
      style={{
        marginTop: "2.5rem",
        padding: "1rem 1.2rem",
        border: "1.5px dashed var(--accent)",
        borderRadius: "var(--radius)",
        background: "var(--accent-soft)",
      }}
    >
      <h3 style={{ color: "var(--accent)", marginBottom: "0.4rem" }}>위험 영역</h3>
      {!open ? (
        <>
          <p style={{ color: "var(--ink-2)", fontSize: "0.88rem", margin: 0 }}>
            캐릭터를 삭제하면 시트와 기능치가 모두 사라집니다. 과거 굴림 기록은 캠페인 로그에 남으나 작성자명 옆 캐릭터 표시가 사라집니다.
          </p>
          <div style={{ marginTop: "0.7rem" }}>
            <button
              type="button"
              className="btn"
              onClick={() => setOpen(true)}
              style={{ background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }}
            >
              캐릭터 삭제…
            </button>
          </div>
        </>
      ) : (
        <form action={deleteCharacterAction}>
          <input type="hidden" name="character_id" value={characterId} />
          <p style={{ color: "var(--ink-2)", fontSize: "0.88rem", margin: "0 0 0.5rem" }}>
            정말 삭제하시려면 아래에 캐릭터 이름{" "}
            <b style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{characterName}</b>
            {" "}을 그대로 입력하세요.
          </p>
          <input
            name="confirm_name"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={characterName}
            autoFocus
            maxLength={40}
            style={{ fontFamily: "var(--font-mono)" }}
          />
          <div className="actions" style={{ marginTop: "0.7rem", gap: "0.5rem" }}>
            <button
              type="submit"
              className="btn"
              disabled={!matches}
              style={{
                background: matches ? "var(--accent)" : undefined,
                borderColor: matches ? "var(--accent)" : undefined,
                color: matches ? "#fff" : undefined,
                opacity: matches ? 1 : 0.5,
              }}
            >
              영구 삭제
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setOpen(false);
                setTyped("");
              }}
            >
              취소
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
