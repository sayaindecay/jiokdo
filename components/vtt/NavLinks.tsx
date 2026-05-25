"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; match: (p: string) => boolean };

const ITEMS: Item[] = [
  { href: "/", label: "홈", match: (p) => p === "/" },
  { href: "/campaigns", label: "캠페인", match: (p) => p === "/campaigns" || p.startsWith("/campaigns/") || p.startsWith("/characters/") },
  { href: "/rulebook", label: "룰북", match: (p) => p === "/rulebook" || p.startsWith("/rulebook/") },
  { href: "/bestiary", label: "몬스터", match: (p) => p === "/bestiary" || p.startsWith("/bestiary/") },
];

export function NavLinks() {
  const pathname = usePathname() || "/";
  return (
    <nav className="nav" aria-label="주요 메뉴">
      {ITEMS.map((it) => {
        const active = it.match(pathname);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={active ? "active" : ""}
            aria-current={active ? "page" : undefined}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
