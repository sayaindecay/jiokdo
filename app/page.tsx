import Link from "next/link";
import { getNickname } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const nick = await getNickname();
  return (
    <>
      <section className="hero">
        <div className="hero-tag">Call of Cthulhu · 비동기 VTT</div>
        <h1 className="hero-title">
          글로 굴리고,<br />
          영원히 기록되는 다이스.
        </h1>
        <p className="hero-sub">
          지옥도는 비동기 텍스트 기반의 가상 테이블탑입니다.
          본문에 명령을 끼워 굴리면, 결과가 글에 새겨져 사후 조작이 불가능해집니다.
          시간대가 다른 친구들과 한 세션을 며칠에 걸쳐 천천히 진행하세요.
        </p>
        <div className="hero-cta">
          <Link href="/campaigns" className="btn large">
            {nick ? "내 캠페인으로" : "시작하기"}
          </Link>
          <Link href="/rules" className="btn ghost large">룰북 보기</Link>
        </div>
      </section>

      <section className="feature-grid">
        <Link href="/rules" className="feature-card">
          <div className="feature-icon">📜</div>
          <h3>룰북 열람</h3>
          <p>핵심 규칙, 판정, 전투, 이성. 옆에 둔 채로 진행합니다.</p>
        </Link>
        <Link href="/bestiary" className="feature-card">
          <div className="feature-icon">🐙</div>
          <h3>스탯블록 / 몬스터</h3>
          <p>딥 원부터 쇼고스까지. 한 클릭으로 능력치 인용.</p>
        </Link>
        <Link href="/campaigns" className="feature-card">
          <div className="feature-icon">🎲</div>
          <h3>캠페인 대시보드</h3>
          <p>플레이어, 캐릭터, 세션 로그를 한 화면에서 관리.</p>
        </Link>
        <Link href={nick ? "/campaigns" : "/campaigns"} className="feature-card">
          <div className="feature-icon">📖</div>
          <h3>캐릭터 시트</h3>
          <p>능력치/HP/SAN/기능치. 시트에서 바로 판정 굴림.</p>
        </Link>
      </section>

      <section className="how-section">
        <h2 className="section-title">어떻게 동작하나요</h2>
        <div className="steps">
          <div className="step">
            <div className="step-num">1</div>
            <h4>닉네임 설정</h4>
            <p>가입 없이 닉네임만으로. 우측 상단에서 설정하세요.</p>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <h4>캠페인 생성 또는 참여</h4>
            <p>키퍼는 캠페인을 만들고, 플레이어는 초대 코드로 참여합니다.</p>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <h4>캐릭터 생성</h4>
            <p>샘플 시트로 빠르게 시작하거나 백지에서 채워 넣으세요.</p>
          </div>
          <div className="step">
            <div className="step-num">4</div>
            <h4>플레이</h4>
            <p>플레이 페이지에 글을 남기고, 본문에 <code>/cc 탐색 65</code> 한 줄로 굴립니다.</p>
          </div>
        </div>
      </section>
    </>
  );
}
