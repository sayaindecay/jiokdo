import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCampaign, listAllCharactersOwnedBy, listBestiary,
  listCampaignCharacters, listSessions,
} from "@/lib/db";
import { getNickname } from "@/lib/auth";
import { SceneClient, type PcLite } from "./SceneClient";

export const dynamic = "force-dynamic";

export default async function ScenePage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();
  const camp = await getCampaign(id);
  if (!camp) notFound();
  const nick = await getNickname();
  const [chars, bestiary, sessions] = await Promise.all([
    listCampaignCharacters(id),
    listBestiary(),
    listSessions(id),
  ]);

  const isKeeper = nick != null && nick === camp.keeper_nick;
  const keeperChars = isKeeper
    ? await listAllCharactersOwnedBy(camp.keeper_nick)
    : [];

  const currentSession = sessions[0];

  const toPcLite = (c: typeof chars[number]): PcLite => ({
    id: c.id,
    name: c.name,
    occupation: c.occupation,
    attrs: c.attrs,
    hp: c.hp,
    hp_max: c.hp_max,
    skills: c.skills.map((s) => ({ name: s.name, value: s.value, group: s.group })),
    weapons: c.weapons.map((w) => ({ name: w.name, skill: w.skill, damage: w.damage })),
  });

  const pcLite = chars.map(toPcLite);
  const initialRows = chars.map((c) => ({
    id: `pc-${c.id}`,
    dex: c.attrs.dex,
    name: c.name,
    is_pc: true,
    hp: c.hp,
    hp_max: c.hp_max,
  }));

  return (
    <>
      <div className="play-topbar">
        <div className="breadcrumb">
          <Link href={`/campaigns/${camp.id}`}>{camp.name}</Link>
          <span className="sep">/</span>
          {currentSession ? (
            <>
              <span>세션 #{currentSession.number}</span>
              <span className="sep">/</span>
            </>
          ) : null}
          <span>장면 트래커</span>
        </div>
        <Link
          href={`/campaigns/${camp.id}/play`}
          className="play-tracker-link"
          title="세션 로그 / 본문 작성"
        >
          ☰ 플레이 페이지 →
        </Link>
      </div>

      <div className="section-head">
        <h2>장면 트래커</h2>
        <span className="count">라운드 · 행동 · NPC HP</span>
      </div>

      <SceneClient
        initialRows={initialRows}
        bestiary={bestiary}
        pcChars={pcLite}
        keeperChars={keeperChars.map(toPcLite)}
      />
    </>
  );
}
