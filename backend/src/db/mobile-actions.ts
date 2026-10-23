import { and, asc, desc, eq, gte, inArray, isNotNull } from "drizzle-orm";
import { db } from "./dbConfig";
import { AuditLogs, CollectedWastes, Reports, Transactions, Users } from "./schema";
import { createTransaction, updateRewardPoints } from "./actions";
import type { MobileUser } from "../mobile-auth";

const LOCATION_TTL_MS = 3 * 60 * 1000;

function distanceKm(latA: number, lonA: number, latB: number, lonB: number) {
  const radians = (value: number) => value * Math.PI / 180;
  const latDelta = radians(latB - latA);
  const lonDelta = radians(lonB - lonA);
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos(radians(latA)) * Math.cos(radians(latB)) * Math.sin(lonDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function assignNearestAvailableCollectorPublic(report: typeof Reports.$inferSelect) {
  return assignNearestAvailableCollector(report);
}

async function assignNearestAvailableCollector(report: typeof Reports.$inferSelect) {
  if (report.latitude == null || report.longitude == null) return null;
  const freshAfter = new Date(Date.now() - LOCATION_TTL_MS);
  const candidates = await db.select({
    id: Users.id,
    lastLatitude: Users.lastLatitude,
    lastLongitude: Users.lastLongitude,
  }).from(Users).where(and(
    eq(Users.role, "collector"),
    eq(Users.collectorAvailable, true),
    gte(Users.lastLocationAt, freshAfter),
    isNotNull(Users.lastLatitude),
    isNotNull(Users.lastLongitude),
  ));
  const nearest = candidates
    .filter(candidate => candidate.lastLatitude != null && candidate.lastLongitude != null)
    .sort((a, b) => distanceKm(report.latitude!, report.longitude!, a.lastLatitude!, a.lastLongitude!) -
      distanceKm(report.latitude!, report.longitude!, b.lastLatitude!, b.lastLongitude!));

  for (const candidate of nearest) {
    const [reserved] = await db.update(Users).set({ collectorAvailable: false })
      .where(and(eq(Users.id, candidate.id), eq(Users.collectorAvailable, true), gte(Users.lastLocationAt, freshAfter)))
      .returning({ id: Users.id });
    if (!reserved) continue;
    const [assigned] = await db.update(Reports).set({
      collectorId: candidate.id, assignedAt: new Date(), status: "assigned",
    }).where(and(eq(Reports.id, report.id), eq(Reports.status, "pending"))).returning({ id: Reports.id });
    if (assigned) return candidate.id;
    await db.update(Users).set({ collectorAvailable: true }).where(eq(Users.id, candidate.id));
  }
  return null;
}

export async function createMobileReport(input: {
  user: MobileUser; location: string; latitude: number; longitude: number;
  wasteType: string; amount: string; imageUrl?: string; verificationResult?: string;
}) {
  const [report] = await db.insert(Reports).values({
    userId: input.user.id, location: input.location, latitude: input.latitude, longitude: input.longitude,
    wasteType: input.wasteType, amount: input.amount || "Not specified", imageUrl: input.imageUrl,
    verificationResult: input.verificationResult ? JSON.parse(input.verificationResult) : null, status: "pending",
  }).returning();
  if (!report) throw new Error("Could not save the report.");
  await updateRewardPoints(input.user.id, 10);
  await createTransaction(input.user.id, "earned_report", 10, "Points earned for reporting waste");
  if (input.user.referredByUserId != null) {
    const [referralReward] = await db.insert(Transactions).values({
      userId: input.user.referredByUserId,
      referralId: input.user.id,
      type: "earned_referral",
      amount: 50,
      description: "Invite reward for a friend's first verified waste report",
    }).onConflictDoNothing({ target: Transactions.referralId }).returning({ id: Transactions.id });
    if (referralReward) await updateRewardPoints(input.user.referredByUserId, 50);
  }
  await assignNearestAvailableCollector(report);
  const [latest] = await db.select().from(Reports).where(eq(Reports.id, report.id)).limit(1);
  return latest || report;
}

export async function getCitizenReports(userId: number, limit: number) {
  const reports = await db.select().from(Reports).where(eq(Reports.userId, userId)).orderBy(desc(Reports.createdAt)).limit(limit);
  const collectorIds = Array.from(new Set(reports.map(report => report.collectorId).filter((id): id is number => id != null)));
  const collectors = collectorIds.length ? await db.select({
    id: Users.id, name: Users.name, phone: Users.phone, lastLatitude: Users.lastLatitude,
    lastLongitude: Users.lastLongitude, lastLocationAt: Users.lastLocationAt,
  }).from(Users).where(inArray(Users.id, collectorIds)) : [];
  const byId = new Map(collectors.map(collector => [collector.id, collector]));
  return reports.map(report => {
    const collector = report.collectorId ? byId.get(report.collectorId) : null;
    return {
      ...report, collectorName: collector?.name || null, collectorPhone: collector?.phone || null,
      collectorLatitude: collector?.lastLatitude ?? null, collectorLongitude: collector?.lastLongitude ?? null,
      collectorLastLocationAt: collector?.lastLocationAt?.toISOString() || null,
    };
  });
}

export async function getCollectorTasks(collectorId: number, limit: number) {
  return db.select().from(Reports)
    .where(and(eq(Reports.collectorId, collectorId), inArray(Reports.status, ["assigned", "collected", "sold"])))
    .orderBy(desc(Reports.createdAt)).limit(limit);
}

export async function updateAssignedCollectorLocation(user: MobileUser, latitude: number, longitude: number) {
  if (user.role !== "collector") throw new Error("Collector access is required.");
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error("A valid current location is required.");
  }
  const activeTask = await db.select({ id: Reports.id }).from(Reports).where(and(
    eq(Reports.collectorId, user.id), eq(Reports.status, "assigned"),
  )).limit(1);
  if (!activeTask.length) throw new Error("No active assigned pickup is available for live tracking.");
  await db.update(Users).set({ lastLatitude: latitude, lastLongitude: longitude, lastLocationAt: new Date() })
    .where(eq(Users.id, user.id));
  return { success: true };
}

export async function getMobileLeaderboard(limit: number) {
  const [users, transactions] = await Promise.all([
    db.select({ id: Users.id, name: Users.name }).from(Users).where(eq(Users.role, "citizen")),
    db.select({ userId: Transactions.userId, type: Transactions.type, amount: Transactions.amount }).from(Transactions),
  ]);
  const pointsByUser = new Map<number, number>();
  for (const transaction of transactions) {
    const current = pointsByUser.get(transaction.userId) || 0;
    pointsByUser.set(transaction.userId, current + (transaction.type.startsWith("earned") ? transaction.amount : -transaction.amount));
  }
  return users.map(user => ({ name: user.name, points: Math.max(0, pointsByUser.get(user.id) || 0) }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((user, index) => ({ ...user, rank: index + 1 }));
}

export async function setCollectorAvailability(user: MobileUser, available: boolean, latitude?: number, longitude?: number) {
  if (user.role !== "collector") throw new Error("Collector access is required.");
  if (available && (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude! < -90 || latitude! > 90 || longitude! < -180 || longitude! > 180)) {
    throw new Error("A valid current location is required to go online.");
  }
  if (available) {
    const activeTask = await db.select({ id: Reports.id }).from(Reports).where(and(
      eq(Reports.collectorId, user.id), inArray(Reports.status, ["assigned", "collected"]),
    )).limit(1);
    if (activeTask.length) throw new Error("Finish your current collection before going online again.");
  }
  await db.update(Users).set({
    collectorAvailable: available,
    ...(available ? { lastLatitude: latitude!, lastLongitude: longitude!, lastLocationAt: new Date() } : {}),
  }).where(eq(Users.id, user.id));
  if (!available) return { assignedCount: 0 };

  const pending = await db.select().from(Reports).where(and(
    eq(Reports.status, "pending"), isNotNull(Reports.latitude), isNotNull(Reports.longitude),
  )).orderBy(asc(Reports.createdAt)).limit(100);
  let assignedCount = 0;
  for (const report of pending) {
    if (await assignNearestAvailableCollector(report) === user.id) assignedCount += 1;
  }
  return { assignedCount };
}

export async function collectAssignedReport(user: MobileUser, reportId: number) {
  if (user.role !== "collector") throw new Error("Collector access is required.");
  const [report] = await db.update(Reports).set({ status: "collected" })
    .where(and(eq(Reports.id, reportId), eq(Reports.collectorId, user.id), eq(Reports.status, "assigned"))).returning();
  if (!report) throw new Error("This report is no longer assigned to you.");
  await db.insert(CollectedWastes).values({ reportId, collectorId: user.id, collectionDate: new Date(), status: "collected" });
  // Collector earns 20 pts
  await updateRewardPoints(user.id, 20);
  await createTransaction(user.id, "earned_collect", 20, "Points earned for collecting waste");
  // Citizen earns 50 pts when their waste is picked up ✅
  await updateRewardPoints(report.userId, 50);
  await createTransaction(report.userId, "earned_collected", 50, "Points earned — your waste was collected!");
  return report;
}

export async function declineCollectorTask(user: MobileUser, reportId: number) {
  if (user.role !== "collector") throw new Error("Collector access is required.");
  const [report] = await db.select().from(Reports)
    .where(and(eq(Reports.id, reportId), eq(Reports.collectorId, user.id), eq(Reports.status, "assigned")))
    .limit(1);
  if (!report) throw new Error("Assignment not found or already processed.");
  // Reset report back to pending
  await db.update(Reports).set({ collectorId: null, assignedAt: null, status: "pending" })
    .where(eq(Reports.id, reportId));
  // Make collector available again
  await db.update(Users).set({ collectorAvailable: true }).where(eq(Users.id, user.id));
  // Try to re-assign to next nearest collector
  const [freshReport] = await db.select().from(Reports).where(eq(Reports.id, reportId)).limit(1);
  if (freshReport) await assignNearestAvailableCollector(freshReport);
  return { success: true };
}

export async function recordCollectorSale(user: MobileUser, reportId: number, saleRevenue: number) {
  if (user.role !== "collector") throw new Error("Collector access is required.");
  if (!Number.isSafeInteger(saleRevenue) || saleRevenue < 0) throw new Error("Enter a valid sale amount in rupees.");
  const [report] = await db.update(Reports).set({ status: "sold", saleRevenue, soldAt: new Date() })
    .where(and(eq(Reports.id, reportId), eq(Reports.collectorId, user.id), eq(Reports.status, "collected"))).returning();
  if (!report) throw new Error("Only your collected waste can be marked as sold.");
  return report;
}

export async function getAdminDispatchSnapshot() {
  const [users, reports, transactions] = await Promise.all([
    db.select().from(Users).orderBy(desc(Users.createdAt)),
    db.select().from(Reports).orderBy(desc(Reports.createdAt)),
    db.select().from(Transactions),
  ]);
  const usersById = new Map(users.map(user => [user.id, user]));
  const userRows = users.map(user => {
    const ownReports = reports.filter(report => report.userId === user.id);
    const collections = reports.filter(report => report.collectorId === user.id && ["collected", "sold"].includes(report.status));
    const balance = transactions.filter(transaction => transaction.userId === user.id)
      .reduce((sum, transaction) => transaction.type.startsWith("earned") ? sum + transaction.amount : sum - transaction.amount, 0);
    const wasteKg = ownReports.reduce((sum, report) => {
      const match = report.amount.match(/(\d+(\.\d+)?)/);
      return sum + (match ? Number(match[0]) : 0);
    }, 0);
    return {
      id: user.id, name: user.name, email: user.email, role: user.role, requestedRole: user.requestedRole,
      createdAt: user.createdAt.toISOString().split("T")[0],
      phone: user.phone, lastLatitude: user.lastLatitude, lastLongitude: user.lastLongitude,
      lastLocationAt: user.lastLocationAt?.toISOString() || null,
      collectorOnline: user.role === "collector" && user.collectorAvailable && user.lastLocationAt != null &&
        user.lastLocationAt.getTime() >= Date.now() - LOCATION_TTL_MS,
      collectorTracking: user.role === "collector" && user.lastLocationAt != null &&
        user.lastLocationAt.getTime() >= Date.now() - LOCATION_TTL_MS,
      reportsCount: ownReports.length, collectionsCount: collections.length,
      wasteReportedKg: Math.round(wasteKg * 10) / 10,
      balance: Math.max(balance, 0), rewardPoints: Math.max(balance, 0), collectorAvailable: user.collectorAvailable,
    };
  });
  const reportRows = reports.map(report => {
    const { imageUrl, ...reportWithoutImage } = report;
    const reporter = usersById.get(report.userId);
    const collector = report.collectorId ? usersById.get(report.collectorId) : null;
    return {
      ...reportWithoutImage,
      imageUrl: null,
      hasImage: Boolean(imageUrl),
      createdAt: report.createdAt.toISOString().split("T")[0],
      assignedAt: report.assignedAt?.toISOString() || null,
      soldAt: report.soldAt?.toISOString() || null,
      reporterName: reporter?.name || "Unknown", reporterEmail: reporter?.email || null, reporterPhone: reporter?.phone || null,
      collectorName: collector?.name || null, collectorEmail: collector?.email || null, collectorPhone: collector?.phone || null,
      collectorLatitude: collector?.lastLatitude ?? null, collectorLongitude: collector?.lastLongitude ?? null,
      collectorLastLocationAt: collector?.lastLocationAt?.toISOString() || null,
    };
  });
  let totalWasteKg = 0;
  reports.forEach(report => {
    const match = report.amount.match(/(\d+(\.\d+)?)/);
    if (match) totalWasteKg += Number(match[0]);
  });
  const totalRevenue = reports.filter(report => report.status === "sold").reduce((sum, report) => sum + (report.saleRevenue || 0), 0);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayReports = reports.filter(r => r.createdAt >= startOfToday);
  const todayTransactions = transactions.filter(t => t.date >= startOfToday);

  const todayWasteKg = todayReports.reduce((sum, r) => {
    const match = r.amount.match(/(\d+(\.\d+)?)/);
    return sum + (match ? Number(match[0]) : 0);
  }, 0);

  const citizenUserIds = new Set(users.filter(u => u.role === "citizen").map(u => u.id));
  const collectorUserIds = new Set(users.filter(u => u.role === "collector").map(u => u.id));

  const citizenPointsEarned = transactions
    .filter(t => citizenUserIds.has(t.userId) && t.type.startsWith("earned"))
    .reduce((sum, t) => sum + t.amount, 0);

  const collectorPointsEarned = transactions
    .filter(t => collectorUserIds.has(t.userId) && t.type.startsWith("earned"))
    .reduce((sum, t) => sum + t.amount, 0);

  const todayCitizenPoints = todayTransactions
    .filter(t => citizenUserIds.has(t.userId) && t.type.startsWith("earned"))
    .reduce((sum, t) => sum + t.amount, 0);

  const todayCollectorPoints = todayTransactions
    .filter(t => collectorUserIds.has(t.userId) && t.type.startsWith("earned"))
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    metrics: {
      totalUsers: users.length, totalCitizens: users.filter(user => user.role === "citizen").length,
      totalCollectors: users.filter(user => user.role === "collector").length, totalReports: reports.length,
      onlineCollectors: users.filter(user => user.role === "collector" && user.collectorAvailable &&
        user.lastLocationAt != null && user.lastLocationAt.getTime() >= Date.now() - LOCATION_TTL_MS).length,
      totalCollected: reports.filter(report => report.status === "collected" || report.status === "sold").length,
      totalSold: reports.filter(report => report.status === "sold").length,
      assignedReports: reports.filter(report => report.status === "assigned").length,
      pendingReports: reports.filter(report => report.status === "pending").length,
      totalRevenue, totalWasteKg: Math.round(totalWasteKg * 10) / 10,
      co2OffsetKg: Math.round(totalWasteKg * 0.5 * 10) / 10,
      totalPointsEarned: transactions.filter(transaction => transaction.type.startsWith("earned")).reduce((sum, transaction) => sum + transaction.amount, 0),
      totalPointsRedeemed: transactions.filter(transaction => transaction.type === "redeemed").reduce((sum, transaction) => sum + transaction.amount, 0),
      // Daily Impact & Role breakdowns
      todayReportsCount: todayReports.length,
      todayResolvedCount: todayReports.filter(r => r.status === "collected" || r.status === "sold").length,
      todayWasteKg: Math.round(todayWasteKg * 10) / 10,
      citizenPointsEarned,
      collectorPointsEarned,
      todayCitizenPoints,
      todayCollectorPoints,
    },
    users: userRows, reports: reportRows,
  };
}

export async function getAdminReportImage(reportId: number) {
  const [report] = await db.select({ imageUrl: Reports.imageUrl }).from(Reports).where(eq(Reports.id, reportId)).limit(1);
  return report?.imageUrl ?? null;
}

export async function updateAdminUserRole(userId: number, role: "citizen" | "collector", adminEmail: string) {
  const [admin] = await db.select({ id: Users.id }).from(Users).where(eq(Users.email, adminEmail)).limit(1);
  if (!admin) throw new Error("Admin account not found. Sign in again.");
  const [existing] = await db.select().from(Users).where(eq(Users.id, userId)).limit(1);
  if (!existing) throw new Error("User not found.");
  if (existing.role === "admin") throw new Error("Admin accounts cannot be changed here.");
  if (existing.role === "collector") {
    const [activeTask] = await db.select({ id: Reports.id }).from(Reports).where(and(
      eq(Reports.collectorId, userId), inArray(Reports.status, ["assigned", "collected"]),
    )).limit(1);
    if (activeTask) throw new Error("Complete or reassign this collector's active pickup before changing their role.");
  }
  const [updated] = await db.update(Users).set({ role, collectorAvailable: false, requestedRole: null })
    .where(eq(Users.id, userId)).returning();
  if (updated) await db.insert(AuditLogs).values({
    adminId: admin.id,
    action: "UPDATE_USER_ROLE", entityType: "user", entityId: userId,
    oldValue: { role: existing.role, requestedRole: existing.requestedRole }, newValue: { role: updated.role, requestedRole: updated.requestedRole },
  });
  return updated;
}

export async function updateAdminSale(reportId: number, saleRevenue: number, adminEmail: string) {
  if (!Number.isSafeInteger(saleRevenue) || saleRevenue < 0) throw new Error("Enter a valid sale amount in rupees.");

  const [admin] = await db.select().from(Users).where(eq(Users.email, adminEmail)).limit(1);
  if (!admin) throw new Error("Admin not found.");

  const [existingReport] = await db.select().from(Reports).where(eq(Reports.id, reportId)).limit(1);
  if (!existingReport) throw new Error("Report not found.");

  const [report] = await db.update(Reports).set({ status: "sold", saleRevenue, soldAt: new Date() })
    .where(and(eq(Reports.id, reportId), inArray(Reports.status, ["collected", "sold"]))).returning();

  if (!report) throw new Error("Only collected waste can be recorded as sold.");

  await db.insert(AuditLogs).values({
    adminId: admin.id,
    action: "UPDATE_SALE",
    entityType: "report",
    entityId: report.id,
    oldValue: { saleRevenue: existingReport.saleRevenue },
    newValue: { saleRevenue: report.saleRevenue },
  });

  return report;
}

export async function updateReportAdmin(
  reportId: number,
  status: string,
  collectorId: number | null,
  adminEmail: string
) {
  if (status !== "pending" && status !== "assigned") {
    throw new Error("Admin can assign or reopen a pickup. Collectors must confirm collection and sale.");
  }
  const [admin] = await db.select().from(Users).where(eq(Users.email, adminEmail)).limit(1);
  if (!admin) throw new Error("Admin not found.");

  const [existingReport] = await db.select().from(Reports).where(eq(Reports.id, reportId)).limit(1);
  if (!existingReport) throw new Error("Report not found.");

  if (status === "assigned" && collectorId == null) throw new Error("Choose a collector before assigning this pickup.");
  if (status === "pending" && collectorId != null) throw new Error("A pending report cannot keep an assigned collector.");
  if (["collected", "sold"].includes(existingReport.status)) throw new Error("Completed pickups cannot be reopened from the admin panel.");

  const oldCollectorId = existingReport.collectorId;
  const nextCollectorId = status === "assigned" ? collectorId! : null;
  if (nextCollectorId !== null && nextCollectorId !== oldCollectorId) {
    const [collector] = await db.select().from(Users).where(and(
      eq(Users.id, nextCollectorId), eq(Users.role, "collector"),
    )).limit(1);
    if (!collector) throw new Error("Choose an active collector account.");
    const [activeTask] = await db.select({ id: Reports.id }).from(Reports).where(and(
      eq(Reports.collectorId, nextCollectorId), inArray(Reports.status, ["assigned", "collected"]),
    )).limit(1);
    if (activeTask) throw new Error("This collector already has an active pickup.");
    const [reserved] = await db.update(Users).set({ collectorAvailable: false }).where(and(
      eq(Users.id, nextCollectorId), eq(Users.role, "collector"), eq(Users.collectorAvailable, true),
    )).returning({ id: Users.id });
    if (!reserved) throw new Error("This collector is offline or was assigned another pickup. Refresh and choose another.");
  }

  const [report] = await db.update(Reports).set({
    status,
    collectorId: nextCollectorId,
    assignedAt: status === "assigned" ? (oldCollectorId === nextCollectorId ? existingReport.assignedAt : new Date()) : null,
  }).where(and(eq(Reports.id, reportId), inArray(Reports.status, ["pending", "assigned"]))).returning();
  if (!report) {
    if (nextCollectorId !== null && nextCollectorId !== oldCollectorId) {
      await db.update(Users).set({ collectorAvailable: true }).where(eq(Users.id, nextCollectorId));
    }
    throw new Error("This pickup changed while you were updating it. Refresh and try again.");
  }
  if (oldCollectorId !== null && oldCollectorId !== nextCollectorId) {
    const [otherActiveTask] = await db.select({ id: Reports.id }).from(Reports).where(and(
      eq(Reports.collectorId, oldCollectorId), inArray(Reports.status, ["assigned", "collected"]),
    )).limit(1);
    if (!otherActiveTask) await db.update(Users).set({ collectorAvailable: true }).where(eq(Users.id, oldCollectorId));
  }

  // Log audit
  await db.insert(AuditLogs).values({
    adminId: admin.id,
    action: "UPDATE_REPORT",
    entityType: "report",
    entityId: report.id,
    oldValue: { status: existingReport.status, collectorId: existingReport.collectorId },
    newValue: { status: report.status, collectorId: report.collectorId },
  });

  return report;
}
