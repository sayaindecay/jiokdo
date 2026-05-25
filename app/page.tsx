import Link from "next/link";
import { PeekWindow } from "@/components/vtt/PeekWindow";
import { LiveTicker } from "@/components/vtt/LiveTicker";
import { getNickname } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const nick = await getNickname();
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
              {nick ? "내 캠페인 열기" : "캠페인 시작"}
            </Link>
            <Link href="/rules" className="btn ghost">룰북 보기</Link>
          </div>
          <div className="peek-stats">
            <div className="stat"><b>3,418</b><span>등록 탐사자</span></div>
            <div className="stat"><b>12,907</b><span>누적 굴림</span></div>
            <div className="stat"><b>847</b><span>이번 주 세션</span></div>
          </div>
        </div>
        <PeekWindow />
      </section>

      <LiveTicker />

      <div className="section-head">
        <h2>들어가기</h2>
        <span className="count">3개 입구</span>
      </div>
      <div className="board-grid">
        <Link href="/campaigns" className="board-card">
          <h2>캠페인</h2>
          <p className="desc">내가 키퍼·플레이어로 참여 중인 사건</p>
          <div className="stats"><span><b>247</b> 활성</span><span><b>1.2k</b> 세션</span></div>
          <div className="recent"><b>방금</b> · 이도윤: 「토요일 9시 켈러 시나리오 4인 모집 中…」</div>
        </Link>
        <Link href="/rules" className="board-card">
          <h2>룰북</h2>
          <p className="desc">CoC 7판 핵심 규칙 · 판정 · 전투 · 이성</p>
          <div className="stats"><span><b>96</b> 섹션</span><span><b>540</b> 참조</span></div>
          <div className="recent"><b>3분 전</b> · 키퍼 박: 「하드/극단 판정 §4 — 인용함…」</div>
        </Link>
        <Link href="/bestiary" className="board-card">
          <h2>몬스터</h2>
          <p className="desc">스탯블록 · 신화 생물 · NPC</p>
          <div className="stats"><span><b>312</b> 항목</span><span><b>4.8k</b> 참조</span></div>
          <div className="recent"><b>1시간 전</b> · 박씨: 「쇼고스 등장 — 1d6/1d20 SAN…」</div>
        </Link>
      </div>
    </>
  );
}
