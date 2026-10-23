import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@backend/db/dbConfig";
import { Users } from "@backend/db/schema";
import { authenticateMobileRequest, MobileAuthError } from "@backend/mobile-auth";

function errorResponse(error: unknown) {
  if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("Mobile account request failed:", error instanceof Error ? error.name : "unknown error");
  return NextResponse.json({ error: "Could not load your account." }, { status: 500 });
}

async function profile(request: Request) {
  const user = await authenticateMobileRequest(request);
  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role, requestedRole: user.requestedRole, phone: user.phone }, { headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  try { return await profile(request); }
  catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const user = await authenticateMobileRequest(request);
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 255) : "";
    if (name && name !== user.name) {
      const [updated] = await db.update(Users).set({ name }).where(eq(Users.id, user.id)).returning();
      if (updated) return NextResponse.json({ id: updated.id, email: updated.email, name: updated.name, role: updated.role, requestedRole: updated.requestedRole, phone: updated.phone });
    }
    return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role, requestedRole: user.requestedRole, phone: user.phone });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request) {
  try {
    const user = await authenticateMobileRequest(request);
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    if (body.requestCollectorAccess === true) {
      if (user.role !== "citizen") return NextResponse.json({ error: "Only resident accounts can request collector access." }, { status: 400 });
      const [updated] = await db.update(Users).set({ requestedRole: "collector" }).where(eq(Users.id, user.id)).returning();
      if (!updated) return NextResponse.json({ error: "Could not submit your collector request." }, { status: 500 });
      return NextResponse.json({ id: updated.id, email: updated.email, name: updated.name, role: updated.role, requestedRole: updated.requestedRole, phone: updated.phone }, { headers: { "Cache-Control": "no-store" } });
    }
    const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ").slice(0, 80) : "";
    if (!name) return NextResponse.json({ error: "Enter a name to update your profile." }, { status: 400 });
    const [updated] = await db.update(Users).set({ name }).where(eq(Users.id, user.id)).returning();
    if (!updated) return NextResponse.json({ error: "Could not save your profile." }, { status: 500 });
    return NextResponse.json({ id: updated.id, email: updated.email, name: updated.name, role: updated.role, requestedRole: updated.requestedRole, phone: updated.phone });
  } catch (error) { return errorResponse(error); }
}
