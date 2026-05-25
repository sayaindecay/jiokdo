import { NextResponse } from "next/server";
import { listRecentDice } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit") || 5)));
  const items = await listRecentDice(limit);
  return NextResponse.json({ items });
}
