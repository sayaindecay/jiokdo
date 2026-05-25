import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getNickname } from "@/lib/auth";
import { getCharacter } from "@/lib/db";
import { CharacterEditClient } from "@/components/vtt/CharacterEditClient";
import { DangerZone } from "@/components/vtt/DangerZone";

export const dynamic = "force-dynamic";

export default async function CharacterEditPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();
  const ch = await getCharacter(id);
  if (!ch) notFound();
  const nick = await getNickname();
  if (!nick || nick !== ch.owner_nick) {
    redirect(`/characters/${id}`);
  }

  return (
    <>
      <div className="breadcrumb">
        <Link href={`/characters/${id}`}>{ch.name}</Link>
        <span className="sep">/</span>
        <span>편집</span>
      </div>

      <h1 className="page-title">시트 편집</h1>
      <p className="page-sub">
        기본 정보·능력치·최대치·배경·기능치를 수정할 수 있습니다.
      </p>

      <CharacterEditClient character={ch} />

      <DangerZone characterId={id} characterName={ch.name} />
    </>
  );
}
