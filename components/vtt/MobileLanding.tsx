import Link from "next/link";
import type { PeekItem } from "./PeekWindow";

type TickerRow = {
  id: number;
  who: string;
  expression: string;
  level: string | null;
  level_label: string | null;
  total: number;
  created_at: number;
};

type Stats = {
  registered_nicks: number;
  total_dice_rolls: number;
  this_week_sessions: number;
};

const QUESTIONNAIRE: string[] = [
  "이태백, 이소호, 최혜진, 천은이 모두 생존해있습니까?",
  "안세인, 백진아, 권효명, 천경석이 모두 생존해있습니까?",
  "지격환에게 정확히 무슨 일이 있었는지 알아내셨습니까?",
  "남상범의 마스크 아래에 무엇이 있는지 확인하셨습니까?",
  "특수사건수사팀이 쫓고 있는 사건이 무엇인지 파악하셨습니까?",
  "고신백과 이국세의 ‘계획’을 파악하셨습니까?",
  "파악하셨다면, 최종적으로 해당 계획은 어떻게 되었습니까?",
  "피재혁과 SHM의 목표가 무엇인지 파악하셨습니까?",
  "민관합동수사본부와 수사1팀이 공조 수사를 진행하였습니까?",
  "진행하였다면, 해당 수사의 결과는 무엇입니까?",
];

const LEVEL_CHIP: Record<string, { cls: string; label: string }> = {
  critical: { cls: "crit", label: "CRIT" },
  extreme: { cls: "ext", label: "EXT" },
  hard: { cls: "hard", label: "HARD" },
  regular: { cls: "reg", label: "REG" },
  fail: { cls: "fail", label: "FAIL" },
  fumble: { cls: "fumb", label: "FUMB" },
};

export function MobileLanding({
  nick,
  stats,
  peekItems,
  tickerInitial,
  isFresh,
}: {
  nick: string | null;
  stats: Stats;
  peekItems: PeekItem[];
  tickerInitial: TickerRow[];
  isFresh: boolean;
}) {
  const ctaHref = nick ? "/campaigns" : "/login?redirect=/campaigns";
  const ctaLabel = nick ? "내 캠페인 열기 →" : "지금 시작하기 →";

  return (
    <div className="m-landing">
      <section className="m-cover" aria-label="현장 보고서 №01">
        <div className="m-cover-rule">
          <span>Confidential · 대외비</span>
          <span className="file">FILE/01 · SEOUL 2007</span>
        </div>
        <div className="m-cover-body">
          <div className="m-stamp" aria-hidden="true">
            <span className="m-stamp-lbl">현장 보고서</span>
            <span className="m-stamp-num">
              №<b>01</b>
            </span>
          </div>
          <h1 className="m-quote">
            <span className="m-qm" aria-hidden="true">&ldquo;</span>
            <span className="m-quote-text">
              어쩌겠습니까.
              <br />
              <em>우리 세상은</em>
              <br />
              2000년대 초반부터
              <br />
              그렇게 된 것을.
            </span>
          </h1>
          <p className="m-cover-sub">
            Call of Cthulhu 7판 · 한국어 VTT
            <br />
            서울경찰청 특수사건수사팀 사건 기록 시스템
          </p>
        </div>
        <div className="m-cover-handle" aria-hidden="true">
          <span>오늘의 지옥도</span>
          <span className="m-handle-bar" />
          <span className="m-handle-arrow">▲ 끌어올리기</span>
        </div>
        <div className="m-cover-foot">
          <div className="m-cover-sign">— 서울경찰청 특수사건수사팀 —</div>
          <div className="m-cta-row">
            <Link href={ctaHref} className="btn primary m-cta-primary">
              {ctaLabel}
            </Link>
            <Link href="/rulebook" className="btn ghost m-cta-ghost">
              룰북
            </Link>
          </div>
        </div>
      </section>

      <section className="m-feed">
        <div className="m-feed-head">
          <div className="m-feed-eyebrow">
            <span className="m-feed-dot" aria-hidden="true" />
            오늘의 지옥도 · LIVE
          </div>
          <h2 className="m-feed-title">최근 활동</h2>
          <p className="m-feed-sub">
            지금 굴러가는 사건들의 묘사와 판정이 한 흐름으로.
          </p>
        </div>

        {peekItems.length === 0 && tickerInitial.length === 0 ? (
          <div className="m-feed-empty">
            아직 활동이 없습니다. 첫 캠페인을 시작해보세요.
          </div>
        ) : (
          <ol className="m-stream">
            {peekItems.map((p, i) => {
              const chip = p.level ? LEVEL_CHIP[p.level] : null;
              return (
                <li key={`p-${i}`} className="m-stream-row">
                  <div className="m-rail">
                    <span className="m-who">@{p.who}</span>
                  </div>
                  <div className={`m-body ${p.isDice ? "" : "narr"}`}>
                    {p.isDice && chip ? (
                      <span className={`m-roll ${chip.cls}`}>{chip.label}</span>
                    ) : null}
                    {p.text}
                  </div>
                </li>
              );
            })}
            {tickerInitial.slice(0, 4).map((t) => {
              const chip = t.level ? LEVEL_CHIP[t.level] : null;
              return (
                <li key={`t-${t.id}`} className="m-stream-row">
                  <div className="m-rail">
                    <span className="m-who">@{t.who}</span>
                  </div>
                  <div className="m-body">
                    {chip ? (
                      <span className={`m-roll ${chip.cls}`}>{chip.label}</span>
                    ) : null}
                    {t.expression}
                    <span className="m-total"> → {t.total}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {!isFresh ? (
          <dl className="m-stats">
            <div>
              <dt>등록 닉네임</dt>
              <dd>{stats.registered_nicks.toLocaleString()}</dd>
            </div>
            <div>
              <dt>누적 굴림</dt>
              <dd>{stats.total_dice_rolls.toLocaleString()}</dd>
            </div>
            <div>
              <dt>이번 주</dt>
              <dd>{stats.this_week_sessions.toLocaleString()}</dd>
            </div>
          </dl>
        ) : (
          <div className="m-fresh">
            <span aria-hidden="true">✦</span> 초기 운영 중입니다. 첫 캠페인이 등록되면 통계가 누적됩니다.
          </div>
        )}

        <details className="m-acc">
          <summary>
            <span>이 사건의 질문지 — {QUESTIONNAIRE.length + 2}개 항목</span>
            <span className="m-acc-chev" aria-hidden="true">▾</span>
          </summary>
          <div className="m-acc-body">
            {QUESTIONNAIRE.map((q) => (
              <p key={q}>{q}</p>
            ))}
            <p className="m-acc-strong">
              이미 벌어진 일 역시 바꿀 수 있다는 확신을 얻으셨습니까?
            </p>
            <p className="m-acc-final">이 모든 일을 끝낼 준비가 되셨습니까?</p>
          </div>
        </details>

        <div className="m-pinned-cta">
          <Link href={ctaHref} className="btn primary">
            {ctaLabel}
          </Link>
          <Link href="/rulebook" className="btn ghost">
            룰북
          </Link>
        </div>
      </section>
    </div>
  );
}
