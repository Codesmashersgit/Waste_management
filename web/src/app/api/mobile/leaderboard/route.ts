import { NextResponse } from "next/server";
import { authenticateMobileRequest, MobileAuthError } from "@backend/mobile-auth";
import { getMobileLeaderboard } from "@backend/db/mobile-actions";

export async function GET(request: Request) {
  try {
    await authenticateMobileRequest(request);
    const parsed = Number(new URL(request.url).searchParams.get("limit") || 20);
    const limit = Number.isSafeInteger(parsed) ? Math.min(Math.max(parsed, 1), 50) : 20;
    const leaderboard = await getMobileLeaderboard(limit);
    return NextResponse.json(leaderboard, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Mobile leaderboard request failed:", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ error: "Could not load the community leaderboard." }, { status: 500 });
  }
}
