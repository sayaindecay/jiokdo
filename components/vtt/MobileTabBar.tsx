"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Item = {
  href: string;
  label: string;
  match: (p: string) => boolean;
  icon: ReactNode;
};

const ICON = {
  home: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M4 11.5 12 4l8 7.5M6 10v9h12v-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  campaigns: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M4 6h16M4 12h16M4 18h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  rulebook: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M5 4.5h9a2 2 0 0 1 2 2V20a1.5 1.5 0 0 0-1.5-1.5H5zM5 4.5V20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19 7v13.5a1.5 1.5 0 0 0-1.5-1.5H8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  bestiary: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M12 3c-4 0-7 2.8-7 6.6 0 2.3 1 3.7 1 5.4 0 1.6 1.2 2.5 2.4 2.5.8 0 1.1-.5 1.1-1.3v-.7c0-.5.4-.9.9-.9h3.2c.5 0 .9.4.9.9v.7c0 .8.3 1.3 1.1 1.3 1.2 0 2.4-.9 2.4-2.5 0-1.7 1-3.1 1-5.4C19 5.8 16 3 12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="9.2" cy="10" r="1.1" fill="currentColor" />
      <circle cx="14.8" cy="10" r="1.1" fill="currentColor" />
      <path d="M9 21l1-2M15 21l-1-2M12 20.5V18.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  account: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
};

const ITEMS: Item[] = [
  { href: "/", label: "홈", match: (p) => p === "/", icon: ICON.home },
  {
    href: "/campaigns",
    label: "캠페인",
    match: (p) =>
      p === "/campaigns" ||
      p.startsWith("/campaigns/") ||
      p.startsWith("/characters/"),
    icon: ICON.campaigns,
  },
  {
    href: "/rulebook",
    label: "룰북",
    match: (p) => p === "/rulebook" || p.startsWith("/rulebook/"),
    icon: ICON.rulebook,
  },
  {
    href: "/bestiary",
    label: "에너미",
    match: (p) => p === "/bestiary" || p.startsWith("/bestiary/"),
    icon: ICON.bestiary,
  },
  {
    href: "/account",
    label: "계정",
    match: (p) => p === "/account" || p.startsWith("/account/") || p === "/login",
    icon: ICON.account,
  },
];

export function MobileTabBar() {
  const pathname = usePathname() || "/";
  return (
    <nav className="mobile-tabbar" aria-label="모바일 하단 메뉴">
      {ITEMS.map((it) => {
        const active = it.match(pathname);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`mtab${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="mtab-ico">{it.icon}</span>
            <span className="mtab-label">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
