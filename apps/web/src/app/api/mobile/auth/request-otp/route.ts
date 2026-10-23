import { NextResponse } from "next/server";
import { getDevelopmentOtpCode, normalizeMobileNumber, sendPhoneOtp } from "@backend/phone-auth";
import { phoneAuthErrorResponse } from "../_errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const phone = normalizeMobileNumber(body.phone);
    await sendPhoneOtp(phone);
    const developmentCode = getDevelopmentOtpCode();
    return NextResponse.json({ success: true, phone, retryAfter: 30, ...(developmentCode ? { developmentCode } : {}) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return phoneAuthErrorResponse(error);
  }
}
