import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getUserSession } from "@/server/auth";
import { db } from "@backend/db/dbConfig";
import { Notifications, Users } from "@backend/db/schema";
import { getUserBalance } from "@backend/db/actions";

async function currentUser() {
  const email = await getUserSession();
  if (!email) return null;
  const [user] = await db.select().from(Users).where(eq(Users.email, email)).limit(1);
  return user ?? null;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const [balance, notifications] = await Promise.all([
    getUserBalance(user.id),
    db.select({ id: Notifications.id, type: Notifications.type, message: Notifications.message })
      .from(Notifications).where(and(eq(Notifications.userId, user.id), eq(Notifications.isRead, false)))
      .orderBy(Notifications.createdAt).limit(20),
  ]);
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name }, balance, notifications,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  if (name.length < 2 || name.length > 80) return NextResponse.json({ error: "Enter a name between 2 and 80 characters." }, { status: 400 });
  const [updated] = await db.update(Users).set({ name }).where(eq(Users.id, user.id)).returning({ id: Users.id, email: Users.email, name: Users.name });
  if (!updated) return NextResponse.json({ error: "Could not save your profile." }, { status: 500 });
  return NextResponse.json(updated, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const notificationId = Number(body.notificationId);
  if (!Number.isSafeInteger(notificationId) || notificationId <= 0) return NextResponse.json({ error: "Choose a valid notification." }, { status: 400 });
  await db.update(Notifications).set({ isRead: true }).where(and(
    eq(Notifications.id, notificationId), eq(Notifications.userId, user.id),
  ));
  return NextResponse.json({ success: true });
}
