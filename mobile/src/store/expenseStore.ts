import { create } from 'zustand';
import { api } from '../api/client';
import { Category, Expense, DailyReport, SpendType, PaymentMethod } from '../types';

interface Paginated {
  expenses: Expense[];
  total: number;
  limit: number;
  offset: number;
}

interface ExpenseState {
  expenses: Expense[];
  total: number;
  isLoading: boolean;
  report: DailyReport | null;
  error: string | null;
  fetchExpenses: (from?: string, to?: string, category?: Category) => Promise<void>;
  addExpense: (data: {
    amount: number;
    category: Category;
    spendType: SpendType;
    paymentMethod: PaymentMethod;
    recipient?: string;
    note?: string;
  }) => Promise<Expense>;
  generateDailyReport: () => Promise<DailyReport>;
  reset: () => void;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  total: 0,
  isLoading: false,
  report: null,
  error: null,

  fetchExpenses: async (from, to, category) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (category) params.set('category', category);
      const qs = params.toString();
      const res = await api<Paginated>(`/api/expenses${qs ? `?${qs}` : ''}`);
      set({ expenses: res.expenses, total: res.total, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  addExpense: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const expense = await api<Expense>('/api/expenses', {
        method: 'POST',
        body: data,
      });
      set((state) => ({
        expenses: [expense, ...state.expenses],
        total: state.total + 1,
        isLoading: false,
      }));
      return expense;
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  generateDailyReport: async () => {
    set({ isLoading: true, error: null });
    try {
      const report = await api<DailyReport>('/api/reports/daily', {
        method: 'POST',
      });
      set({ report, isLoading: false });
      return report;
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  reset: () => set({ expenses: [], total: 0, report: null, error: null }),
}));
