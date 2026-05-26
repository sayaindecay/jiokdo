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
  const initial = nick.slice(0, 1).toUpperCase();

  return (
    <div className="acc-page">
      <div className="breadcrumb">
        <Link href="/">지옥도</Link>
        <span className="sep">/</span>
        <span>내 계정</span>
      </div>

      {/* ─── 페이지 헤더 ─── */}
      <header className="acc-header">
        <div className="acc-eyebrow">ACCOUNT · @{nick}</div>
        <h1 className="acc-title">내 계정</h1>
        <p className="acc-sub">
          닉네임과 비밀번호로 운영되는 계정. 정보·세션·키퍼 캠페인을 한 화면에서 관리합니다.
        </p>
      </header>

      {sp.changed === "password" ? (
        <div className="acc-callout" role="status">
          <span className="acc-callout-mark" aria-hidden="true">✓</span>
          <span>
            <b>비밀번호가 변경되었습니다.</b> 다른 디바이스의 세션은 자동으로 로그아웃되었습니다.
          </span>
        </div>
      ) : null}

      {/* ─── 신원 카드 ─── */}
      <section className="acc-identity">
        <div className="acc-id-stamp" aria-hidden="true">
          <span className="acc-id-initial">{initial}</span>
          <span className="acc-id-tag">@{nick}</span>
        </div>
        <dl className="acc-id-meta">
          <div>
            <dt>닉네임</dt>
            <dd className="mono">{nick}</dd>
          </div>
          <div>
            <dt>가입일</dt>
            <dd>{formatTime(user.created_at)}</dd>
          </div>
          <div>
            <dt>마지막 로그인</dt>
            <dd>{user.last_login_at ? formatTime(user.last_login_at) : "—"}</dd>
          </div>
          <div>
            <dt>활성 세션</dt>
            <dd>
              <span className="acc-id-num">{sessionCount}</span>
              <span className="acc-id-unit">개</span>
            </dd>
          </div>
        </dl>
      </section>

      {/* ─── 2단: 키퍼 캠페인 + 비밀번호 변경 ─── */}
      <div className="acc-grid">
        <section className="acc-card">
          <header className="acc-card-head">
            <div>
              <div className="acc-card-eyebrow">KEEPER</div>
              <h2>키퍼로 운영 중</h2>
            </div>
            <span className="acc-card-count">{keeperCamps.length}</span>
          </header>
          {keeperCamps.length === 0 ? (
            <p className="acc-empty">
              현재 키퍼로 운영 중인 캠페인이 없습니다.
            </p>
          ) : (
            <ul className="acc-camp-list">
              {keeperCamps.map((c) => (
                <li key={c.id} className="acc-camp-row">
                  <Link href={`/campaigns/${c.id}`} className="acc-camp-link">
                    <span className="acc-camp-name">{c.name}</span>
                    <span className="acc-camp-meta">
                      <span className="acc-camp-stat" title="멤버">
                        <span className="acs-label">멤버</span>
                        <span className="acs-val">{c.member_count ?? 0}</span>
                      </span>
                      <span className="acc-camp-stat" title="캐릭터">
                        <span className="acs-label">캐릭터</span>
                        <span className="acs-val">{c.character_count ?? 0}</span>
                      </span>
                    </span>
                  </Link>
                  <code className="acc-camp-code" title="초대 코드">{c.invite_code}</code>
                </li>
              ))}
            </ul>
          )}
          {playerCamps.length > 0 ? (
            <div className="acc-card-foot">
              <span>
                플레이어로 참여 중인 캠페인 <b>{playerCamps.length}개</b>
              </span>
              <Link href="/campaigns" className="acc-foot-link">
                목록 보기 →
              </Link>
            </div>
          ) : null}
        </section>

        <section className="acc-card">
          <header className="acc-card-head">
            <div>
              <div className="acc-card-eyebrow">SECURITY</div>
              <h2>비밀번호 변경</h2>
            </div>
          </header>
          <ChangePasswordForm />
        </section>
      </div>

      {/* ─── 내 데이터 다운로드 ─── */}
      <section className="acc-card" style={{ marginBottom: "1.5rem" }}>
        <header className="acc-card-head">
          <div>
            <div className="acc-card-eyebrow">EXPORT</div>
            <h2>내 데이터 다운로드</h2>
          </div>
        </header>
        <p style={{ fontFamily: "var(--font-anno)", color: "var(--ink-2)", fontSize: "0.92rem", margin: 0 }}>
          내가 만든 캐릭터·플레이 로그·등록한 에너미 + 참여 중인 캠페인 정보를
          JSON 한 파일로 내려받습니다. 비밀번호 같은 자격 정보는 포함되지 않습니다.
        </p>
        <div className="acc-form-actions" style={{ marginTop: "0.6rem" }}>
          <a href="/api/account/export" className="btn primary" download>
            JSON 다운로드
          </a>
        </div>
      </section>

      {/* ─── 위험 영역: 계정 삭제 ─── */}
      <div className="danger-divider" aria-hidden="true">
        <span>위험 영역</span>
      </div>
      <section className="acc-danger">
        <header className="acc-card-head">
          <div>
            <div className="acc-card-eyebrow danger">DANGER</div>
            <h2>계정 삭제</h2>
          </div>
        </header>
        <DeleteAccountForm
          nickname={nick}
          keeperCampaignCount={keeperCamps.length}
        />
      </section>
    </div>
  );
}
