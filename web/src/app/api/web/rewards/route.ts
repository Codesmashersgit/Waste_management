import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUserSession } from "@/server/auth";
import { db } from "@backend/db/dbConfig";
import { Users } from "@backend/db/schema";
import { getAvailableRewards, getRewardTransactions, getUserBalance, redeemReward } from "@backend/db/actions";

async function currentUser() {
  const email = await getUserSession();
  if (!email) return null;
  const [user] = await db.select().from(Users).where(eq(Users.email, email)).limit(1);
  return user ?? null;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const [balance, rewards, transactions] = await Promise.all([
    getUserBalance(user.id), getAvailableRewards(user.id), getRewardTransactions(user.id),
  ]);
  return NextResponse.json({ balance, rewards, transactions }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const rewardId = Number(body.rewardId);
  if (!Number.isSafeInteger(rewardId) || rewardId < 0) return NextResponse.json({ error: "Choose a valid reward." }, { status: 400 });
  try {
    await redeemReward(user.id, rewardId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not redeem this reward." }, { status: 400 });
  }
}
