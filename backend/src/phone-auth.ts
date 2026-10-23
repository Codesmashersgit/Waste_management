import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db/dbConfig";
import { MobileOtpSendLimits, MobileRefreshSessions, Users } from "./db/schema";
import type { MobileUser } from "./mobile-auth";

const TOKEN_ISSUER = "wastechain";
const TOKEN_AUDIENCE = "wastechain-mobile";
const ACCESS_TOKEN_SECONDS = 15 * 60;
const REFRESH_TOKEN_DAYS = 30;

export class PhoneAuthError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export type MobileUserProfile = Pick<MobileUser, "id" | "email" | "name" | "role" | "phone" | "requestedRole">;
export type MobileAuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: MobileUserProfile;
};

function getSigningKey() {
  const secret = process.env.MOBILE_AUTH_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new PhoneAuthError("Phone sign-in is not configured on the server yet.", 503);
  }
  return new TextEncoder().encode(secret);
}

function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizeMobileNumber(value: unknown) {
  if (typeof value !== "string") throw new PhoneAuthError("Enter your mobile number.");
  const compact = value.trim().replace(/[\s().-]/g, "");
  const e164 = /^[6-9]\d{9}$/.test(compact) ? `+91${compact}` : compact;
  if (!/^\+[1-9]\d{7,14}$/.test(e164)) {
    throw new PhoneAuthError("Enter a valid mobile number with country code, for example +91 98765 43210.");
  }
  return e164;
}

function getTwilioConfig(): { accountSid: string; authToken: string; verifyServiceSid: string } | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();
  if (!accountSid || !authToken || !verifyServiceSid) {
    if (process.env.NODE_ENV !== "production" && process.env.DEV_OTP_CODE && /^\d{6}$/.test(process.env.DEV_OTP_CODE)) return null;
    throw new PhoneAuthError("SMS OTP is not configured. Add the Twilio Verify settings to the server environment.", 503);
  }
  return { accountSid, authToken, verifyServiceSid };
}

async function reserveOtpSend(phone: string) {
  const now = new Date();
  const cooldownEnds = new Date(now.getTime() - 30_000);
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const [reserved] = await db.insert(MobileOtpSendLimits).values({
    phone,
    lastSentAt: now,
    windowStartedAt: now,
    sendCount: 1,
  }).onConflictDoUpdate({
    target: MobileOtpSendLimits.phone,
    set: {
      lastSentAt: now,
      windowStartedAt: sql`CASE WHEN ${MobileOtpSendLimits.windowStartedAt} < ${hourAgo} THEN ${now} ELSE ${MobileOtpSendLimits.windowStartedAt} END`,
      sendCount: sql`CASE WHEN ${MobileOtpSendLimits.windowStartedAt} < ${hourAgo} THEN 1 ELSE ${MobileOtpSendLimits.sendCount} + 1 END`,
    },
    setWhere: and(
      lt(MobileOtpSendLimits.lastSentAt, cooldownEnds),
      or(lt(MobileOtpSendLimits.windowStartedAt, hourAgo), lt(MobileOtpSendLimits.sendCount, 5)),
    ),
  }).returning({ phone: MobileOtpSendLimits.phone });

  if (!reserved) throw new PhoneAuthError("Wait before requesting another code. The hourly SMS limit has been reached if this keeps happening.", 429);
}

