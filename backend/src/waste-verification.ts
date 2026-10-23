import { createHash, createHmac, timingSafeEqual } from "node:crypto";

type VerificationClaims = {
  userId: number;
  imageHash: string;
  assessmentHash: string;
  expiresAt: number;
};

export type WasteAssessment = {
  isWaste: boolean;
  wasteTypes: string[];
  estimatedAmount: string;
  confidence: number;
  notes: string;
};

function verificationSecret() {
  const secret = process.env.MOBILE_AUTH_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error("MOBILE_AUTH_SECRET must contain at least 32 bytes.");
  return secret;
}

function imageHash(imageBase64: string) {
  return createHash("sha256").update(imageBase64).digest("hex");
}

function assessmentHash(assessment: WasteAssessment) {
  return createHash("sha256").update(JSON.stringify(assessment)).digest("hex");
}

export function createWasteVerificationToken(userId: number, imageBase64: string, assessment: WasteAssessment) {
  const claims: VerificationClaims = {
    userId,
    imageHash: imageHash(imageBase64),
    assessmentHash: assessmentHash(assessment),
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", verificationSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function isValidWasteVerificationToken(token: unknown, userId: number, imageBase64: string, assessment: WasteAssessment) {
  if (typeof token !== "string" || token.length > 2048) return false;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;

  let expected: Buffer;
  let actual: Buffer;
  try {
    expected = createHmac("sha256", verificationSecret()).update(payload).digest();
    actual = Buffer.from(signature, "base64url");
  } catch {
    return false;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as VerificationClaims;
    return claims.userId === userId && assessment.isWaste && claims.expiresAt > Date.now() &&
      claims.imageHash === imageHash(imageBase64) && claims.assessmentHash === assessmentHash(assessment);
  } catch {
    return false;
  }
}
