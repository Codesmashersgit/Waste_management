import { NextResponse } from "next/server";
import { rotatePhoneRefreshToken } from "@backend/phone-auth";
import { phoneAuthErrorResponse } from "../_errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const session = await rotatePhoneRefreshToken(body.refreshToken);
    return NextResponse.json(session, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return phoneAuthErrorResponse(error);
  }
}
