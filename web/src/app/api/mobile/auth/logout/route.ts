import { NextResponse } from "next/server";
import { revokePhoneRefreshToken } from "@backend/phone-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  await revokePhoneRefreshToken(body.refreshToken);
  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}
