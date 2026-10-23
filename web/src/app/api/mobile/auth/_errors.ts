import { NextResponse } from "next/server";
import { PhoneAuthError } from "@backend/phone-auth";

export function phoneAuthErrorResponse(error: unknown) {
  if (error instanceof PhoneAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  console.error("Mobile phone authentication failed:", error instanceof Error ? error.name : "unknown error");
  return NextResponse.json({ error: "Could not complete phone sign-in. Please try again." }, { status: 500, headers: { "Cache-Control": "no-store" } });
}
