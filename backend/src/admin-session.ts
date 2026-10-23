import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "wastechain_session";
const SESSION_SECONDS = 8 * 60 * 60;
function sessionSecret() { return process.env.ADMIN_SESSION_SECRET || ""; }
function signature(payload: string) { return createHmac("sha256", sessionSecret()).update(payload).digest("base64url"); }

export function createAdminCookie(email: string) {
  if (Buffer.byteLength(sessionSecret()) < 32) throw new Error("ADMIN_SESSION_SECRET must contain at least 32 bytes.");
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = Buffer.from(JSON.stringify({ email, expires })).toString("base64url");
  const token = payload + "." + signature(payload);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return COOKIE_NAME + "=" + token + "; HttpOnly; Path=/; SameSite=Strict; Max-Age=" + SESSION_SECONDS + secure;
}
export function clearAdminCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return COOKIE_NAME + "=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0" + secure;
}
export function isAdminRequest(request: Request) {
  const secret = sessionSecret();
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!secret || !configuredEmail) return false;
  const rawCookie = (request.headers.get("cookie") || "").split(";").map(part => part.trim())
    .find(part => part.startsWith(COOKIE_NAME + "="))?.slice(COOKIE_NAME.length + 1);
  if (!rawCookie) return false;
  const [payload, suppliedSignature] = rawCookie.split(".");
  if (!payload || !suppliedSignature) return false;
  const expected = signature(payload);
  const supplied = Buffer.from(suppliedSignature);
  const expectedBytes = Buffer.from(expected);
  if (supplied.length !== expectedBytes.length || !timingSafeEqual(supplied, expectedBytes)) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session.email === configuredEmail && Number(session.expires) > Math.floor(Date.now() / 1000);
  } catch { return false; }
}
