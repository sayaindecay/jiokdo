export default function HelpPage() {
  return (
    <>
      <h1 className="page-title">도움말</h1>
      <p className="page-sub">글과 댓글 안에서 사용할 수 있는 다이스 명령</p>

      <div className="help-card">
        <h3>일반 굴림</h3>
        <p>
          한 줄에 <code>/roll NdM</code> 또는 <code>/r NdM</code> 형식으로 입력합니다. 더하기/빼기 보정도
          가능합니다.
        </p>
        <ul>
          <li>
            <code>/roll 1d100</code> — 1~100 사이의 수 1개
          </li>
          <li>
            <code>/r 3d6</code> — 주사위 3개의 합 (능력치 굴림)
          </li>
          <li>
            <code>/roll 2d10+4</code> — 2d10에 +4 보정
          </li>
        </ul>
      </div>

      <div className="help-card">
        <h3>CoC 1d100 판정</h3>
        <p>
          <code>/cc [이름] 기능치</code> 형식. 기능치는 1~100 사이의 정수.
        </p>
        <ul>
          <li>
            <code>/cc 50</code> — 무명의 1d100 판정 (기능치 50)
          </li>
          <li>
            <code>/cc 탐색 65</code> — &ldquo;탐색&rdquo; 라벨이 붙은 판정
          </li>
        </ul>
        <p style={{ marginTop: "0.7rem", color: "var(--text-dim)", fontSize: "0.88rem" }}>
          판정 단계는 다음 규칙을 따릅니다:
        </p>
        <ul>
          <li>
            <b>결정적 성공</b>: 굴림이 1
          </li>
          <li>
            <b>극단적 성공</b>: 굴림 ≤ 기능치 / 5
          </li>
          <li>
            <b>어려운 성공</b>: 굴림 ≤ 기능치 / 2
          </li>
          <li>
            <b>일반 성공</b>: 굴림 ≤ 기능치
          </li>
          <li>
            <b>실패</b>: 굴림 &gt; 기능치
          </li>
          <li>
            <b>펌블</b>: 기능치 50 미만이면 96~100, 50 이상이면 100
          </li>
        </ul>
      </div>

      <div className="help-card">
        <h3>롤플레잉 작성 팁</h3>
        <ul>
          <li>본문 안에 다이스 줄을 직접 끼워 넣어 사건과 함께 굴리세요.</li>
          <li>한 줄에는 명령 한 개만 적습니다. (앞뒤에 텍스트 같이 쓰면 안 됨)</li>
          <li>닉네임은 글마다 자유롭게 바꿔 캐릭터별로 발언할 수 있습니다.</li>
        </ul>
      </div>
    </>
  );
}
