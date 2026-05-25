"use client";

import Link from "next/link";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      style={{
        textAlign: "center",
        padding: "2.5rem 1rem 3rem",
        maxWidth: 540,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.72rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--accent)",
          marginBottom: "0.45rem",
        }}
      >
        오류 발생
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.8rem",
          lineHeight: 1.2,
          marginBottom: "0.7rem",
        }}
      >
        요청을 처리할 수 없습니다.
      </h1>
      <p
        style={{
          color: "var(--ink-2)",
          fontFamily: "var(--font-anno)",
          fontSize: "1rem",
          marginBottom: "1rem",
        }}
      >
        {error.message || "예상치 못한 오류가 발생했습니다."}
      </p>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button onClick={() => reset()} className="btn primary">다시 시도</button>
        <Link href="/" className="btn ghost">홈으로</Link>
      </div>
    </section>
  );
}
