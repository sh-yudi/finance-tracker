import prisma from '../config/prisma';
import config from '../config';
import { RiskLevel } from '@prisma/client';

interface FraudInput {
  amount: number;
  recipient?: string;
  payeeId?: string;
}

export interface FraudResult {
  score: number;
  risk: RiskLevel;
}

const THRESHOLDS = {
  newPayee: 15,
  unusualAmount: 20,
  recipientMismatch: 15,
  counterAccount: 25,
  suspiciousKeywords: 25,
};

const SUSPICIOUS_KEYWORDS = [
  'lottery', 'prize', 'gift card', 'forex', 'crypto invest',
  'herbal', 'miracle', 'double your', 'quick money', 'government fee',
  'refund', 'bounty', 'inheritance', 'wire first',
];

export async function runFraudCheck(
  userId: string,
  input: FraudInput,
): Promise<FraudResult> {
  const ttl = config.fraud.cacheTtl;

  if (input.payeeId) {
    const cached = await prisma.payee.findFirst({
      where: { id: input.payeeId, lastChecked: { gte: new Date(Date.now() - ttl * 1000) } },
    });
    if (cached && cached.fraudStatus !== 'PENDING') {
      return { score: cached.riskScore ?? 0, risk: cached.riskLevel };
    }
  }

  const score = await computeInternalScore(userId, input);

  if (config.fraud.provider !== 'internal') {
    const checked = await runWebCheck(input.recipient);
    score.score = Math.min(100, score.score + checked.bonus);
    score.flags.push(...checked.flags);
  }

  const risk = toRiskLevel(score.score);

  await persistResult(userId, input, score.score, risk, score.flags);

  return { score: score.score, risk };
}

async function computeInternalScore(
  userId: string,
  input: FraudInput,
): Promise<{ score: number; flags: string[] }> {
  let score = 0;
  const flags: string[] = [];

  if (input.payeeId) {
    const payee = await prisma.payee.findUnique({ where: { id: input.payeeId } });
    if (payee) {
      const existing = await prisma.expense.count({ where: { payeeId: input.payeeId, userId } });
      if (existing === 0) {
        score += THRESHOLDS.newPayee;
        flags.push('New payee, no prior transaction history');
      }

      if (payee.fraudStatus === 'CONFIRMED_FRAUD') {
        score += 40;
        flags.push('Payee previously flagged as fraudulent');
      }
    }
  }

  const avg = await prisma.expense.aggregate({
    where: { userId, amount: { not: input.amount } },
    _avg: { amount: true },
  });
  const avgAmount = Number(avg._avg.amount);
  if (avgAmount > 0 && input.amount > avgAmount * 3) {
    score += THRESHOLDS.unusualAmount;
    flags.push(`Amount ${input.amount} is >3x the user's typical expense`);
  }

  const recipient = (input.recipient || '').toLowerCase();
  if (recipient) {
    for (const kw of SUSPICIOUS_KEYWORDS) {
      if (recipient.includes(kw)) {
        score += THRESHOLDS.suspiciousKeywords;
        flags.push(`Recipient name contains suspicious keyword: "${kw}"`);
        break;
      }
    }
  }

  return { score: Math.min(100, score), flags };
}

function toRiskLevel(score: number): RiskLevel {
  if (score >= 70) return RiskLevel.CRITICAL;
  if (score >= 45) return RiskLevel.HIGH;
  if (score >= 20) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
}

async function runWebCheck(recipient?: string) {
  const flags: string[] = [];
  let bonus = 0;

  if (!recipient) return { bonus, flags };

  try {
    const search = await webSearchRecipient(recipient);
    if (search.found && (search.scamMentions || 0) >= 2) {
      bonus += 15;
      flags.push('Web search found multiple scam/fraud mentions');
    }
    if (search.notFound && search.lowPresence) {
      bonus += 10;
      flags.push('Recipient has very low web presence, could be a newly created identity');
    }
  } catch {
    // Web check is best-effort; never block on it
  }

  return { bonus, flags };
}

async function webSearchRecipient(_recipient: string) {
  return { found: false, scamMentions: 0, notFound: false, lowPresence: false };
}

async function persistResult(
  userId: string,
  input: FraudInput,
  score: number,
  risk: RiskLevel,
  flags: string[],
): Promise<void> {
  const status = score >= 45 ? 'SUSPECTED' : 'CLEAR';

  await prisma.fraudCheck.create({
    data: {
      payeeId: input.payeeId ?? (await upsertPayeeForScoring(userId, input.recipient)),
      provider: config.fraud.provider,
      score,
      level: risk,
      details: { flags },
    },
  });

  if (input.payeeId) {
    await prisma.payee.update({
      where: { id: input.payeeId },
      data: {
        riskScore: score,
        riskLevel: risk,
        fraudStatus: status,
        lastChecked: new Date(),
        checkCount: { increment: 1 },
      },
    });
  }
}

async function upsertPayeeForScoring(
  userId: string,
  recipient?: string,
): Promise<string> {
  if (!recipient) {
    throw new Error('Cannot persist fraud check without a recipient or payee');
  }
  const payeeId = await getOrCreatePayee(userId, recipient);
  return payeeId;
}

async function getOrCreatePayee(userId: string, name: string): Promise<string> {
  const existing = await prisma.payee.findUnique({
    where: { userId_name: { userId, name } },
  });
  if (existing) return existing.id;
  const created = await prisma.payee.create({ data: { userId, name } });
  return created.id;
}
