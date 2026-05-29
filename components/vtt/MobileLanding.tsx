import Link from "next/link";

export function MobileLanding({ nick }: { nick: string | null }) {
  const ctaHref = nick ? "/campaigns" : "/login?redirect=/campaigns";
  const ctaLabel = nick ? "내 캠페인 열기 →" : "지금 시작하기 →";

  return (
    <div className="m-landing">
      <section className="m-cover" aria-label="지옥도">
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
        <div className="m-cover-foot">
          <div className="m-cover-sign">— 서울경찰청 특수사건수사팀 —</div>
          <Link href={ctaHref} className="btn primary m-cta-primary">
            {ctaLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}
