import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@backend/db/dbConfig";
import { Users } from "@backend/db/schema";
import { issuePhoneAuthSession, PhoneAuthError, verifyProfileSetupToken } from "@backend/phone-auth";
import { phoneAuthErrorResponse } from "../_errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    if (typeof body.profileSetupToken !== "string") throw new PhoneAuthError("Your signup session expired. Request a new code.", 401);
    const phone = await verifyProfileSetupToken(body.profileSetupToken);
    const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
    if (name.length < 2 || name.length > 80) throw new PhoneAuthError("Enter a name between 2 and 80 characters.");
    const requestedRole = body.requestedRole === undefined ? "citizen" : body.requestedRole;
    if (requestedRole !== "citizen" && requestedRole !== "collector") throw new PhoneAuthError("Choose a valid account type.");
    const referralCode = typeof body.referralCode === "string" ? body.referralCode.trim().toUpperCase() : "";
    let referredByUserId: number | undefined;
    if (referralCode) {
      if (!/^[A-Z0-9]{8}$/.test(referralCode)) throw new PhoneAuthError("Enter a valid 8-character invite code.", 400);
      const [referrer] = await db.select({ id: Users.id }).from(Users).where(and(
        eq(Users.referralCode, referralCode), eq(Users.role, "citizen"),
      )).limit(1);
      if (!referrer) throw new PhoneAuthError("That invite code was not found. Check it and try again.", 400);
      referredByUserId = referrer.id;
    }

    const [existing] = await db.select().from(Users).where(eq(Users.phone, phone)).limit(1);
    if (existing) throw new PhoneAuthError("An account already exists for this number. Sign in to continue.", 409);

    let user;
    try {
      [user] = await db.insert(Users).values({ phone, name, role: "citizen", requestedRole: requestedRole === "collector" ? "collector" : null, referredByUserId }).returning();
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
        throw new PhoneAuthError("An account already exists for this number. Sign in to continue.", 409);
      }
      throw error;
    }
    if (!user) throw new PhoneAuthError("Could not create your profile. Please try again.", 500);
    return NextResponse.json(await issuePhoneAuthSession(user), { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return phoneAuthErrorResponse(error);
  }
}
