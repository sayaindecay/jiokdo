import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedNickname } from "@/lib/auth";
import {
  countActiveUserSessions, findUser, listKeperCampaigns, listMyCampaigns,
} from "@/lib/db";
import { formatTime } from "@/lib/format";
import { ChangePasswordForm } from "@/components/vtt/ChangePasswordForm";
import { DeleteAccountForm } from "@/components/vtt/DeleteAccountForm";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: { searchParams: Promise<{ changed?: string }> }) {
  const sp = await searchParams;
  const nick = await getAuthenticatedNickname();
  if (!nick) redirect("/login?redirect=/account");

  const [user, keeperCamps, allCamps, sessionCount] = await Promise.all([
    findUser(nick),
    listKeperCampaigns(nick),
    listMyCampaigns(nick),
    countActiveUserSessions(nick),
  ]);
  if (!user) redirect("/login");

  const playerCamps = allCamps.filter((c) => c.keeper_nick !== nick);

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">지옥도</Link>
        <span className="sep">/</span>
        <span>내 계정</span>
      </div>

      <h1 className="page-title">내 계정</h1>
      <p className="page-sub">@{nick} — 닉네임 + 비밀번호로 운영되는 계정입니다.</p>

      {sp.changed === "password" ? (
        <div
          className="wiki-callout"
          role="status"
          style={{ marginBottom: "1rem" }}
        >
          <b>완료 ─</b> 비밀번호가 변경되었습니다. 다른 디바이스의 세션은 자동 로그아웃되었습니다.
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        {/* 사용자 정보 */}
        <section className="dash-card">
          <h2>계정 정보</h2>
          <div className="member-list">
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.45rem 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: "0.78rem", letterSpacing: "0.04em" }}>
                닉네임
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{nick}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.45rem 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: "0.78rem", letterSpacing: "0.04em" }}>
                가입일
              </span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-2)" }}>{formatTime(user.created_at)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.45rem 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: "0.78rem", letterSpacing: "0.04em" }}>
                마지막 로그인
              </span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-2)" }}>
                {user.last_login_at ? formatTime(user.last_login_at) : "—"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.45rem 0" }}>
              <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: "0.78rem", letterSpacing: "0.04em" }}>
                활성 세션
              </span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-2)" }}>{sessionCount}개</span>
            </div>
          </div>
        </section>

        {/* 키퍼 캠페인 목록 */}
        <section className="dash-card">
          <h2>키퍼로 운영 중 ({keeperCamps.length})</h2>
          {keeperCamps.length === 0 ? (
            <p className="text-faint" style={{ fontFamily: "var(--font-anno)" }}>
              현재 키퍼로 운영 중인 캠페인이 없습니다.
            </p>
          ) : (
            <ul className="character-list">
              {keeperCamps.map((c) => (
                <li key={c.id}>
                  <Link href={`/campaigns/${c.id}`} style={{ flex: 1 }}>
                    <span className="char-name">{c.name}</span>
                    <span className="char-occu">{c.invite_code}</span>
                  </Link>
                  <span className="text-faint small">
                    👤 {c.member_count} · 📖 {c.character_count}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {playerCamps.length > 0 ? (
            <p className="hint" style={{ marginTop: "0.7rem" }}>
              플레이어로 참여 중인 캠페인 {playerCamps.length}개 있음 —{" "}
              <Link href="/campaigns">목록 보기 →</Link>
            </p>
          ) : null}
        </section>

        {/* 비밀번호 변경 */}
        <section className="dash-card">
          <h2>비밀번호 변경</h2>
          <ChangePasswordForm />
        </section>

        {/* 계정 삭제 */}
        <section className="dash-card" style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }}>
          <h2 style={{ color: "var(--accent)" }}>계정 삭제</h2>
          <DeleteAccountForm
            nickname={nick}
            keeperCampaignCount={keeperCamps.length}
          />
        </section>
      </div>
    </>
  );
}
