import Link from "next/link";
import { Countdown } from "./Countdown";
import type { Campaign, Session } from "@/lib/types";
import { campaignHueStyle } from "@/lib/hue";

export function DashHero({
  campaign, session, stats,
}: {
  campaign: Campaign;
  session: Session;
  stats: { unresolved_clues: number; danger_pcs: number; total_sessions: number; total_play_ms: number };
}) {
  const hours = Math.round(stats.total_play_ms / (3600 * 1000));
  return (
    <div className="dash-hero" style={campaignHueStyle(campaign.slug)}>
      <div className="label">다음 세션까지</div>
      {session.scheduled_at ? (
        <Countdown targetMs={session.scheduled_at} />
      ) : (
        <div className="countdown"><em>—</em></div>
      )}
      <div className="campaign">
        {campaign.name} · 세션 #{session.number}
      </div>
      <div className="sub">
        키퍼: {campaign.keeper_nick} · {session.title}
      </div>
      <div className="cta-row">
        <Link href={`/campaigns/${campaign.id}/play`} className="btn">세션 입장</Link>
        <Link href={`/campaigns/${campaign.id}`} className="btn ghost">준비 페이지</Link>
      </div>
      <div className="mini-stats">
        <Link
          href={`/campaigns/${campaign.id}/play`}
          className={`ms${stats.unresolved_clues > 0 ? " warn" : ""}`}
        >
          <b>{stats.unresolved_clues}</b>
          <span>미해결 단서 →</span>
        </Link>
        <Link href={`/campaigns/${campaign.id}`} className="ms">
          <b>{stats.danger_pcs}</b>
          <span>위험 PC (SAN 30↓)</span>
        </Link>
        <Link href={`/campaigns/${campaign.id}`} className="ms">
          <b>{stats.total_sessions}</b>
          <span>지난 세션 수</span>
        </Link>
        <Link href={`/campaigns/${campaign.id}`} className="ms">
          <b>{hours}h</b>
          <span>누적 플레이</span>
        </Link>
      </div>
    </div>
  );
}

export function DashHeroEmpty({ hasCampaign }: { hasCampaign: boolean }) {
  return (
    <div className="dash-hero">
      <div className="label">{hasCampaign ? "예정된 세션 없음" : "아직 캠페인이 없습니다"}</div>
      <div className="countdown"><em>—</em></div>
      <div className="campaign">
        {hasCampaign ? "다음 세션 일정을 잡으세요" : "캠페인을 만들어 보세요"}
      </div>
      <div className="sub">
        {hasCampaign
          ? "캠페인 상세에서 다음 세션의 예정 시각을 설정할 수 있습니다."
          : "캠페인을 만들거나 초대 코드로 참여하면 여기에 카운트다운이 표시됩니다."}
      </div>
      <div className="cta-row">
        <Link href="/campaigns" className="btn">{hasCampaign ? "캠페인 보기" : "캠페인 만들기"}</Link>
        <Link href="/rulebook" className="btn ghost">룰북 보기</Link>
      </div>
    </div>
  );
}
