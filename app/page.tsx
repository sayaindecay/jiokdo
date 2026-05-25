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
          <span className="eyebrow">현장 보고서 №01 · 2007</span>
          <h1 className="hero-title-quote">
            어쩌겠습니까.<br />
            <em>우리 세상은</em> 2000년대 초반부터<br />
            그렇게 된 것을.
          </h1>
          <div className="hero-questionnaire" role="list">
            <p role="listitem">이태백, 이소호, 최혜진, 천은이 모두 생존해있습니까?</p>
            <p role="listitem">안세인, 백진아, 권효명, 천경석이 모두 생존해있습니까?</p>
            <p role="listitem">지격환에게 정확히 무슨 일이 있었는지 알아내셨습니까?</p>
            <p role="listitem">남상범의 마스크 아래에 무엇이 있는지 확인하셨습니까?</p>
            <p role="listitem">특수사건수사팀이 쫓고 있는 사건이 무엇인지 파악하셨습니까?</p>
            <p role="listitem">고신백과 이국세의 &lsquo;계획&rsquo;을 파악하셨습니까?</p>
            <p role="listitem">파악하셨다면, 최종적으로 해당 계획은 어떻게 되었습니까?</p>
            <p role="listitem">피재혁과 SHM의 목표가 무엇인지 파악하셨습니까?</p>
            <p role="listitem">민관합동수사본부와 수사1팀이 공조 수사를 진행하였습니까?</p>
            <p role="listitem">진행하였다면, 해당 수사의 결과는 무엇입니까?</p>
            <p className="hr-strong" role="listitem">
              이미 벌어진 일 역시 바꿀 수 있다는 확신을 얻으셨습니까?
            </p>
            <p className="hr-divider" aria-hidden="true">— 마지막으로, —</p>
            <p className="hr-final" role="listitem">
              이 모든 일을 끝낼 준비가 되셨습니까?
            </p>
          </div>

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
