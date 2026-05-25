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
            <span>© 지옥도 · TRPG 굴림판</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
