import prisma from '../config/prisma';
import { Category, SpendType } from '@prisma/client';

export interface DailyReportResult {
  date: string;
  totalSpent: number;
  totalIncome: number;
  expenseCount: number;
  categoryBreakdown: Record<string, number>;
  topRecipients: { recipient: string; total: number }[];
  optionalSpend: number;
  essentialSpend: number;
  spendRating: number;
  ratingLabel: string;
  savingsTip: string;
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function computeRating(params: {
  totalSpent: number;
  totalIncome: number;
  optionalSpend: number;
  essentialSpend: number;
}) {
  if (params.totalIncome > 0) {
    const spendRatio = params.totalSpent / params.totalIncome;
    if (spendRatio > 1) return 1;
    if (spendRatio > 0.8) return 3;
    if (spendRatio > 0.6) return 5;
    if (spendRatio > 0.4) return 7;
    return 9;
  }

  if (params.totalSpent === 0) return 10;
  if (params.optionalSpend > params.essentialSpend) return 3;
  if (params.optionalSpend > params.essentialSpend * 0.5) return 5;
  return 8;
}

function ratingLabel(rating: number): string {
  if (rating >= 9) return 'Excellent - disciplined spending';
  if (rating >= 7) return 'Good - well balanced';
  if (rating >= 5) return 'Average - some optional spending';
  if (rating >= 3) return 'Below average - high optional spending';
  return 'Poor - spending exceeds income';
}

function savingsTip(optionalSpend: number, topRecipient?: { recipient: string; total: number }): string {
  const tips: string[] = [];
  if (optionalSpend > 0) {
    tips.push(`Reducing optional spending by half would save ~${Math.round(optionalSpend / 2)} this day.`);
  }
  if (topRecipient && topRecipient.total > 0) {
    tips.push(`Your biggest expense was "${topRecipient.recipient}" (${topRecipient.total}). Consider if this is essential.`);
  }
  return tips.join(' ') || 'No significant spending today - keep it up!';
}

export async function generateDailyReport(
  userId: string,
  date: Date = new Date(),
): Promise<DailyReportResult> {
  const dayKey = toLocalDateKey(date);
  const start = new Date(`${dayKey}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: start, lt: end } },
    include: { payee: { select: { name: true } } },
  });

  let totalSpent = 0;
  let totalIncome = 0;
  let optionalSpend = 0;
  let essentialSpend = 0;
  const categoryBreakdown: Record<string, number> = {};
  const recipientMap = new Map<string, number>();

  for (const e of expenses) {
    const amt = Number(e.amount);
    if (e.category === Category.INCOME || e.spendType === SpendType.INCOME) {
      totalIncome += amt;
      continue;
    }

    totalSpent += amt;
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + amt;

    const recipientName = e.payee?.name || e.recipient || 'Unknown';
    recipientMap.set(recipientName, (recipientMap.get(recipientName) || 0) + amt);

    if (e.spendType === SpendType.ESSENTIAL) essentialSpend += amt;
    else optionalSpend += amt;
  }

  const topRecipients = [...recipientMap.entries()]
    .map(([recipient, total]) => ({ recipient, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const rating = computeRating({ totalSpent, totalIncome, optionalSpend, essentialSpend });

  const result: DailyReportResult = {
    date: dayKey,
    totalSpent,
    totalIncome,
    expenseCount: expenses.length,
    categoryBreakdown,
    topRecipients,
    optionalSpend,
    essentialSpend,
    spendRating: rating,
    ratingLabel: ratingLabel(rating),
    savingsTip: savingsTip(optionalSpend, topRecipients[0]),
  };

  await prisma.dailyReport.upsert({
    where: { userId_date: { userId, date: new Date(`${dayKey}T00:00:00.000Z`) } },
    update: {
      totalSpent,
      totalIncome,
      spendRating: rating,
      expenseCount: expenses.length,
      categoryBreakdown,
      topRecipients,
      optionalSpend,
      essentialSpend,
      savingsTip: result.savingsTip,
    },
    create: {
      userId,
      date: new Date(`${dayKey}T00:00:00.000Z`),
      totalSpent,
      totalIncome,
      spendRating: rating,
      expenseCount: expenses.length,
      categoryBreakdown,
      topRecipients,
      optionalSpend,
      essentialSpend,
      savingsTip: result.savingsTip,
    },
  });

  return result;
}

export async function getDailyReports(userId: string, from?: string, to?: string) {
  const where: Record<string, unknown> = { userId };
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(`${toLocalDateKey(new Date(from))}T00:00:00.000Z`) } : {}),
      ...(to ? { lte: new Date(`${toLocalDateKey(new Date(to))}T23:59:59.999Z`) } : {}),
    };
  }

  return prisma.dailyReport.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 30,
  });
}
