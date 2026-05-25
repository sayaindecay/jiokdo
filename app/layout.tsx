import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "지옥도 — TRPG 게시판",
  description: "TRPG 롤플레잉 + 다이스 굴림이 가능한 게시판",
};

export default function RootLayout({ children }: { children: ReactNode }) {
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
          <div className="wrap">
            <Link href="/" className="brand">
              <span className="brand-mark">d100</span>
              <span>지옥도</span>
            </Link>
            <nav className="nav">
              <Link href="/">게시판</Link>
              <Link href="/help">도움말</Link>
            </nav>
          </div>
        </header>
        <main className="wrap main">{children}</main>
        <footer className="site-footer">
          <div className="wrap">
            <span>지옥도 · TRPG 다이스 게시판</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
