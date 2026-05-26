import { NextResponse } from "next/server";
import { getAuthenticatedNickname } from "@/lib/auth";
import {
  findUser, listAllCharactersOwnedBy, listAllPlayEntriesAuthoredBy,
  listBestiaryCreatedBy, listMyCampaigns,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const nick = await getAuthenticatedNickname();
  if (!nick) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [user, campaigns, characters, entries, bestiary] = await Promise.all([
    findUser(nick),
    listMyCampaigns(nick),
    listAllCharactersOwnedBy(nick),
    listAllPlayEntriesAuthoredBy(nick),
    listBestiaryCreatedBy(nick),
  ]);
  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }
  const payload = {
    exported_at: new Date().toISOString(),
    schema_version: 1,
    user: {
      nickname: user.nickname,
      created_at: user.created_at,
      last_login_at: user.last_login_at,
    },
    campaigns: campaigns.map((c) => ({
      id: c.id, slug: c.slug, name: c.name, description: c.description,
      keeper_nick: c.keeper_nick, status: c.status, created_at: c.created_at,
      my_role: c.keeper_nick === nick ? "keeper" : "player",
    })),
    characters,
    play_entries: entries,
    bestiary,
  };
  const ymd = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="jiokdo-${nick}-${ymd}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
