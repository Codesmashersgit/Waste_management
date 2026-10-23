import { NextResponse } from "next/server";
import { getUserSession } from "@/server/auth";
import { getMobileLeaderboard } from "@backend/db/mobile-actions";

export async function GET() {
  if (!await getUserSession()) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const leaders = await getMobileLeaderboard(50);
  return NextResponse.json(leaders, { headers: { "Cache-Control": "no-store" } });
}
