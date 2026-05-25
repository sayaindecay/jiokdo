import Link from "next/link";
import { getNickname } from "@/lib/auth";
import {
  countCharactersInDanger, getCampaignAggregates, getNextScheduledSession,
  listActivityFor, listCampaignMembers, listMyCampaigns, listSessions,
} from "@/lib/db";
import { CampaignForms } from "@/components/CampaignForms";
import { DashHero, DashHeroEmpty } from "@/components/vtt/DashHero";
import { NicknameInline } from "@/components/vtt/NicknameInline";
import { SessionHistory } from "@/components/vtt/SessionHistory";
import { CampaignsTable, type CampaignTableRow } from "@/components/vtt/CampaignsTable";
import { ActivityFeed } from "@/components/vtt/ActivityFeed";

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
  const next = await getNextScheduledSession(nick);

  let heroBlock;
  let history: Awaited<ReturnType<typeof listSessions>> = [];

  if (next) {
    const [agg, danger] = await Promise.all([
      getCampaignAggregates(next.campaign.id),
      countCharactersInDanger(next.campaign.id),
    ]);
    heroBlock = (
      <DashHero
        campaign={next.campaign}
        session={next.session}
        stats={{
          unresolved_clues: agg.unresolved_clues,
          danger_pcs: danger,
          total_sessions: agg.total_sessions,
          total_play_ms: agg.total_play_ms,
        }}
      />
    );
    history = (await listSessions(next.campaign.id)).slice(0, 5);
  } else {
    heroBlock = (
      <DashHeroEmpty
        hasCampaign={campaigns.length > 0}
        showForms={campaigns.length === 0}
      />
    );
  }

  const rows: CampaignTableRow[] = await Promise.all(
    campaigns.map(async (c) => {
      const sessions = await listSessions(c.id);
      const members = await listCampaignMembers(c.id);
      const upcoming = sessions
        .filter((s) => s.scheduled_at && s.scheduled_at >= Date.now() && !s.ended_at)
        .sort((a, b) => (a.scheduled_at ?? 0) - (b.scheduled_at ?? 0));
      const role = c.keeper_nick === nick ? "keeper" : "player";
      const status: "active" | "dormant" =
        upcoming[0] || sessions.length > 0 ? "active" : "dormant";
      return {
        campaign: c,
        role,
        next_session: upcoming[0] ?? null,
        characters_count: c.character_count ?? 0,
        members_count: members.length,
        status,
      };
    })
  );

  const activeCount = rows.filter((r) => r.status === "active").length;
  const dormantCount = rows.filter((r) => r.status === "dormant").length;
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

      {/* ─── 다음 세션 hero ─── */}
      <section className="cl-section cl-next-section">
        <div className="cl-section-head">
          <div className="cl-section-eyebrow">FOCUS</div>
          <h2>{next ? "다음 세션" : "예정된 세션 없음"}</h2>
        </div>
        {heroBlock}
        {next ? (
          <SessionHistory campaignName={next.campaign.name} sessions={history} />
        ) : null}
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
                <span className="cl-status-pill">휴면 {dormantCount}</span>
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
