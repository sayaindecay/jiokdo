import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthenticatedNickname } from "@/lib/auth";
import { getTableCounts } from "@/lib/db";

export const dynamic = "force-dynamic";

const TABLE_LABELS: Record<string, string> = {
  users: "사용자",
  user_sessions: "세션 토큰",
  campaigns: "캠페인",
  campaign_members: "캠페인 멤버",
  characters: "캐릭터",
  bestiary: "에너미",
  rule_sections: "룰북 섹션",
  play_entries: "플레이 로그",
  sessions: "세션",
  clues: "단서",
};

export default async function AdminStatsPage() {
  const nick = await getAuthenticatedNickname();
  const adminNick = process.env.ADMIN_NICKNAME;
  const isDev = process.env.NODE_ENV !== "production";

  // 인증되지 않았거나 (admin 닉 미설정 환경에선 dev 모드만 허용)
  const allowed =
    (adminNick && nick === adminNick) ||
    (!adminNick && isDev && nick != null);

  if (!allowed) notFound();

  const counts = await getTableCounts();
  const total = Object.values(counts).reduce((a, b) => a + Math.max(0, b), 0);

  return (
    <div className="admin-page">
      <div className="breadcrumb">
        <Link href="/">지옥도</Link>
        <span className="sep">/</span>
        <span>관리자</span>
        <span className="sep">/</span>
        <span>DB 통계</span>
      </div>

      <header className="acc-header">
        <div className="acc-eyebrow">ADMIN · @{nick}</div>
        <h1 className="acc-title">DB 통계</h1>
        <p className="acc-sub">
          테이블별 row 수 · 매 요청마다 새로 집계 (force-dynamic).
        </p>
      </header>

      <section className="acc-identity">
        <div className="acc-id-stamp" aria-hidden="true">
          <span className="acc-id-initial">Σ</span>
          <span className="acc-id-tag">TOTAL</span>
        </div>
        <dl className="acc-id-meta">
          <div>
            <dt>총 row</dt>
            <dd>
              <span className="acc-id-num">{total.toLocaleString()}</span>
              <span className="acc-id-unit">건</span>
            </dd>
          </div>
          <div>
            <dt>테이블</dt>
            <dd className="mono">{Object.keys(counts).length}</dd>
          </div>
          <div>
            <dt>환경</dt>
            <dd className="mono">{isDev ? "dev" : "production"}</dd>
          </div>
          <div>
            <dt>집계 시각</dt>
            <dd>{new Date().toLocaleString("ko-KR")}</dd>
          </div>
        </dl>
      </section>

      <section className="acc-card">
        <header className="acc-card-head">
          <div>
            <div className="acc-card-eyebrow">TABLES</div>
            <h2>테이블 row 수</h2>
          </div>
          <span className="acc-card-count">{Object.keys(counts).length}</span>
        </header>
        <table className="admin-stat-table">
          <thead>
            <tr>
              <th>테이블</th>
              <th>설명</th>
              <th>row 수</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(counts).map(([name, n]) => (
              <tr key={name}>
                <td className="ast-name">{name}</td>
                <td className="ast-label">{TABLE_LABELS[name] ?? "—"}</td>
                <td className={`ast-count${n < 0 ? " err" : ""}`}>
                  {n < 0 ? "에러" : n.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
