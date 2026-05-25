import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedNickname } from "@/lib/auth";
import { AuthTabs } from "@/components/vtt/AuthTabs";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; redirect?: string }>;
}) {
  const sp = await searchParams;
  const nick = await getAuthenticatedNickname();
  if (nick) redirect(sp.redirect || "/campaigns");

  const initialTab = sp.tab === "login" ? "login" : "signup";
  const redirectTo = sp.redirect ?? "/campaigns";

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">지옥도</Link>
        <span className="sep">/</span>
        <span>계정</span>
      </div>
      <div style={{ maxWidth: 480, margin: "1rem auto 0" }}>
        <h1 className="page-title" style={{ textAlign: "center" }}>
          닉네임으로 들어오세요
        </h1>
        <p className="page-sub" style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          이메일은 받지 않습니다. 닉네임 + 비밀번호만으로 캠페인을 운영합니다.
        </p>
        <AuthTabs initialTab={initialTab} redirectTo={redirectTo} />
        <p
          style={{
            marginTop: "1rem",
            textAlign: "center",
            fontSize: "0.78rem",
            color: "var(--ink-3)",
            fontFamily: "var(--font-anno)",
          }}
        >
          ⚠ 비밀번호 분실 시 복구 수단이 없습니다 (이메일 받지 않음). 안전하게 보관하세요.
        </p>
      </div>
    </>
  );
}
