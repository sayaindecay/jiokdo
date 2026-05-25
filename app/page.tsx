import Link from "next/link";
import { PeekWindow, type PeekItem } from "@/components/vtt/PeekWindow";
import { LiveTicker } from "@/components/vtt/LiveTicker";
import { getNickname } from "@/lib/auth";
import { getGlobalStats, getRecentNarrationsAndRolls, listRecentDice } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const nick = await getNickname();
  const [stats, recentDice, peekFlow] = await Promise.all([
    getGlobalStats(),
    listRecentDice(5),
    getRecentNarrationsAndRolls(5),
  ]);

  const peekItems: PeekItem[] = peekFlow.map((p) => ({
    who: p.who,
    text: p.text,
    isDice: p.isDice,
    level: p.level,
    level_label: p.level_label,
  }));

  const tickerInitial = recentDice.map((d) => ({
    id: d.id,
    who: d.character_name || d.nickname,
    expression: d.expression,
    level: d.level,
    level_label: d.level_label,
    total: d.total,
    created_at: d.created_at,
  }));

  const totalSignal = stats.registered_nicks + stats.total_dice_rolls + stats.this_week_sessions;
  const isFresh = totalSignal === 0;

  return (
    <>
      <section className="peek-hero">
        <div className="peek-copy">
          <span className="eyebrow">현장 보고서 №01 · 1928</span>
          <h1>
            TRPG 한 판,<br />
            <em>한 줄</em> 굴림으로.
          </h1>
          <p className="lede">
            지옥도는 글과 다이스를 한 곳에서 굴립니다. Call of Cthulhu의 1d100 판정부터
            일반 NdM까지, 본문 안에 굴림을 끼워 넣고 세션을 그대로 보존합니다.
          </p>

          {/* 1.1 CTA 위계 강화 */}
          <div className="cta-row">
            <Link href={nick ? "/campaigns" : "/login?redirect=/campaigns"} className="btn primary large">
              {nick ? "내 캠페인 열기 →" : "지금 시작하기 →"}
            </Link>
            <Link href="/rulebook" className="btn ghost">
              먼저 룰북 보기
            </Link>
          </div>

          {/* 1.2 / 1.6 통계 빈 상태 / 라벨 강조 */}
          {isFresh ? (
            <div className="hero-fresh">
              <span aria-hidden="true">✦</span>
              초기 운영 중입니다. 첫 캠페인이 등록되면 통계가 여기에 누적됩니다.
            </div>
          ) : (
            <div className="peek-stats">
              <div className="stat">
                <b>{stats.registered_nicks.toLocaleString()}</b>
                <span>등록 닉네임</span>
              </div>
              <div className="stat">
                <b>{stats.total_dice_rolls.toLocaleString()}</b>
                <span>누적 굴림</span>
              </div>
              <div className="stat">
                <b>{stats.this_week_sessions.toLocaleString()}</b>
                <span>이번 주 세션</span>
              </div>
            </div>
          )}
        </div>
        <PeekWindow
          items={peekItems}
          isDemo={peekItems.length === 0}
          campaignTitle={
            peekItems.length === 0
              ? "jiokdo.app · 예시 흐름"
              : "jiokdo.app · 최근 세션"
          }
        />
      </section>

      <LiveTicker initial={tickerInitial} />
    </>
  );
}
