import Link from "next/link";

type Step = {
  id: string;
  done: boolean;
  label: string;
  hint: string;
  href?: string;
};

export function KeeperChecklist({
  campaignId,
  membersCount,
  sessionsCount,
  entriesCount,
}: {
  campaignId: number;
  membersCount: number;
  sessionsCount: number;
  entriesCount: number;
}) {
  const steps: Step[] = [
    {
      id: "create",
      done: true,
      label: "캠페인 만들기",
      hint: "완료",
    },
    {
      id: "invite",
      done: membersCount > 1,
      label: "멤버 초대",
      hint: membersCount > 1
        ? `${membersCount}명 합류`
        : "위쪽 초대 코드 / 공유 링크를 플레이어에게 보내세요.",
    },
    {
      id: "session",
      done: sessionsCount > 0,
      label: "첫 세션 일정",
      hint: sessionsCount > 0
        ? `세션 ${sessionsCount}개 등록됨`
        : "전투 트래커에서 첫 세션을 만들 수 있습니다.",
      href: `/campaigns/${campaignId}/play?mode=tracker`,
    },
    {
      id: "post",
      done: entriesCount > 0,
      label: "첫 묘사 작성",
      hint: entriesCount > 0
        ? `플레이 로그 ${entriesCount}건`
        : "플레이 페이지에서 장면을 묘사하면 플레이어가 응답할 수 있습니다.",
      href: `/campaigns/${campaignId}/play`,
    },
  ];

  const remaining = steps.filter((s) => !s.done).length;
  if (remaining === 0) return null;

  return (
    <section className="kc-card">
      <header className="kc-head">
        <div>
          <div className="kc-eyebrow">키퍼 첫 단계</div>
          <h2 className="kc-title">남은 준비 {remaining}개</h2>
        </div>
        <span className="kc-pulse" aria-hidden="true" />
      </header>
      <ol className="kc-steps">
        {steps.map((s, i) => (
          <li key={s.id} className={`kc-step${s.done ? " done" : ""}`}>
            <span className="kc-num" aria-hidden="true">
              {s.done ? "✓" : i + 1}
            </span>
            <div className="kc-body">
              <div className="kc-label">{s.label}</div>
              <div className="kc-hint">{s.hint}</div>
            </div>
            {s.href && !s.done ? (
              <Link href={s.href} className="kc-go">바로가기 →</Link>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
