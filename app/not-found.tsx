import Link from "next/link";
import { MistIllustration } from "@/components/vtt/Illustrations";

export default function NotFound() {
  return (
    <section
      style={{
        textAlign: "center",
        padding: "3rem 1rem 4rem",
        maxWidth: 540,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          color: "var(--ink)",
          opacity: 0.55,
          display: "flex",
          justifyContent: "center",
          marginBottom: "1.25rem",
        }}
      >
        <MistIllustration />
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.72rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--accent)",
          marginBottom: "0.55rem",
        }}
      >
        현장 보고서 №404 · 분실
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "2.4rem",
          lineHeight: 1.15,
          marginBottom: "0.6rem",
        }}
      >
        이 페이지는 안개에<br />
        <em style={{ color: "var(--accent)", fontStyle: "normal" }}>삼켜졌습니다</em>.
      </h1>
      <p
        style={{
          color: "var(--ink-2)",
          fontFamily: "var(--font-anno)",
          fontSize: "1.05rem",
          marginBottom: "1.5rem",
        }}
      >
        주소가 잘못되었거나, 캠페인·캐릭터·페이지가 삭제되었을 수 있습니다.
      </p>
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/" className="btn primary">홈으로</Link>
        <Link href="/campaigns" className="btn ghost">캠페인 목록</Link>
        <Link href="/rulebook" className="btn ghost">룰북</Link>
      </div>
    </section>
  );
}
