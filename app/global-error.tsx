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
          background: "#14110d",
          color: "#ece6d8",
          fontFamily: 'system-ui, "Segoe UI", sans-serif',
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 540, width: "100%" }}>
          <div
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: "0.74rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#c14e4e",
              marginBottom: "0.55rem",
            }}
          >
            현장 보고서 №500 · 시스템 충돌
          </div>
          <h1
            style={{
              fontFamily: '"Special Elite", "Courier Prime", monospace',
              fontSize: "2.2rem",
              lineHeight: 1.15,
              marginBottom: "0.6rem",
              color: "#fff",
            }}
          >
            서버에 균열이 생겼습니다.
          </h1>
          <p
            style={{
              color: "rgba(236, 230, 216, 0.7)",
              fontSize: "1rem",
              marginBottom: "1.25rem",
            }}
          >
            요청을 처리하는 중 예상치 못한 오류가 발생했습니다. 다시 시도해 보세요.
          </p>
          <pre
            style={{
              background: "rgba(255,255,255,0.05)",
              padding: "0.85rem 1rem",
              borderRadius: 4,
              border: "1.5px solid rgba(236, 230, 216, 0.18)",
              fontSize: "0.82rem",
              color: "rgba(236, 230, 216, 0.85)",
              fontFamily: '"IBM Plex Mono", monospace',
              overflow: "auto",
              maxHeight: 220,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {error.message || "알 수 없는 오류"}
            {error.digest ? `\n\nDigest: ${error.digest}` : ""}
          </pre>
          <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.1rem", flexWrap: "wrap" }}>
            <button
              onClick={() => reset()}
              style={{
                background: "#c14e4e",
                color: "#fff",
                border: "1.5px solid #c14e4e",
                padding: "0.55rem 1.1rem",
                borderRadius: 4,
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "2px 2px 0 rgba(0,0,0,0.4)",
              }}
            >
              다시 시도
            </button>
            <a
              href="/"
              style={{
                background: "transparent",
                color: "rgba(236, 230, 216, 0.8)",
                border: "1.5px dashed rgba(236, 230, 216, 0.3)",
                padding: "0.55rem 1.1rem",
                borderRadius: 4,
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              홈으로
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
