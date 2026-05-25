"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function SiteSearchTrigger() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  const modal = open ? (
    <div className="modal-backdrop search-backdrop" onClick={() => setOpen(false)}>
      <div
        className="modal search-modal"
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
          <label className="search-modal-label">전체 검색</label>
          <input
            type="search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="권총, 클루, 도서관 …"
            className="search-modal-input"
          />
          <div className="search-modal-hint">
            <span>↵ 검색</span>
            <span>esc 닫기</span>
          </div>
        </form>
      </div>
    </div>
  ) : null;

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
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
