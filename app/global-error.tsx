"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          background: "#0f0d12",
          color: "#ece8f1",
          fontFamily: "system-ui, sans-serif",
          padding: "3rem 1.5rem",
          maxWidth: "640px",
          margin: "0 auto",
          lineHeight: 1.6,
        }}
      >
        <h1 style={{ color: "#c4453a" }}>서버 오류</h1>
        <p>요청을 처리하는 중 문제가 생겼습니다.</p>
        <pre
          style={{
            background: "#181520",
            padding: "1rem",
            borderRadius: "6px",
            overflow: "auto",
            fontSize: "0.85rem",
            color: "#a59cb5",
          }}
        >
          {error.message || "알 수 없는 오류"}
          {error.digest ? `\n\nDigest: ${error.digest}` : ""}
        </pre>
        <button
          onClick={() => reset()}
          style={{
            background: "#c4453a",
            color: "#fff",
            border: "none",
            padding: "0.55rem 1rem",
            borderRadius: "6px",
            cursor: "pointer",
            marginTop: "1rem",
          }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
