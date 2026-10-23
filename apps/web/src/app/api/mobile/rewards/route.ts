import { NextResponse } from "next/server";
import { authenticateMobileRequest, MobileAuthError } from "@backend/mobile-auth";
import { getRewardTransactions, getUserBalance } from "@backend/db/actions";

export async function GET(request: Request) {
  try {
    const user = await authenticateMobileRequest(request);
    const [balance, transactions] = await Promise.all([
      getUserBalance(user.id), getRewardTransactions(user.id),
    ]);
    return NextResponse.json({ balance, transactions }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Mobile rewards request failed:", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ error: "Could not load points." }, { status: 500 });
  }
}
