import { NextResponse } from "next/server";
import { listCombatDrafts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const campaignId = Number(id);
  if (!Number.isFinite(campaignId)) {
    return NextResponse.json({ error: "잘못된 캠페인 ID" }, { status: 400 });
  }
  const items = await listCombatDrafts(campaignId);
  return NextResponse.json({ items });
}
