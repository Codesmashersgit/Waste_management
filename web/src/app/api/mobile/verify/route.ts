import { NextRequest, NextResponse } from 'next/server';
import { authenticateMobileRequest, MobileAuthError, type MobileUser } from '@backend/mobile-auth';
import { createWasteVerificationToken } from '@backend/waste-verification';
import { getUserSession } from '@/server/auth';
import { db } from '@backend/db/dbConfig';
import { Users } from '@backend/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedWasteTypes = ['Plastic', 'Paper', 'Organic', 'Metal', 'Glass', 'Other'];

export async function POST(request: NextRequest) {
  let user: MobileUser;
  try {
    if (request.headers.get('authorization')?.startsWith('Bearer ')) {
      user = await authenticateMobileRequest(request);
    } else {
      const email = await getUserSession();
      const [webUser] = email ? await db.select().from(Users).where(eq(Users.email, email)).limit(1) : [];
      if (!webUser) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
      user = webUser;
    }
  } catch (error) {
    if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Could not verify your account.' }, { status: 500 });
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini verification is not configured.' }, { status: 503 });
  }
  if (!process.env.MOBILE_AUTH_SECRET || Buffer.byteLength(process.env.MOBILE_AUTH_SECRET) < 32) {
    return NextResponse.json({ error: 'Verification signing is not configured.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const imageBase64 = typeof input.imageBase64 === 'string' ? input.imageBase64 : '';
  const mimeType = typeof input.mimeType === 'string' ? input.mimeType : '';
  const selectedTypes = Array.isArray(input.selectedTypes)
    ? input.selectedTypes.filter((type): type is string => typeof type === 'string' && allowedWasteTypes.includes(type))
    : [];
  const language = input.language === 'hi' ? 'Hindi' : 'English';

  if (!allowedMimeTypes.has(mimeType) || !imageBase64 || imageBase64.length > 5_500_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64)) {
    return NextResponse.json({ error: 'Provide a supported image under 4 MB.' }, { status: 400 });
  }
  if (selectedTypes.length === 0 || selectedTypes.length > allowedWasteTypes.length) {
    return NextResponse.json({ error: 'Select one or more supported waste types.' }, { status: 400 });
  }

  const prompt = [
    'Inspect this user-submitted outdoor/community cleanup photo for visible discarded waste.',
    `The reporter selected these possible materials: ${selectedTypes.join(', ')}. Independently inspect the image; do not assume those selections are correct.`,
    'Only classify waste that is visibly supported by the image. If there is no clear discarded waste, set isWaste to false and explain why.',
    'Choose wasteTypes only from Plastic, Paper, Organic, Metal, Glass, Other. Estimate a modest visible amount, not the total amount outside the frame.',
    `Write notes in ${language}. Keep notes brief, factual, and mention uncertainty. Confidence must be a number from 0 to 1.`,
  ].join(' ');

  try {
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType, data: imageBase64 } }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              isWaste: { type: 'BOOLEAN' },
              wasteTypes: { type: 'ARRAY', items: { type: 'STRING', enum: allowedWasteTypes } },
              estimatedAmount: { type: 'STRING' },
              confidence: { type: 'NUMBER' },
              notes: { type: 'STRING' },
            },
            required: ['isWaste', 'wasteTypes', 'estimatedAmount', 'confidence', 'notes'],
          },
          temperature: 0.1,
        },
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!geminiResponse.ok) {
      console.warn('Gemini verification failed with status:', geminiResponse.status);
      return NextResponse.json({ error: 'Gemini could not verify this photo.' }, { status: 502 });
    }

    const responseBody = await geminiResponse.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = responseBody.candidates?.[0]?.content?.parts?.find(part => part.text)?.text;
    if (!text) return NextResponse.json({ error: 'Gemini returned no assessment.' }, { status: 502 });

    const parsed = JSON.parse(text) as Record<string, unknown>;
    const result = {
      isWaste: parsed.isWaste === true,
      wasteTypes: Array.isArray(parsed.wasteTypes)
        ? parsed.wasteTypes.filter((type): type is string => typeof type === 'string' && allowedWasteTypes.includes(type))
        : [],
      estimatedAmount: typeof parsed.estimatedAmount === 'string' ? parsed.estimatedAmount.slice(0, 80) : '',
      confidence: typeof parsed.confidence === 'number' && Number.isFinite(parsed.confidence)
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0,
      notes: typeof parsed.notes === 'string' ? parsed.notes.slice(0, 500) : '',
    };
    const verificationToken = createWasteVerificationToken(user.id, imageBase64, result);
    return NextResponse.json({ ...result, verificationToken }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.warn('Gemini verification request failed:', error instanceof Error ? error.name : 'unknown error');
    return NextResponse.json({ error: 'Gemini could not verify this photo.' }, { status: 502 });
  }
}
