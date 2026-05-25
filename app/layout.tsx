import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";
import { getNickname } from "@/lib/auth";
import { NicknameBadge } from "@/components/NicknameBadge";
import { SearchBar } from "@/components/SearchBar";

export const metadata = {
  title: "지옥도 — TRPG VTT",
  description: "Call of Cthulhu 비동기 가상 테이블탑",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const nickname = await getNickname();
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="site-header">
          <div className="wrap header-inner">
            <Link href="/" className="brand">
              <span className="brand-mark">d100</span>
              <span>지옥도</span>
            </Link>
            <nav className="nav">
              <Link href="/campaigns">캠페인</Link>
              <Link href="/rules">룰북</Link>
              <Link href="/bestiary">몬스터</Link>
            </nav>
            <div className="header-right">
              <SearchBar />
              <NicknameBadge nickname={nickname} />
            </div>
          </div>
        </header>
        <main className="wrap main">{children}</main>
        <footer className="site-footer">
          <div className="wrap">
            지옥도 · Call of Cthulhu 비동기 VTT
          </div>
        </footer>
      </body>
    </html>
  );
}
