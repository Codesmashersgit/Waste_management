import { NextResponse } from "next/server";
import { authenticateMobileRequest, MobileAuthError } from "@backend/mobile-auth";
import { createMobileReport, getCitizenReports } from "@backend/db/mobile-actions";
import { isValidWasteVerificationToken, type WasteAssessment } from "@backend/waste-verification";

const allowedWasteTypes = new Set(["Plastic", "Paper", "Organic", "Metal", "Glass", "Other"]);

function publicReport<T extends object>(report: T) {
  return Object.fromEntries(Object.entries(report).filter(([key]) => key !== "imageUrl" && key !== "verificationResult"));
}

function errorResponse(error: unknown) {
  if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("Mobile report request failed:", error instanceof Error ? error.name : "unknown error");
  return NextResponse.json({ error: "Could not process this report." }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const user = await authenticateMobileRequest(request);
    if (user.role !== "citizen") return NextResponse.json({ error: "Citizen access is required." }, { status: 403 });
    const parsed = Number(new URL(request.url).searchParams.get("limit") || 20);
    const limit = Number.isSafeInteger(parsed) ? Math.min(Math.max(parsed, 1), 50) : 20;
    const reports = await getCitizenReports(user.id, limit);
    return NextResponse.json(reports.map(publicReport), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const user = await authenticateMobileRequest(request);
    if (user.role !== "citizen") return NextResponse.json({ error: "Citizen access is required." }, { status: 403 });
    const body = await request.json() as Record<string, unknown>;
    const location = typeof body.location === "string" ? body.location.trim().slice(0, 1000) : "";
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const rawTypes = typeof body.wasteType === "string" ? body.wasteType.split(",").map(type => type.trim()).filter(Boolean) : [];
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : "";
    const imageMatch = imageUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
    const verification = typeof body.verificationResult === "string" ? body.verificationResult : "";
    let verified: Record<string, unknown> = {};
    try { verified = JSON.parse(verification) as Record<string, unknown>; } catch { /* validated below */ }

    if (!location || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Add a location and a valid GPS position." }, { status: 400 });
    }
    if (!rawTypes.length || rawTypes.some(type => !allowedWasteTypes.has(type))) {
      return NextResponse.json({ error: "Choose at least one supported waste type." }, { status: 400 });
    }
    if (!imageMatch || imageMatch[2].length > 5_500_000) return NextResponse.json({ error: "Add a supported photo under 4 MB." }, { status: 400 });
    if (verified.isWaste !== true || !Array.isArray(verified.wasteTypes) || typeof verified.confidence !== "number" ||
        typeof verified.estimatedAmount !== "string" || typeof verified.notes !== "string") {
      return NextResponse.json({ error: "Verify this waste photo before submitting." }, { status: 400 });
    }
    const assessment: WasteAssessment = {
      isWaste: verified.isWaste === true,
      wasteTypes: verified.wasteTypes as string[],
      estimatedAmount: verified.estimatedAmount as string,
      confidence: verified.confidence as number,
      notes: verified.notes as string,
    };
    if (!isValidWasteVerificationToken(verified.verificationToken, user.id, imageMatch[2], assessment)) {
      return NextResponse.json({ error: "Photo verification expired or does not match this image. Verify it again." }, { status: 400 });
    }
    if (!assessment.wasteTypes.length || assessment.wasteTypes.some(type => !allowedWasteTypes.has(type))) {
      return NextResponse.json({ error: "The verified photo did not include a supported waste type." }, { status: 400 });
    }

    const report = await createMobileReport({
      user, location, latitude, longitude,
      wasteType: Array.from(new Set(assessment.wasteTypes)).join(", "), amount: assessment.estimatedAmount,
      imageUrl, verificationResult: JSON.stringify(verified),
    });
    return NextResponse.json(publicReport(report), { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
