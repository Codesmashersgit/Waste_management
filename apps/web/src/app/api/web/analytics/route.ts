import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUserSession } from "@/server/auth";
import { db } from "@backend/db/dbConfig";
import { Users } from "@backend/db/schema";
import { getUserComprehensiveAnalytics } from "@backend/db/actions";

export async function GET() {
  const email = await getUserSession();
  if (!email) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const [user] = await db.select({ id: Users.id, name: Users.name }).from(Users).where(eq(Users.email, email)).limit(1);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  const analytics = await getUserComprehensiveAnalytics(user.id);
  if (!analytics) return NextResponse.json({ error: "Could not load your impact." }, { status: 500 });
  return NextResponse.json({ userName: user.name, analytics }, { headers: { "Cache-Control": "no-store" } });
}
