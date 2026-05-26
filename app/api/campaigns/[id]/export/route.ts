import { NextResponse } from "next/server";
import { getAuthenticatedNickname } from "@/lib/auth";
import {
  getCampaign, listAllSessions, listCampaignCharacters,
  listCampaignMembers, listClues, listPlayEntries,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }
  const nick = await getAuthenticatedNickname();
  if (!nick) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const camp = await getCampaign(id);
  if (!camp) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (camp.keeper_nick !== nick) {
    return NextResponse.json({ error: "keeper only" }, { status: 403 });
  }
  const [members, characters, sessions, clues, entries] = await Promise.all([
    listCampaignMembers(id),
    listCampaignCharacters(id),
    listAllSessions(id),
    listClues(id),
    listPlayEntries(id),
  ]);
  const payload = {
    exported_at: new Date().toISOString(),
    schema_version: 1,
    campaign: camp,
    members,
    characters,
    sessions,
    clues,
    play_entries: entries,
  };
  const ymd = new Date().toISOString().slice(0, 10);
  const safeSlug = camp.slug.replace(/[^a-z0-9-]/gi, "") || `c${id}`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="jiokdo-campaign-${safeSlug}-${ymd}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
