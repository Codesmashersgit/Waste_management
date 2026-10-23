import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUserSession } from "@/server/auth";
import { db } from "@backend/db/dbConfig";
import { Users } from "@backend/db/schema";
import { collectAssignedReport, getCollectorTasks } from "@backend/db/mobile-actions";

function publicTask<T extends object>(task: T) {
  return Object.fromEntries(Object.entries(task).filter(([key]) => key !== "imageUrl" && key !== "verificationResult"));
}

async function currentCollector() {
  const email = await getUserSession();
  if (!email) return null;
  const [user] = await db.select().from(Users).where(eq(Users.email, email)).limit(1);
  return user?.role === "collector" ? user : null;
}

export async function GET() {
  const user = await currentCollector();
  if (!user) return NextResponse.json({ error: "Collector access is required. Ask an admin to enable your collector account." }, { status: 403 });
  const tasks = await getCollectorTasks(user.id, 50);
  return NextResponse.json(tasks.map(task => ({ ...publicTask(task), date: task.createdAt.toISOString().slice(0, 10) })), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await currentCollector();
  if (!user) return NextResponse.json({ error: "Collector access is required." }, { status: 403 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const reportId = Number(body.reportId);
  if (!Number.isSafeInteger(reportId) || reportId <= 0) return NextResponse.json({ error: "Choose a valid pickup." }, { status: 400 });
  try {
    await collectAssignedReport(user, reportId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not confirm this pickup." }, { status: 400 });
  }
}
