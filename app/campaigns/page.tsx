import Link from "next/link";
import { getNickname } from "@/lib/auth";
import {
  countCharactersInDanger, getCampaignAggregates, getNextScheduledSession,
  listActivityFor, listCampaignMembers, listMyCampaigns, listSessions,
} from "@/lib/db";
import { CampaignForms } from "@/components/CampaignForms";
import { DashHero, DashHeroEmpty } from "@/components/vtt/DashHero";
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
        <DashHeroEmpty hasCampaign={false} />
        <div className="section-head">
          <h2>닉네임이 필요합니다</h2>
        </div>
        <div className="empty">
          우측 상단에서 닉네임을 설정하면 캠페인을 만들거나 참여할 수 있습니다.
        </div>
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
    heroBlock = <DashHeroEmpty hasCampaign={campaigns.length > 0} />;
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

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">지옥도</Link>
        <span className="sep">/</span>
        <span>내 캠페인</span>
      </div>

      {heroBlock}

      {next ? <SessionHistory campaignName={next.campaign.name} sessions={history} /> : null}

      <div className="section-head">
        <h2>모든 캠페인</h2>
        <div className="actions">
          <span className="tag-pill accent">활성 {activeCount}</span>
          <span className="tag-pill">휴면 {dormantCount}</span>
        </div>
      </div>

      <CampaignsTable rows={rows} myNick={nick} />

      <div className="section-head">
        <h2>새 캠페인 / 초대 코드</h2>
      </div>
      <CampaignForms />

      <div style={{ height: "1.5rem" }} />
      <ActivityFeed items={activity} />
    </>
  );
}
