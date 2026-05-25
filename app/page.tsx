import Link from "next/link";
import { PeekWindow, type PeekItem } from "@/components/vtt/PeekWindow";
import { LiveTicker } from "@/components/vtt/LiveTicker";
import { getNickname } from "@/lib/auth";
import {
  countBestiary, countMyCampaigns, countRuleSections,
  getGlobalStats, getRecentNarrationsAndRolls, listMyCampaigns,
  listRecentDice,
} from "@/lib/db";

export const dynamic = "force-dynamic";

function nz(n: number, fallback: string = "—"): string {
  return n > 0 ? n.toLocaleString() : fallback;
}

export default async function LandingPage() {
  const nick = await getNickname();
  const [stats, recentDice, peekFlow, ruleCount, beastCount] = await Promise.all([
    getGlobalStats(),
    listRecentDice(5),
    getRecentNarrationsAndRolls(5),
    countRuleSections(),
    countBestiary(),
  ]);

  const myCounts = nick ? await countMyCampaigns(nick) : { campaigns: 0, play_entries: 0 };
  const myCampaigns = nick ? await listMyCampaigns(nick) : [];

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
          <div className="cta-row">
            <Link href="/campaigns" className="btn primary">
              {nick ? "내 캠페인 열기" : "시작하기"}
            </Link>
            <Link href="/rulebook" className="btn ghost">룰북 보기</Link>
          </div>
          <div className="peek-stats">
            <div className="stat">
              <b>{nz(stats.registered_nicks)}</b>
              <span>등록 닉네임</span>
            </div>
            <div className="stat">
              <b>{nz(stats.total_dice_rolls)}</b>
              <span>누적 굴림</span>
            </div>
            <div className="stat">
              <b>{nz(stats.this_week_sessions)}</b>
              <span>이번 주 세션</span>
            </div>
          </div>
        </div>
        <PeekWindow
          items={peekItems}
          isDemo={peekItems.length === 0}
          campaignTitle={
            peekItems.length === 0
              ? "jiokdo.app / 예시 흐름"
              : "jiokdo.app / 최근 세션"
          }
        />
      </section>

      <LiveTicker initial={tickerInitial} />

      <div className="section-head">
        <h2>들어가기</h2>
        <span className="count">3개 입구</span>
      </div>
      <div className="board-grid">
        <Link href="/campaigns" className="board-card">
          <h2>캠페인</h2>
          <p className="desc">키퍼·플레이어로 참여 중인 사건</p>
          <div className="stats">
            <span>
              <b>{nz(nick ? myCounts.campaigns : stats.registered_nicks, "0")}</b>{" "}
              {nick ? "내 캠페인" : "참여자"}
            </span>
            <span>
              <b>{nz(nick ? myCounts.play_entries : stats.total_dice_rolls, "0")}</b>{" "}
              {nick ? "내 굴림" : "굴림"}
            </span>
          </div>
          {nick && myCampaigns[0] ? (
            <div className="recent">
              <b>참여 중</b> · {myCampaigns[0].name}
            </div>
          ) : !nick ? (
            <div className="recent">
              <b>먼저</b> · 우측 상단에서 닉네임을 설정하세요
            </div>
          ) : null}
        </Link>

        <Link href="/rulebook" className="board-card">
          <h2>룰북</h2>
          <p className="desc">CoC 7판 핵심 규칙 · 판정 · 전투 · 이성</p>
          <div className="stats">
            <span><b>{nz(ruleCount, "0")}</b> 섹션</span>
          </div>
        </Link>

        <Link href="/bestiary" className="board-card">
          <h2>몬스터</h2>
          <p className="desc">스탯블록 · 신화 생물 · NPC</p>
          <div className="stats">
            <span><b>{nz(beastCount, "0")}</b> 항목</span>
          </div>
        </Link>
      </div>
    </>
  );
}
