import { notFound } from "next/navigation";
import { getNickname } from "@/lib/auth";
import {
  getCampaign, getCharacter, listRecentCharacterRolls,
} from "@/lib/db";
import { CharacterSheet } from "@/components/vtt/CharacterSheet";

export const dynamic = "force-dynamic";

export default async function CharacterPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();
  const ch = await getCharacter(id);
  if (!ch) notFound();
  const [camp, nick, rolls] = await Promise.all([
    getCampaign(ch.campaign_id),
    getNickname(),
    listRecentCharacterRolls(id, 5),
  ]);
  const isOwner = nick === ch.owner_nick;

  return (
    <CharacterSheet
      character={ch}
      campaign={camp}
      recentRolls={rolls}
      isOwner={isOwner}
    />
  );
}
