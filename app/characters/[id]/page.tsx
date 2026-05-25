import Link from "next/link";
import { notFound } from "next/navigation";
import { getNickname } from "@/lib/auth";
import { getCampaign, getCharacter } from "@/lib/db";
import { CharacterVitalsEditor } from "@/components/CharacterVitalsEditor";
import { CharacterSheetView } from "@/components/CharacterSheetView";

export const dynamic = "force-dynamic";

export default async function CharacterPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();
  const ch = await getCharacter(id);
  if (!ch) notFound();
  const camp = await getCampaign(ch.campaign_id);
  const nick = await getNickname();
  const isOwner = nick === ch.owner_nick;

  return (
    <>
      <div className="breadcrumb">
        <Link href="/campaigns">캠페인</Link>
        <span className="sep">/</span>
        {camp ? <Link href={`/campaigns/${camp.id}`}>{camp.name}</Link> : null}
        <span className="sep">/</span>
        <span>{ch.name}</span>
      </div>

      <div className="char-header">
        <div>
          <h1 className="page-title">{ch.name}</h1>
          <p className="page-sub">
            {ch.occupation || "직업 미기재"} · {ch.age ?? "나이 미기재"}세 · @{ch.owner_nick}
          </p>
        </div>
        {camp ? (
          <Link href={`/campaigns/${camp.id}/play`} className="btn ghost">
            플레이 페이지 →
          </Link>
        ) : null}
      </div>

      {isOwner ? (
        <CharacterVitalsEditor character={ch} />
      ) : (
        <CharacterSheetView character={ch} />
      )}
    </>
  );
}
