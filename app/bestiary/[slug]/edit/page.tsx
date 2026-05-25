import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthenticatedNickname } from "@/lib/auth";
import { getBestiaryEntry, listBestiaryCategories } from "@/lib/db";
import { BestiaryForm } from "@/components/vtt/BestiaryForm";
import { BestiaryDangerZone } from "@/components/vtt/BestiaryDangerZone";

export const dynamic = "force-dynamic";

export default async function BestiaryEditPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getBestiaryEntry(slug);
  if (!entry) notFound();

  const nick = await getAuthenticatedNickname();
  if (!nick) redirect(`/login?redirect=/bestiary/${slug}/edit`);
  if (entry.created_by !== nick) {
    redirect(`/bestiary/${slug}`);
  }
  const categories = await listBestiaryCategories();

  return (
    <>
      <div className="breadcrumb">
        <Link href="/bestiary">에너미</Link>
        <span className="sep">/</span>
        <Link href={`/bestiary/${slug}`}>{entry.name}</Link>
        <span className="sep">/</span>
        <span>편집</span>
      </div>
      <h1 className="page-title">{entry.name} 편집</h1>
      <p className="page-sub">변경한 내용은 즉시 모든 사용자에게 반영됩니다.</p>

      <BestiaryForm initial={entry} categories={categories} />

      <BestiaryDangerZone slug={entry.slug} name={entry.name} />
    </>
  );
}
