import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, getUserSession } from "@/server/auth";
import { getUserComprehensiveAnalytics } from "@backend/db/actions";
import { getAdminDispatchSnapshot, getAdminReportImage, updateAdminSale, updateAdminUserRole, updateReportAdmin } from "@backend/db/mobile-actions";

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  const reportId = Number(request.nextUrl.searchParams.get("reportId"));
  if (Number.isSafeInteger(reportId) && reportId > 0) {
    return NextResponse.json({ imageUrl: await getAdminReportImage(reportId) }, { headers: { "Cache-Control": "no-store" } });
  }
  const userId = Number(request.nextUrl.searchParams.get("userId"));
  if (Number.isSafeInteger(userId) && userId > 0) return NextResponse.json(await getUserComprehensiveAnalytics(userId));
  return NextResponse.json(await getAdminDispatchSnapshot());
}
export async function PATCH(request: NextRequest) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  const adminEmail = await getUserSession();
  try {
    const body = await request.json();
    if (Number.isSafeInteger(Number(body.userId)) && Number(body.userId) > 0 && (body.role === "citizen" || body.role === "collector")) {
      await updateAdminUserRole(Number(body.userId), body.role, adminEmail!);
      return NextResponse.json({ success: true });
    }
    if (body.action === 'UPDATE_REPORT' && Number.isSafeInteger(Number(body.reportId)) && Number(body.reportId) > 0) {
      const collectorId = body.collectorId === null ? null : Number(body.collectorId);
      if (body.collectorId !== null && (collectorId == null || !Number.isSafeInteger(collectorId) || collectorId <= 0)) {
        return NextResponse.json({ error: "Choose a valid collector account." }, { status: 400 });
      }
      await updateReportAdmin(Number(body.reportId), body.status, collectorId, adminEmail!);
      return NextResponse.json({ success: true });
    }
    if (Number.isSafeInteger(Number(body.reportId)) && Number.isSafeInteger(Number(body.saleRevenue))) {
      await updateAdminSale(Number(body.reportId), Number(body.saleRevenue), adminEmail!);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Provide a valid update action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Admin update failed." }, { status: 400 });
  }
}
