import { randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { authenticateMobileRequest, MobileAuthError } from "@backend/mobile-auth";
import { db } from "@backend/db/dbConfig";
import { Users } from "@backend/db/schema";

export const runtime = "nodejs";

const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const createCode = () => Array.from(randomBytes(8), byte => codeAlphabet[byte % codeAlphabet.length]).join("");

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export async function GET(request: Request) {
  try {
    const user = await authenticateMobileRequest(request);
    if (user.role !== "citizen") return NextResponse.json({ error: "Citizen access is required." }, { status: 403 });

    let code = user.referralCode;
    for (let attempt = 0; !code && attempt < 4; attempt += 1) {
      const candidate = createCode();
      try {
        const [updated] = await db.update(Users).set({ referralCode: candidate }).where(and(
          eq(Users.id, user.id), isNull(Users.referralCode),
        )).returning({ referralCode: Users.referralCode });
        code = updated?.referralCode ?? null;
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
      }

      if (!code) {
        const [latest] = await db.select({ referralCode: Users.referralCode }).from(Users).where(eq(Users.id, user.id)).limit(1);
        code = latest?.referralCode ?? null;
      }
    }
    if (!code) return NextResponse.json({ error: "Could not create your invite code." }, { status: 503 });

    return NextResponse.json({
      code,
      shareUrl: `wastechain://?ref=${encodeURIComponent(code)}`,
      rewardPoints: 50,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Mobile invite code request failed:", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ error: "Could not load your invite code." }, { status: 500 });
  }
}
