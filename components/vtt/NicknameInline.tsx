import Link from "next/link";

export function NicknameInline({ redirect }: { redirect: string }) {
  const q = encodeURIComponent(redirect);
  return (
    <div className="dash-hero" style={{ marginBottom: "1rem" }}>
      <div className="label">먼저 계정이 필요합니다</div>
      <div className="campaign" style={{ marginTop: "0.5rem" }}>
        캠페인을 만들고 캐릭터를 보관하려면 닉네임 + 비밀번호로 계정을 만드세요.
      </div>
      <div className="sub">
        이메일은 받지 않습니다. 잊으면 복구되지 않으니 안전하게 보관하세요.
      </div>
      <div className="cta-row" style={{ marginTop: "1rem" }}>
        <Link href={`/login?tab=signup&redirect=${q}`} className="btn primary">
          가입하기 →
        </Link>
        <Link href={`/login?tab=login&redirect=${q}`} className="btn ghost">
          이미 계정이 있어요
        </Link>
      </div>
    </div>
  );
}
