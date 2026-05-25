"use client";

import { useState } from "react";
import { deleteBestiaryAction } from "@/app/actions";

export function BestiaryDangerZone({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === name;

  return (
    <section
      style={{
        marginTop: "2rem",
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
            이 베스티어리 항목을 삭제합니다. 다른 사용자가 더 이상 이 NPC를 볼 수 없게 됩니다.
          </p>
          <div style={{ marginTop: "0.7rem" }}>
            <button
              type="button"
              className="btn"
              onClick={() => setOpen(true)}
              style={{ background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }}
            >
              항목 삭제…
            </button>
          </div>
        </>
      ) : (
        <form action={deleteBestiaryAction}>
          <input type="hidden" name="slug" value={slug} />
          <p style={{ color: "var(--ink-2)", fontSize: "0.88rem", margin: "0 0 0.5rem" }}>
            정말 삭제하시려면 이름{" "}
            <b style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{name}</b>
            {" "}을 그대로 입력하세요.
          </p>
          <input
            name="confirm_name"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={name}
            autoFocus
            maxLength={80}
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
