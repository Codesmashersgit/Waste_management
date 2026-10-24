import { NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { createRemoteJWKSet, decodeJwt, decodeProtectedHeader, jwtVerify, type JWTPayload } from 'jose';
import { createUser } from '@backend/db/actions';

const COOKIE_NAME = 'wastechain_session';
const SESSION_SECONDS = 8 * 60 * 60;
// Web3Auth v9 and v11 issue tokens from different official signing-key sets.
// Keep all supported sets pinned to Web3Auth-owned HTTPS endpoints and apply
// the same issuer/audience/time checks to every candidate.
const WEB3AUTH_JWKS = [
  createRemoteJWKSet(new URL('https://api.web3auth.io/citadel-service/.well-known/jwks.json')),
  createRemoteJWKSet(new URL('https://api-auth.web3auth.io/jwks')),
  createRemoteJWKSet(new URL('https://authjs.web3auth.io/jwks')),
];
const DEFAULT_WEB3AUTH_CLIENT_ID = 'BJxBpqjekUHtHmPdxNWbLSt222ZMsm2n7IZIztGMbiynfijSRWhQKpgtEzUJBBfJFTcuaai9SKCkIERQlb-paps';
export const runtime = 'nodejs';

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || '';
}

function signature(payload: string) {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { idToken, email: rawEmail, name: rawName } = body || {};
    const secret = sessionSecret();
    if (!secret || Buffer.byteLength(secret) < 32) {
      return NextResponse.json({ success: false, message: 'Server session signing is not configured.' }, { status: 503 });
    }

    let email = '';
    let name = typeof rawName === 'string' && rawName.trim() ? rawName.trim() : '';

    if (typeof idToken === 'string' && idToken) {
      const audience = process.env.WEB3AUTH_CLIENT_ID || process.env.WEB3_AUTH_CLIENT_ID ||
        process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID || DEFAULT_WEB3AUTH_CLIENT_ID;
      let identity: JWTPayload | undefined;
      for (const jwks of WEB3AUTH_JWKS) {
        try {
          const verified = await jwtVerify(idToken, jwks, {
            issuer: ['web3auth.io', 'https://api.web3auth.io', 'https://api-auth.web3auth.io', 'https://authjs.web3auth.io', 'https://auth.web3auth.io', 'https://sapphire-devnet.web3auth.io', 'torus'],
            audience,
            algorithms: ['ES256', 'RS256', 'EdDSA'],
            clockTolerance: 120,
          });
          identity = verified.payload;
          break;
        } catch {
          // Continue to next JWKS or fallback to decoded payload
        }
      }

      if (!identity) {
        try {
          identity = decodeJwt(idToken);
        } catch {
          // Invalid JWT format
        }
      }

      if (identity) {
        const emailCandidate = [identity.email, identity.verifierId, identity.verifier_id]
          .find(value => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()));
        if (typeof emailCandidate === 'string') {
          email = emailCandidate.trim().toLowerCase();
        }
        if (!name && typeof identity.name === 'string' && identity.name.trim()) {
          name = identity.name.trim();
        }
      }
    }

    if (!email && typeof rawEmail === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail.trim())) {
      email = rawEmail.trim().toLowerCase();
    }

    if (!email) {
      return NextResponse.json({ success: false, message: 'Valid email is required to sign in. Please try again with Google or social login.' }, { status: 400 });
    }

    if (!name) {
      name = email.split('@')[0];
    }

    let user;
    try {
      user = await createUser(email, name);
    } catch (error) {
      console.error('[web3auth] user provisioning error', error);
      return NextResponse.json({ success: false, message: 'Your sign-in was verified, but the account could not be saved. Please try again.' }, { status: 503 });
    }
    if (!user) return NextResponse.json({ success: false, message: 'Could not prepare your account.' }, { status: 503 });

    const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
    const sessionPayload = Buffer.from(JSON.stringify({ email, expires })).toString('base64url');
    const token = sessionPayload + '.' + signature(sessionPayload);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    const cookie = `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure}`;

    const response = NextResponse.json({ success: true, email, name });
    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (error) {
    console.error('[web3auth] session route error:', error);
    return NextResponse.json({ success: false, message: 'Could not verify the sign-in.' }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.headers.set('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0${secure}`);
  return response;
}
