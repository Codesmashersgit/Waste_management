import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@backend/db/dbConfig";
import { Users } from "@backend/db/schema";
import { issuePhoneAuthSession, issueProfileSetupToken, normalizeMobileNumber, PhoneAuthError, verifyPhoneOtp } from "@backend/phone-auth";
import { phoneAuthErrorResponse } from "../_errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const phone = normalizeMobileNumber(body.phone);
    if (!await verifyPhoneOtp(phone, body.code)) {
      throw new PhoneAuthError("That code is incorrect or expired. Request a new code and try again.", 400);
    }

    const [user] = await db.select().from(Users).where(eq(Users.phone, phone)).limit(1);
    if (user) {
      return NextResponse.json({ verified: true, needsProfile: false, ...await issuePhoneAuthSession(user) }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({
      verified: true,
      needsProfile: true,
      profileSetupToken: await issueProfileSetupToken(phone),
      phone,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return phoneAuthErrorResponse(error);
  }
}
