import { NextResponse } from "next/server";
import { clearAdminCookie, createAdminCookie } from "@backend/admin-session";
import { createUser } from "@backend/db/actions";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) return NextResponse.json({ success: false, message: "Admin credentials are not configured on the server." }, { status: 500 });
    if (email?.trim().toLowerCase() !== adminEmail || password !== adminPassword) return NextResponse.json({ success: false, message: "Invalid admin credentials." }, { status: 401 });
    if (!await createUser(adminEmail, "WasteCHAiN Admin")) return NextResponse.json({ success: false, message: "Could not prepare the admin account." }, { status: 503 });
    const response = NextResponse.json({ success: true, adminUser: { email: adminEmail, role: "admin" } });
    response.headers.set("Set-Cookie", createAdminCookie(adminEmail));
    return response;
  } catch {
    return NextResponse.json({ success: false, message: "Could not authenticate admin." }, { status: 500 });
  }
}
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.headers.set("Set-Cookie", clearAdminCookie());
  return response;
}
