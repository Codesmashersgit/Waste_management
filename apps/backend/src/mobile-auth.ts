import { createRemoteJWKSet, jwtVerify } from "jose";
import { db } from "./db/dbConfig";
import { Users } from "./db/schema";
import { eq } from "drizzle-orm";
import { authenticatePhoneAccessToken } from "./phone-auth";

const WEB3AUTH_JWKS = createRemoteJWKSet(new URL("https://api.web3auth.io/citadel-service/.well-known/jwks.json"));
const DEFAULT_WEB3AUTH_CLIENT_ID = "BJxBpqjekUHtHmPdxNWbLSt222ZMsm2n7IZIztGMbiynfijSRWhQKpgtEzUJBBfJFTcuaai9SKCkIERQlb-paps";

export type MobileUser = typeof Users.$inferSelect;
export class MobileAuthError extends Error {
  constructor(message: string, public status = 401) {
    super(message);
  }
}

export async function authenticateMobileRequest(request: Request): Promise<MobileUser> {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) throw new MobileAuthError("Sign in to continue.");

  // Phone OTP sessions use our own short-lived access tokens. Keep the Web3Auth
  // verifier below as a migration fallback for already-installed mobile clients.
  const phoneUser = await authenticatePhoneAccessToken(token);
  if (phoneUser) return phoneUser;

  const audience = process.env.WEB3AUTH_CLIENT_ID || process.env.WEB3_AUTH_CLIENT_ID ||
    process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID || DEFAULT_WEB3AUTH_CLIENT_ID;
  let payload;
  try {
    ({ payload } = await jwtVerify(token, WEB3AUTH_JWKS, {
      issuer: "web3auth.io",
      audience,
      algorithms: ["ES256", "RS256"],
      clockTolerance: 60,
    }));
  } catch {
    throw new MobileAuthError("Your sign-in has expired. Sign in again.");
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!email || typeof payload.sub !== "string" || !payload.sub) throw new MobileAuthError("The sign-in token has no verified account.");
  const name = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : email.split("@")[0];
  const configuredAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  let [user] = await db.select().from(Users).where(eq(Users.email, email)).limit(1);

  if (!user) {
    [user] = await db.insert(Users).values({
      email,
      name,
      role: configuredAdmin && email === configuredAdmin ? "admin" : "citizen",
    }).returning();
  } else if (configuredAdmin && email === configuredAdmin && user.role !== "admin") {
    [user] = await db.update(Users).set({ role: "admin", collectorAvailable: false }).where(eq(Users.id, user.id)).returning();
  }

  if (!user) throw new MobileAuthError("Could not load your account.", 500);
  return user;
}
