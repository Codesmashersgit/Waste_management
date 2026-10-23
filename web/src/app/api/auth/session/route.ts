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
    const { idToken } = await request.json();
    if (typeof idToken !== 'string' || !idToken) return NextResponse.json({ success: false, message: 'Verified sign-in is required.' }, { status: 401 });
    const secret = sessionSecret();
    if (!secret || Buffer.byteLength(secret) < 32) return NextResponse.json({ success: false, message: 'Server session signing is not configured.' }, { status: 503 });
    const audience = process.env.WEB3AUTH_CLIENT_ID || process.env.WEB3_AUTH_CLIENT_ID ||
      process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID || DEFAULT_WEB3AUTH_CLIENT_ID;
    let identity: JWTPayload | undefined;
    try {
      let lastError: unknown;
      for (const jwks of WEB3AUTH_JWKS) {
        try {
          const verified = await jwtVerify(idToken, jwks, {
            issuer: ['web3auth.io', 'https://api-auth.web3auth.io', 'https://authjs.web3auth.io'],
            audience, algorithms: ['ES256', 'RS256'], clockTolerance: 60,
          });
          identity = verified.payload;
          lastError = undefined;
          break;
        } catch (error) {
          lastError = error;
          if (!(error instanceof Error) || error.name !== 'JWKSNoMatchingKey') throw error;
        }
      }
      if (lastError) throw lastError;
    } catch (error) {
      let kid: string | undefined;
      let issuer: unknown;
      try { kid = decodeProtectedHeader(idToken).kid; issuer = decodeJwt(idToken).iss; } catch { /* malformed token; do not log token contents */ }
      const detail = error instanceof Error ? { name: error.name, code: 'code' in error ? error.code : undefined, kid, issuer, message: error.message.slice(0, 180) } : { name: 'UnknownError', kid, issuer };
      console.error('[web3auth] identity token verification failed', detail);
      const message = error instanceof Error && error.name === 'JWTExpired'
        ? 'Sign-in expired. Please try again.'
        : error instanceof Error && error.name === 'JWKSNoMatchingKey'
          ? 'The sign-in provider key could not be found. Please try again.'
          : error instanceof Error && error.name === 'JWTClaimValidationFailed'
            ? 'Sign-in token settings do not match this app. Please contact the administrator.'
            : 'Could not verify the sign-in. Please try again.';
      return NextResponse.json({ success: false, message }, { status: 401 });
    }
    if (!identity) return NextResponse.json({ success: false, message: 'Could not verify the sign-in. Please try again.' }, { status: 401 });
    // Some legacy Web3Auth social tokens put the signed email in verifierId
    // rather than the top-level email claim. Only use email values covered by
    // the verified token; never trust an email sent separately by the browser.
    const emailCandidate = [identity.email, identity.verifierId, identity.verifier_id]
      .find(value => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()));
    const email = typeof emailCandidate === 'string' ? emailCandidate.trim().toLowerCase() : '';
    if (!email || typeof identity.sub !== 'string' || !identity.sub) {
      console.error('[web3auth] verified identity lacks an email claim', {
        issuer: identity.iss,
        claimNames: Object.keys(identity).sort(),
        verifier: typeof identity.verifier === 'string' ? identity.verifier : undefined,
        verifierIdLooksLikeEmail: typeof identity.verifierId === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.verifierId),
      });
      return NextResponse.json({ success: false, message: 'The verified sign-in did not include an email address. Choose Google/email sign-in and try again.' }, { status: 401 });
    }
    const name = typeof identity.name === 'string' && identity.name.trim() ? identity.name.trim() : email.split('@')[0];
    let user;
    try {
      user = await createUser(email, name);
    } catch (error) {
      console.error('[web3auth] verified identity could not be provisioned', error instanceof Error ? { name: error.name, message: error.message.slice(0, 180) } : { name: 'UnknownError' });
      return NextResponse.json({ success: false, message: 'Your sign-in was verified, but the account could not be saved. Please try again.' }, { status: 503 });
    }
    if (!user) return NextResponse.json({ success: false, message: 'Could not prepare your account.' }, { status: 503 });

    const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
    const sessionPayload = Buffer.from(JSON.stringify({ email, expires })).toString('base64url');
    const token = sessionPayload + '.' + signature(sessionPayload);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    const cookie = `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`;

    const response = NextResponse.json({ success: true });
    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error && error.name === 'JWTExpired' ? 'Sign-in expired. Please sign in again.' : 'Could not verify the sign-in.' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.headers.set('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0${secure}`);
  return response;
}
