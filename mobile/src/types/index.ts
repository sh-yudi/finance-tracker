export enum Category {
  FOOD = 'FOOD',
  TRANSPORT = 'TRANSPORT',
  BILLS = 'BILLS',
  ENTERTAINMENT = 'ENTERTAINMENT',
  SHOPPING = 'SHOPPING',
  HEALTH = 'HEALTH',
  EDUCATION = 'EDUCATION',
  INVESTMENT = 'INVESTMENT',
  DEBT = 'DEBT',
  INCOME = 'INCOME',
  OTHER = 'OTHER',
}

export enum SpendType {
  ESSENTIAL = 'ESSENTIAL',
  OPTIONAL = 'OPTIONAL',
  INVESTMENT = 'INVESTMENT',
  DEBT = 'DEBT',
  INCOME = 'INCOME',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ONLINE = 'ONLINE',
  WALLET = 'WALLET',
  OTHER = 'OTHER',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface Expense {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  category: Category;
  spendType: SpendType;
  paymentMethod: PaymentMethod;
  recipient?: string | null;
  payeeId?: string | null;
  note?: string | null;
  date: string;
  source: string;
  risk?: RiskLevel | null;
  fraudStatus: string;
  fraudScore?: number | null;
  isRecurring: boolean;
  frequency?: string | null;
  consequence?: string | null;
  rating?: number | null;
  payee?: { riskLevel: RiskLevel; riskScore: number } | null;
}

export interface DailyReport {
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
