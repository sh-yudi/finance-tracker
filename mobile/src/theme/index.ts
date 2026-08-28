export const colors = {
  primary: '#2D6A4F',
  primaryLight: '#40916C',
  secondary: '#52B788',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1B1B1B',
  textMuted: '#6C757D',
  border: '#E5E7EB',
  danger: '#DC2626',
  warning: '#F59E0B',
  success: '#16A34A',
  info: '#2563EB',
  white: '#FFFFFF',
  black: '#000000',
};

export const riskColors: Record<string, string> = {
  LOW: colors.success,
  MEDIUM: colors.warning,
  HIGH: colors.danger,
  CRITICAL: '#7F1D1D',
};

export const categoryColors: Record<string, string> = {
  FOOD: '#F59E0B',
  TRANSPORT: '#2563EB',
  BILLS: '#7C3AED',
  ENTERTAINMENT: '#EC4899',
  SHOPPING: '#06B6D4',
  HEALTH: '#DC2626',
  EDUCATION: '#10B981',
  INVESTMENT: '#14B8A6',
  DEBT: '#F97316',
  INCOME: '#22C55E',
  OTHER: '#6B7280',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  title: 24,
  heading: 20,
  body: 16,
  small: 14,
  caption: 12,
};
