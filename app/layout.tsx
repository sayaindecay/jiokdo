import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Inter,
  IBM_Plex_Mono,
  Special_Elite,
  Kalam,
  Caveat,
  Noto_Serif_KR,
} from "next/font/google";
import { getAuthenticatedNickname, getNickname } from "@/lib/auth";
import { NicknameBadge } from "@/components/NicknameBadge";
import { SiteSearchTrigger } from "@/components/vtt/SiteSearchTrigger";

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
const anno = Kalam({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-anno",
  display: "swap",
});
const script = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
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
    <html lang="ko" className={fontVars}>
      <body>
        <header className="site-header">
          <div className="wrap wrap-wide">
            <Link href="/" className="brand">
              <span className="brand-mark">d100</span>
              <span>지옥도</span>
            </Link>
            <nav className="nav">
              <Link href="/">홈</Link>
              <Link href="/campaigns">캠페인</Link>
              <Link href="/rulebook">룰북</Link>
            </nav>
            <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <SiteSearchTrigger />
              <NicknameBadge nickname={nickname} authenticated={authenticated} />
            </div>
          </div>
        </header>
        <main className="wrap wrap-wide main">{children}</main>
        <footer className="site-footer">
          <div className="wrap wrap-wide">
            지옥도 · 1928 Call of Cthulhu VTT
          </div>
        </footer>
      </body>
    </html>
  );
}
