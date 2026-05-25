import Link from "next/link";
import { getNickname } from "@/lib/auth";
import {
  listActivityFor, listCampaignMembers, listMyCampaigns,
  listNotificationsFor, listSessions,
} from "@/lib/db";
import { CampaignForms } from "@/components/CampaignForms";
import { NicknameInline } from "@/components/vtt/NicknameInline";
import { CampaignsTable, type CampaignTableRow } from "@/components/vtt/CampaignsTable";
import { ActivityFeed } from "@/components/vtt/ActivityFeed";
import { NotificationsCard } from "@/components/vtt/NotificationsCard";

export const dynamic = "force-dynamic";

export default async function CampaignsDashboardPage() {
  const nick = await getNickname();
  if (!nick) {
    return (
      <>
        <div className="breadcrumb">
          <Link href="/">지옥도</Link>
          <span className="sep">/</span>
          <span>내 캠페인</span>
        </div>
        <NicknameInline redirect="/campaigns" />
      </>
    );
  }

  const campaigns = await listMyCampaigns(nick);
  const notifications = await listNotificationsFor(nick, 8);

  const rows: CampaignTableRow[] = await Promise.all(
    campaigns.map(async (c) => {
      const sessions = await listSessions(c.id);
      const members = await listCampaignMembers(c.id);
      const upcoming = sessions
        .filter((s) => s.scheduled_at && s.scheduled_at >= Date.now() && !s.ended_at)
        .sort((a, b) => (a.scheduled_at ?? 0) - (b.scheduled_at ?? 0));
      const role = c.keeper_nick === nick ? "keeper" : "player";
      return {
        campaign: c,
        role,
        next_session: upcoming[0] ?? null,
        characters_count: c.character_count ?? 0,
        members_count: members.length,
        status: c.status, // DB 의 명시적 상태 사용 (키퍼 토글)
      };
    })
  );

  const activeCount = rows.filter((r) => r.status === "active").length;
  const dormantCount = rows.filter((r) => r.status === "dormant").length;
  const closedCount = rows.filter((r) => r.status === "closed").length;
  const activity = await listActivityFor(nick, 8);

  const keeperCount = campaigns.filter((c) => c.keeper_nick === nick).length;
  const playerCount = campaigns.length - keeperCount;

  return (
    <div className="cl-page">
      <div className="breadcrumb">
        <Link href="/">지옥도</Link>
        <span className="sep">/</span>
        <span>내 캠페인</span>
      </div>

      {/* ─── 페이지 헤더 ─── */}
      <header className="cl-header">
        <div className="cl-head-text">
          <div className="cl-eyebrow">CAMPAIGNS · @{nick}</div>
          <h1 className="cl-title">내 캠페인</h1>
          <p className="cl-subtitle">
            진행 중인 사건과 가까운 세션, 누적 기록을 한 화면에서.
          </p>
          <dl className="cl-meta">
            <div><dt>참여</dt><dd>{campaigns.length}</dd></div>
            <div><dt>키퍼</dt><dd>{keeperCount}</dd></div>
            <div><dt>플레이어</dt><dd>{playerCount}</dd></div>
            <div><dt>활성</dt><dd>{activeCount}</dd></div>
          </dl>
        </div>
      </header>

      {/* ─── 신규 알림 ─── */}
      <section className="cl-section">
        <div className="cl-section-head">
          <div className="cl-section-eyebrow">FOCUS · 신규 알림</div>
          <h2>최근 변동 사항</h2>
          <p className="cl-section-hint">
            참여 중인 캠페인의 최근 글·굴림·캐릭터 등록·단서. 클릭하면 해당 장소로 이동합니다.
          </p>
        </div>
        <NotificationsCard
          notifications={notifications}
          hasCampaigns={campaigns.length > 0}
        />
      </section>

      {/* ─── 모든 캠페인 표 ─── */}
      {campaigns.length > 0 ? (
        <section className="cl-section">
          <div className="cl-section-head">
            <div className="cl-head-row">
              <div>
                <div className="cl-section-eyebrow">ROSTER</div>
                <h2>모든 캠페인</h2>
              </div>
              <div className="cl-status-pills">
                <span className="cl-status-pill accent">활성 {activeCount}</span>
                {dormantCount > 0 ? (
                  <span className="cl-status-pill">휴면 {dormantCount}</span>
                ) : null}
                {closedCount > 0 ? (
                  <span className="cl-status-pill closed">종료 {closedCount}</span>
                ) : null}
              </div>
            </div>
          </div>
          <CampaignsTable rows={rows} myNick={nick} />
        </section>
      ) : null}

      {/* ─── 새 캠페인 / 참여 폼 ─── */}
      {campaigns.length > 0 ? (
        <section className="cl-section">
          <div className="cl-section-head">
            <div className="cl-section-eyebrow">JOIN · CREATE</div>
            <h2>새 캠페인 / 초대 코드</h2>
            <p className="cl-section-hint">
              새 사건을 시작하거나, 다른 키퍼가 보낸 초대 코드를 입력하세요.
            </p>
          </div>
          <CampaignForms />
        </section>
      ) : null}

      {/* ─── 활동 피드 ─── */}
      <section className="cl-section">
        <div className="cl-section-head">
          <div className="cl-section-eyebrow">CHRONICLE</div>
          <h2>최근 활동</h2>
          <p className="cl-section-hint">
            내가 참여 중인 캠페인의 가장 최근 글 / 굴림 / 메모.
          </p>
        </div>
        <ActivityFeed items={activity} />
      </section>
    </div>
  );
}
