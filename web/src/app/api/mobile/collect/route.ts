import { NextResponse } from "next/server";
import { authenticateMobileRequest, MobileAuthError } from "@backend/mobile-auth";
import { collectAssignedReport, declineCollectorTask, getCollectorTasks, recordCollectorSale, setCollectorAvailability, updateAssignedCollectorLocation } from "@backend/db/mobile-actions";

function publicTask<T extends object>(task: T) {
  return Object.fromEntries(Object.entries(task).filter(([key]) => key !== "imageUrl" && key !== "verificationResult"));
}

function errorResponse(error: unknown) {
  if (error instanceof MobileAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof Error && (error.message.includes("Collector") || error.message.includes("assigned") || error.message.includes("current collection") || error.message.includes("valid current location") || error.message.includes("collected waste"))) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error("Collector request failed:", error instanceof Error ? error.name : "unknown error");
  return NextResponse.json({ error: "Could not update collector work." }, { status: 500 });
}

async function requireCollector(request: Request) {
  const user = await authenticateMobileRequest(request);
  if (user.role !== "collector") throw new MobileAuthError("Collector access is required.", 403);
  return user;
}

export async function GET(request: Request) {
  try {
    const user = await requireCollector(request);
    const parsed = Number(new URL(request.url).searchParams.get("limit") || 20);
    const limit = Number.isSafeInteger(parsed) ? Math.min(Math.max(parsed, 1), 50) : 20;
    const tasks = await getCollectorTasks(user.id, limit);
    return NextResponse.json(tasks.map(publicTask), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function PUT(request: Request) {
  try {
    const user = await requireCollector(request);
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.available !== "boolean") return NextResponse.json({ error: "Choose online or offline status." }, { status: 400 });
    const result = await setCollectorAvailability(user, body.available, Number(body.latitude), Number(body.longitude));
    return NextResponse.json({ success: true, ...result });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCollector(request);
    const body = await request.json() as Record<string, unknown>;
    const result = await updateAssignedCollectorLocation(user, Number(body.latitude), Number(body.longitude));
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireCollector(request);
    const body = await request.json() as Record<string, unknown>;
    const reportId = Number(body.reportId);
    if (!Number.isSafeInteger(reportId) || reportId <= 0) return NextResponse.json({ error: "Provide a valid report." }, { status: 400 });
    if (body.action === "collect") {
      await collectAssignedReport(user, reportId);
      return NextResponse.json({ success: true });
    }
    if (body.action === "sale") {
      await recordCollectorSale(user, reportId, Number(body.saleRevenue));
      return NextResponse.json({ success: true });
    }
    if (body.action === 'decline') {
      await declineCollectorTask(user, reportId);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Choose a collection or sale action." }, { status: 400 });
  } catch (error) { return errorResponse(error); }
}
