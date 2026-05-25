"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      className="search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = q.trim();
        if (!trimmed) return;
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      }}
    >
      <input
        type="search"
        placeholder="검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="사이트 전체 검색"
      />
    </form>
  );
}
