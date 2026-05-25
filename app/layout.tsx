import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Inter,
  IBM_Plex_Mono,
  Special_Elite,
  Gaegu,
  Nanum_Pen_Script,
  Noto_Serif_KR,
} from "next/font/google";
import { getAuthenticatedNickname, getNickname } from "@/lib/auth";
import { NicknameBadge } from "@/components/NicknameBadge";
import { SiteSearchTrigger } from "@/components/vtt/SiteSearchTrigger";
import { ThemeBootstrap, ThemeToggle } from "@/components/vtt/ThemeToggle";
import { NavLinks } from "@/components/vtt/NavLinks";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});
const display = Special_Elite({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
  display: "swap",
});
const anno = Gaegu({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-anno",
  display: "swap",
});
const script = Nanum_Pen_Script({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-script",
  display: "swap",
});
const kr = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-kr",
  display: "swap",
});

export const metadata = {
  title: "지옥도 — TRPG VTT",
  description: "Call of Cthulhu 비동기 가상 테이블탑",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [nickname, authNick] = await Promise.all([
    getNickname(),
    getAuthenticatedNickname(),
  ]);
  const authenticated = !!authNick;
  const fontVars = [
    inter.variable, mono.variable, display.variable,
    anno.variable, script.variable, kr.variable,
  ].join(" ");
  return (
    <html lang="ko" className={fontVars} suppressHydrationWarning>
      <head>
        <ThemeBootstrap />
      </head>
      <body>
        <header className="site-header">
          <div className="wrap wrap-wide">
            <Link href="/" className="brand">
              <span className="brand-mark">d100</span>
              <span>지옥도</span>
            </Link>
            <NavLinks />
            <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <SiteSearchTrigger />
              <ThemeToggle />
              <NicknameBadge nickname={nickname} authenticated={authenticated} />
            </div>
          </div>
        </header>
        <main className="wrap wrap-wide main">{children}</main>
        <footer className="site-footer">
          <div className="wrap wrap-wide footer-inner">
            <div className="footer-brand">
              <span className="brand-mark" aria-hidden="true">d100</span>
              <span>지옥도 · 1928 Call of Cthulhu VTT</span>
            </div>
            <nav className="footer-nav" aria-label="푸터 메뉴">
              <Link href="/rulebook">룰북</Link>
              <Link href="/bestiary">베스티어리</Link>
              <Link href="/campaigns">캠페인</Link>
              <Link href="/search">검색</Link>
            </nav>
            <div className="footer-meta">
              본 사이트의 굴림 결과는 작성 시점에 동결되어 보관됩니다.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
