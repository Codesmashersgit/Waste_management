import type { WasteReport } from './api';

export function reportDate(report: WasteReport): Date | null {
  const raw = report.createdAt ?? report.date;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function reportKilograms(report: WasteReport): number | null {
  const match = report.amount.match(/(\d+(?:[.,]\d+)?)\s*(kg|kgs|kilograms?|g|grams?)\b/i);
  if (!match) return null;
  const quantity = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(quantity)) return null;
  return /^g|gram/i.test(match[2]) ? quantity / 1000 : quantity;
}

export function collectedKilograms(reports: WasteReport[], from?: Date, until?: Date): number | null {
  const collected = reports.filter(report => report.status === 'collected' || report.status === 'sold');
  let total = 0;
  let knownAmounts = 0;
  for (const report of collected) {
    const date = reportDate(report);
    if (from && (!date || date < from)) continue;
    if (until && (!date || date >= until)) continue;
    const kilograms = reportKilograms(report);
    if (kilograms === null) continue;
    total += kilograms;
    knownAmounts += 1;
  }
  return knownAmounts > 0 ? total : null;
}

export function completedReportStreak(reports: WasteReport[], now = new Date()): number {
  const completedDays = new Set(reports
    .filter(report => report.status === 'collected' || report.status === 'sold')
    .map(report => reportDate(report))
    .filter((date): date is Date => date !== null)
    .map(date => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`));

  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayKey = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
  if (!completedDays.has(todayKey)) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (completedDays.has(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
