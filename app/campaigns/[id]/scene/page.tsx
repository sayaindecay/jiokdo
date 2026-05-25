import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCampaign, listBestiary, listCampaignCharacters, listSessions,
} from "@/lib/db";
import { SceneClient } from "./SceneClient";

export const dynamic = "force-dynamic";

export default async function ScenePage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();
  const camp = await getCampaign(id);
  if (!camp) notFound();
  const [chars, bestiary, sessions] = await Promise.all([
    listCampaignCharacters(id),
    listBestiary(),
    listSessions(id),
  ]);

  const currentSession = sessions[0]; // 가장 최근/높은 number

  // 기본 트래커: PC들 + 베스티어리 첫 항목을 NPC 2명으로 복제
  const focusedNpc = bestiary[0] ?? null;
  const rows = [
    ...chars.map((c, i) => ({
      id: `pc-${c.id}`,
      dex: c.attrs.dex,
      name: c.name,
      is_pc: true,
      hp: c.hp,
      hp_max: c.hp_max,
    })),
    ...(focusedNpc && focusedNpc.attrs.hp != null
      ? [1, 2].map((n) => ({
          id: `npc-${focusedNpc.slug}-${n}`,
          dex: focusedNpc.attrs.dex ?? 50,
          name: `${focusedNpc.name} #${n}`,
          is_pc: false,
          hp: focusedNpc.attrs.hp!,
          hp_max: focusedNpc.attrs.hp!,
        }))
      : []),
  ];

  return (
    <>
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

      <div className="section-head">
        <h2>장면 트래커</h2>
        <span className="count">라운드 · NPC · HP 추적</span>
      </div>

      <SceneClient
        rows={rows}
        focusedNpc={focusedNpc}
        otherNpcs={bestiary.slice(1, 5)}
      />
    </>
  );
}
