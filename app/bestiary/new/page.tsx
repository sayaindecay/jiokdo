import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedNickname } from "@/lib/auth";
import { BestiaryForm } from "@/components/vtt/BestiaryForm";

export const dynamic = "force-dynamic";

export default async function NewBestiaryPage() {
  const nick = await getAuthenticatedNickname();
  if (!nick) redirect("/login?redirect=/bestiary/new");

  return (
    <>
      <div className="breadcrumb">
        <Link href="/bestiary">에너미</Link>
        <span className="sep">/</span>
        <span>새 항목</span>
      </div>
      <h1 className="page-title">에너미 새 항목</h1>
      <p className="page-sub">
        @{nick} 으로 등록됩니다. 본인이 등록한 항목만 추후 편집·삭제할 수 있습니다.
      </p>
      <BestiaryForm />
    </>
  );
}
