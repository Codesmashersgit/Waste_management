import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUserSession } from "@/server/auth";
import { isValidWasteVerificationToken, type WasteAssessment } from "@backend/waste-verification";
import { db } from "@backend/db/dbConfig";
import { Users } from "@backend/db/schema";
import { createMobileReport, getCitizenReports } from "@backend/db/mobile-actions";

const allowedWasteTypes = new Set(["Plastic", "Paper", "Organic", "Metal", "Glass", "Other"]);

function publicReport<T extends Record<string, unknown>>(report: T) {
  return Object.fromEntries(Object.entries(report).filter(([key]) => key !== "imageUrl" && key !== "verificationResult"));
}

async function currentUser() {
  const email = await getUserSession();
  if (!email) return null;
  const [user] = await db.select().from(Users).where(eq(Users.email, email)).limit(1);
  return user ?? null;
}

function errorResponse(error: unknown) {
  console.error("Web reports request failed:", error instanceof Error ? error.name : "unknown error");
  return NextResponse.json({ error: "Could not process this report." }, { status: 500 });
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    if (user.role !== "citizen") return NextResponse.json({ error: "Citizen access is required." }, { status: 403 });
    const reports = await getCitizenReports(user.id, 20);
    return NextResponse.json(reports.map(publicReport), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    if (user.role !== "citizen") return NextResponse.json({ error: "Citizen access is required." }, { status: 403 });
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const location = typeof body.location === "string" ? body.location.trim().slice(0, 1000) : "";
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : "";
    const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
    const imageUrl = `data:${mimeType};base64,${imageBase64}`;
    const verification = body.verificationResult && typeof body.verificationResult === "object"
      ? body.verificationResult as Record<string, unknown> : {};
    const assessment: WasteAssessment = {
      isWaste: verification.isWaste === true,
      wasteTypes: Array.isArray(verification.wasteTypes) ? verification.wasteTypes.filter((value): value is string => typeof value === "string") : [],
      estimatedAmount: typeof verification.estimatedAmount === "string" ? verification.estimatedAmount : "",
      confidence: typeof verification.confidence === "number" ? verification.confidence : 0,
      notes: typeof verification.notes === "string" ? verification.notes : "",
    };

    if (!location || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Add a location and allow GPS before submitting." }, { status: 400 });
    }
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(mimeType) || !/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64) || imageBase64.length > 5_500_000) {
      return NextResponse.json({ error: "Add a supported photo under 4 MB." }, { status: 400 });
    }
    if (!assessment.isWaste || !assessment.wasteTypes.length || assessment.wasteTypes.some(type => !allowedWasteTypes.has(type)) ||
        !isValidWasteVerificationToken(verification.verificationToken, user.id, imageBase64, assessment)) {
      return NextResponse.json({ error: "Verify this photo again before submitting." }, { status: 400 });
    }

    const report = await createMobileReport({
      user, location, latitude, longitude,
      wasteType: Array.from(new Set(assessment.wasteTypes)).join(", "),
      amount: assessment.estimatedAmount || "Not specified", imageUrl,
      verificationResult: JSON.stringify(assessment),
    });
    return NextResponse.json(publicReport(report), { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