async function twilioVerifyRequest(phone: string, values: Record<string, string>, config: NonNullable<ReturnType<typeof getTwilioConfig>>) {
  const { accountSid, authToken, verifyServiceSid } = config;
  const response = await fetch(`https://verify.twilio.com/v2/Services/${verifyServiceSid}/${values.Code ? "VerificationCheck" : "Verifications"}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams(values.Code ? { To: phone, Code: values.Code } : { To: phone, Channel: "sms" }),
    signal: AbortSignal.timeout(12_000),
  });
  const result = await response.json().catch(() => ({})) as { status?: string; code?: number };
  return { response, result };
}

export async function sendPhoneOtp(phone: string) {
  getSigningKey();
  const twilio = getTwilioConfig();
  await reserveOtpSend(phone);
  if (!twilio) return;
  let result: Awaited<ReturnType<typeof twilioVerifyRequest>>;
  try {
    result = await twilioVerifyRequest(phone, {}, twilio);
  } catch {
    throw new PhoneAuthError("Could not send the code. Check your connection and try again.", 502);
  }
  if (!result.response.ok) {
    const status = result.response.status === 429 || result.result.code === 60203 || result.result.code === 60245 ? 429 : 502;
    throw new PhoneAuthError(status === 429 ? "Too many code requests. Please wait and try again." : "Could not send the code to this number.", status);
  }
}

export async function verifyPhoneOtp(phone: string, code: unknown) {
  if (typeof code !== "string" || !/^\d{4,10}$/.test(code.trim())) {
    throw new PhoneAuthError("Enter the verification code from your SMS.");
  }
  const twilio = getTwilioConfig();
  if (!twilio) {
    const expected = Buffer.from(process.env.DEV_OTP_CODE || "");
    const supplied = Buffer.from(code.trim());
    return expected.length === supplied.length && timingSafeEqual(expected, supplied);
  }
  let result: Awaited<ReturnType<typeof twilioVerifyRequest>>;
  try {
    result = await twilioVerifyRequest(phone, { Code: code.trim() }, twilio);
  } catch {
    throw new PhoneAuthError("Could not verify the code. Check your connection and try again.", 502);
  }
  if (result.response.status === 404) return false;
  if (!result.response.ok) {
    throw new PhoneAuthError("Could not verify the code right now. Please try again.", 502);
  }
  return result.result.status === "approved";
}

export function getDevelopmentOtpCode() {
  if (process.env.NODE_ENV === "production") return null;
  const code = process.env.DEV_OTP_CODE || "";
  const hasTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID);
  return !hasTwilio && /^\d{6}$/.test(code) ? code : null;
}

export async function issueProfileSetupToken(phone: string) {
  return new SignJWT({ token_use: "profile_setup" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setSubject(phone)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getSigningKey());
}

export async function verifyProfileSetupToken(token: string) {
  let payload;
  try {
    ({ payload } = await jwtVerify(token, getSigningKey(), {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      algorithms: ["HS256"],
    }));
  } catch (error) {
    if (error instanceof PhoneAuthError) throw error;
    throw new PhoneAuthError("Your signup session expired. Request a new code.", 401);
  }
  if (payload.token_use !== "profile_setup" || typeof payload.sub !== "string" || !payload.sub) {
    throw new PhoneAuthError("Your signup session expired. Request a new code.", 401);
  }
  return payload.sub;
}

export async function issuePhoneAuthSession(user: MobileUser, familyId: string = randomUUID()): Promise<MobileAuthSession> {
  const signingKey = getSigningKey();
  const refreshToken = randomBytes(48).toString("base64url");
  await db.insert(MobileRefreshSessions).values({
    userId: user.id,
    familyId,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000),
  });
  const accessToken = await new SignJWT({ token_use: "access", role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_SECONDS}s`)
    .sign(signingKey);
  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_SECONDS,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone, requestedRole: user.requestedRole },
  };
}

export async function authenticatePhoneAccessToken(token: string): Promise<MobileUser | null> {
  const secret = process.env.MOBILE_AUTH_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) return null;
  let payload;
  try {
    ({ payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      algorithms: ["HS256"],
      clockTolerance: 60,
    }));
  } catch {
    return null;
  }
  if (payload.token_use !== "access" || typeof payload.sub !== "string") return null;
  const userId = Number(payload.sub);
  if (!Number.isSafeInteger(userId) || userId < 1) return null;
  const [user] = await db.select().from(Users).where(eq(Users.id, userId)).limit(1);
  return user || null;
}

export async function rotatePhoneRefreshToken(refreshToken: unknown) {
  if (typeof refreshToken !== "string" || refreshToken.length > 200) {
    throw new PhoneAuthError("Your session expired. Sign in again.", 401);
  }
  const tokenHash = hashRefreshToken(refreshToken);
  const [existing] = await db.select().from(MobileRefreshSessions)
    .where(eq(MobileRefreshSessions.tokenHash, tokenHash)).limit(1);
  if (!existing) throw new PhoneAuthError("Your session expired. Sign in again.", 401);
  if (existing.revokedAt) {
    await db.update(MobileRefreshSessions).set({ revokedAt: new Date() })
      .where(eq(MobileRefreshSessions.familyId, existing.familyId));
    throw new PhoneAuthError("This session was already used. Sign in again.", 401);
  }
  const now = new Date();
  const [claimed] = await db.update(MobileRefreshSessions).set({ revokedAt: now })
    .where(and(
      eq(MobileRefreshSessions.tokenHash, tokenHash),
      isNull(MobileRefreshSessions.revokedAt),
      gt(MobileRefreshSessions.expiresAt, now),
    )).returning();
  if (!claimed) {
    await db.update(MobileRefreshSessions).set({ revokedAt: now })
      .where(eq(MobileRefreshSessions.familyId, existing.familyId));
    throw new PhoneAuthError("Your session expired. Sign in again.", 401);
  }
  const [user] = await db.select().from(Users).where(eq(Users.id, claimed.userId)).limit(1);
  if (!user) throw new PhoneAuthError("Your account could not be found.", 401);
  return issuePhoneAuthSession(user, existing.familyId);
}

export async function revokePhoneRefreshToken(refreshToken: unknown) {
  if (typeof refreshToken !== "string" || refreshToken.length > 200) return;
  const [session] = await db.select({ familyId: MobileRefreshSessions.familyId })
    .from(MobileRefreshSessions)
    .where(eq(MobileRefreshSessions.tokenHash, hashRefreshToken(refreshToken))).limit(1);
  if (session) {
    await db.update(MobileRefreshSessions).set({ revokedAt: new Date() })
      .where(eq(MobileRefreshSessions.familyId, session.familyId));
  }
}
