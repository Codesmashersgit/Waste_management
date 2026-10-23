import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUserSession } from "@/server/auth";
import { db } from "@backend/db/dbConfig";
import { Reports, Users } from "@backend/db/schema";
import { getUserBalance } from "@backend/db/actions";

export async function GET() {
  const email = await getUserSession();
  if (!email) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const [user] = await db.select({ id: Users.id, name: Users.name }).from(Users).where(eq(Users.email, email)).limit(1);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  const [reports, balance] = await Promise.all([
    db.select({ amount: Reports.amount, status: Reports.status }).from(Reports).where(eq(Reports.userId, user.id)),
    getUserBalance(user.id),
  ]);
  const collectedKg = reports.filter(report => report.status === "collected" || report.status === "sold")
    .reduce((sum, report) => sum + Number(report.amount.match(/\d+(\.\d+)?/)?.[0] || 0), 0);
  return NextResponse.json({
    name: user.name, reportsSubmitted: reports.length, tokensEarned: balance,
    wasteCollected: Math.round(collectedKg * 10) / 10,
    co2Offset: Math.round(collectedKg * 0.5 * 10) / 10,
  }, { headers: { "Cache-Control": "no-store" } });
}
