import Link from "next/link";
import { Countdown } from "./Countdown";
import { CampaignForms } from "../CampaignForms";
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
        {/* 가장 중요한 두 가지를 강조 */}
        <Link
          href={`/campaigns/${campaign.id}/play`}
          className={`ms ms-hero${stats.unresolved_clues > 0 ? " warn" : ""}`}
        >
          <b>{stats.unresolved_clues}</b>
          <span>미해결 단서 →</span>
        </Link>
        <Link
          href={`/campaigns/${campaign.id}`}
          className={`ms ms-hero${stats.danger_pcs > 0 ? " warn" : ""}`}
        >
          <b>{stats.danger_pcs}</b>
          <span>위험 PC (SAN 30↓)</span>
        </Link>
        {/* 나머지는 ghost */}
        <Link href={`/campaigns/${campaign.id}`} className="ms ms-ghost">
          <b>{stats.total_sessions}</b>
          <span>지난 세션</span>
        </Link>
        <Link href={`/campaigns/${campaign.id}`} className="ms ms-ghost">
          <b>{hours}h</b>
          <span>누적 플레이</span>
        </Link>
      </div>
    </div>
  );
}

export function DashHeroEmpty({
  hasCampaign,
  showForms,
}: {
  hasCampaign: boolean;
  showForms?: boolean;
}) {
  return (
    <div className="dash-hero dash-hero-empty">
      <div className="label">
        {hasCampaign ? "예정된 세션 없음" : "아직 캠페인이 없습니다"}
      </div>
      <div className="campaign" style={{ marginTop: "0.5rem" }}>
        {hasCampaign ? "다음 세션 일정을 잡으세요" : "첫 캠페인을 시작하세요"}
      </div>
      <div className="sub">
        {hasCampaign
          ? "캠페인 상세에서 다음 세션의 예정 시각을 설정할 수 있습니다."
          : "캠페인을 만들면 멤버 초대 / 캐릭터 등록 / 세션 기록이 시작됩니다."}
      </div>
      {showForms ? (
        <div className="hero-forms">
          <CampaignForms />
        </div>
      ) : (
        <div className="cta-row">
          <Link href="/rulebook" className="btn ghost">룰북 보기</Link>
          <Link href="/bestiary" className="btn ghost">에너미</Link>
        </div>
      )}
    </div>
  );
}
