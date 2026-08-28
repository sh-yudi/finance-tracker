import { z } from 'zod';
import prisma from '../config/prisma';
import { Category, SpendType, PaymentMethod } from '@prisma/client';
import { runFraudCheck } from './fraudService';

export const createExpenseSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    currency: z.string().length(3).optional(),
    category: z.nativeEnum(Category).optional(),
    spendType: z.nativeEnum(SpendType).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    recipient: z.string().min(1).optional(),
    note: z.string().optional(),
    date: z.string().datetime().optional(),
    isRecurring: z.boolean().optional(),
    frequency: z.string().optional(),
  }),
});

const listQuerySchema = z.object({
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    category: z.nativeEnum(Category).optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
  }),
});

export async function getExpenses(
  userId: string,
  query: {
    from?: string;
    to?: string;
    category?: Category;
    limit?: string;
    offset?: string;
  },
) {
  const where: Record<string, unknown> = { userId };
  if (query.category) where.category = query.category;
  if (query.from || query.to) {
    where.date = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(query.to) } : {}),
    };
  }

  const limit = Math.min(parseInt(query.limit || '50', 10), 200);
  const offset = parseInt(query.offset || '0', 10);

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
      include: { payee: { select: { riskLevel: true, riskScore: true } } },
    }),
    prisma.expense.count({ where }),
  ]);

  return { expenses, total, limit, offset };
}

export async function getExpense(userId: string, id: string) {
  const expense = await prisma.expense.findFirst({
    where: { id, userId },
    include: { payee: true },
  });
  if (!expense) {
    throw Object.assign(new Error('Expense not found'), { status: 404 });
  }
  return expense;
}

export async function createExpense(
  userId: string,
  data: z.infer<typeof createExpenseSchema>['body'],
) {
  let payeeId: string | undefined;

  if (data.recipient) {
    payeeId = await getOrCreatePayee(userId, data.recipient);
  }

  const expense = await prisma.expense.create({
    data: {
      userId,
      amount: data.amount,
      currency: data.currency || 'USD',
      category: data.category || Category.OTHER,
      spendType: data.spendType || SpendType.OPTIONAL,
      paymentMethod: data.paymentMethod || PaymentMethod.OTHER,
      recipient: data.recipient,
      payeeId,
      note: data.note,
      date: data.date ? new Date(data.date) : new Date(),
      isRecurring: data.isRecurring || false,
      frequency: data.frequency,
    },
  });

  const fraudResult = await runFraudCheck(userId, {
    amount: data.amount,
    recipient: data.recipient,
    payeeId,
  });

  const updated = await prisma.expense.update({
    where: { id: expense.id },
    data: {
      risk: fraudResult.risk,
      fraudStatus: 'CLEAR',
      fraudScore: fraudResult.score,
      consequence: computeConsequence(data, fraudResult),
    },
  });

  return updated;
}

async function getOrCreatePayee(userId: string, name: string): Promise<string> {
  const existing = await prisma.payee.findUnique({
    where: { userId_name: { userId, name } },
  });
  if (existing) return existing.id;

  const created = await prisma.payee.create({
    data: { userId, name },
  });
  return created.id;
}

function computeConsequence(
  data: z.infer<typeof createExpenseSchema>['body'],
  fraud: { risk: string; score: number },
): string {
  const monthly = data.amount * (data.isRecurring ? 1 : 4.3);
  const annual = data.amount * (data.isRecurring ? 12 : 52);
  const parts = [
    `This ${data.spendType?.toLowerCase() ?? 'optional'} expense of ${data.currency ?? 'USD'} ${data.amount} is roughly ${monthly.toFixed(
      2,
    )}/month or ${annual.toFixed(2)}/year.`,
  ];
  if (fraud.score > 50) {
    parts.push(`High fraud risk (${fraud.risk}). Consider verifying the recipient before paying.`);
  }
  return parts.join(' ');
}

export { listQuerySchema };
