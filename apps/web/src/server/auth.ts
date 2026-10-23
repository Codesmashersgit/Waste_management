import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '@backend/db/dbConfig';
import { Users } from '@backend/db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'wastechain_session';

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || '';
}

function signature(payload: string) {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

export async function getUserSession() {
  const secret = sessionSecret();
  if (!secret || Buffer.byteLength(secret) < 32) return null;
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(COOKIE_NAME)?.value;
  if (!rawCookie) return null;

  const [payload, suppliedSignature] = rawCookie.split('.');
  if (!payload || !suppliedSignature) return null;

  const expected = signature(payload);
  const supplied = Buffer.from(suppliedSignature);
  const expectedBytes = Buffer.from(expected);

  if (supplied.length !== expectedBytes.length || !timingSafeEqual(supplied, expectedBytes)) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof session.email !== 'string' || Number(session.expires) <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return session.email as string;
  } catch {
    return null;
  }
}

export async function verifyAdmin() {
  const email = await getUserSession();
  if (!email) return false;

  if (email.toLowerCase() === process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
    return true;
  }

  try {
    const [user] = await db.select().from(Users).where(eq(Users.email, email)).execute();
    return user?.role === 'admin';
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error('Unauthorized');
  }
}
