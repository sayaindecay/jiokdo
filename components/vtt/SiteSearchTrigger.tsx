"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function SiteSearchTrigger() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        const t = e.target as HTMLElement;
        if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button
        className="search-trigger"
        onClick={() => setOpen(true)}
        aria-label="사이트 검색"
      >
        <span style={{ opacity: 0.65 }}>🔍</span>
        <span>검색</span>
        <kbd>/</kbd>
      </button>
      {open ? (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div
            className="modal"
            style={{ maxWidth: 520, padding: "1.25rem 1.4rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = q.trim();
                if (!trimmed) return;
                setOpen(false);
                router.push(`/search?q=${encodeURIComponent(trimmed)}`);
              }}
            >
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                전체 검색
              </label>
              <input
                type="search"
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="권총, 클루, 도서관 …"
                style={{ marginTop: "0.4rem", fontFamily: "var(--font-mono)", fontSize: "1.05rem" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--ink-3)" }}>
                <span>↵ 검색</span>
                <span>esc 닫기</span>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
