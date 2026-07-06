import Link from "next/link";
import { PeekWindow, type PeekItem } from "@/components/vtt/PeekWindow";
import { LiveTicker } from "@/components/vtt/LiveTicker";
import { MobileLanding } from "@/components/vtt/MobileLanding";
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
    <MobileLanding nick={nick} />
    <div className="landing landing-desktop">
      <section className="hero-doc">
        <header className="hd-corners">
          <div className="hd-stamp" aria-hidden="true">
            <div className="hd-stamp-label">현장 보고서</div>
            <div className="hd-stamp-num">№<b>01</b></div>
          </div>
          <div className="hd-meta">
            <div className="hd-classification">CONFIDENTIAL · 대외비</div>
            <div className="hd-date">SEOUL · 2007</div>
            <div className="hd-file">FILE/01.SEOUL.2007</div>
          </div>
        </header>

        <div className="hd-body">
          <h1 className="hd-quote">
            <span className="hd-q-mark" aria-hidden="true">“</span>
            <span className="hd-q-text">
              어쩌겠습니까.<br />
              <em>우리 세상은</em> 2000년대 초반부터<br />
              그렇게 된 것을.
            </span>
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
        </div>

        <footer className="hd-footer">
          <div className="hd-cta-row">
            <Link
              href={nick ? "/campaigns" : "/login?redirect=/campaigns"}
              className="btn primary large"
            >
              {nick ? "내 캠페인 열기 →" : "지금 시작하기 →"}
            </Link>
            <Link href="/rulebook" className="btn ghost">
              먼저 룰북 보기
            </Link>
          </div>

          {isFresh ? (
            <div className="hd-fresh">
              <span aria-hidden="true">✦</span>
              초기 운영 중입니다. 첫 캠페인이 등록되면 통계가 여기에 누적됩니다.
            </div>
          ) : (
            <dl className="hd-stats">
              <div>
                <dt>등록 닉네임</dt>
                <dd>{stats.registered_nicks.toLocaleString()}</dd>
              </div>
              <div>
                <dt>누적 굴림</dt>
                <dd>{stats.total_dice_rolls.toLocaleString()}</dd>
              </div>
              <div>
                <dt>이번 주 세션</dt>
                <dd>{stats.this_week_sessions.toLocaleString()}</dd>
              </div>
            </dl>
          )}

          <div className="hd-sign">— 서울경찰청 특수사건수사팀 —</div>
        </footer>
      </section>

      <section className="hero-aside">
        <div className="ha-eyebrow">최근 세션 · 미리보기</div>
        <PeekWindow
          items={peekItems}
          isDemo={peekItems.length === 0}
          campaignTitle={
            peekItems.length === 0
              ? "jiokdo.app · 예시 흐름"
              : "jiokdo.app · 최근 세션"
          }
        />
        <LiveTicker initial={tickerInitial} />
      </section>
    </div>
    </>
  );
}
