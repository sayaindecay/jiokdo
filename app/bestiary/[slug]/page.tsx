import Link from "next/link";
import { notFound } from "next/navigation";
import { getBestiaryEntry } from "@/lib/db";
import { StatBlock } from "@/components/vtt/StatBlock";

export const dynamic = "force-dynamic";

export default async function BestiaryDetail({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getBestiaryEntry(slug);
  if (!e) notFound();

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">지옥도</Link>
        <span className="sep">/</span>
        <Link href="/bestiary">몬스터</Link>
        <span className="sep">/</span>
        <span>{e.name}</span>
      </div>
      <StatBlock entry={e} />
    </>
  );
}
