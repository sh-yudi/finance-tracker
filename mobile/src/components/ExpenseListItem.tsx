import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Expense } from '../types';
import { categoryColors, colors, spacing, typography } from '../theme';
import { RiskBadge } from './RiskBadge';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface ExpenseListItemProps {
  expense: Expense;
}

export function ExpenseListItem({ expense }: ExpenseListItemProps) {
  const color = categoryColors[expense.category] || colors.textMuted;
  const recipient = expense.payee?.riskLevel
    ? expense.recipient
    : expense.recipient || 'Unknown';

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {recipient}
        </Text>
        <Text style={styles.category}>
          {expense.category} · {expense.spendType} · {formatDate(expense.date)}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>
          {expense.currency} {Number(expense.amount).toFixed(2)}
        </Text>
        <RiskBadge level={expense.risk} score={expense.fraudScore} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  info: { flex: 1 },
  name: { fontSize: typography.body, fontWeight: '500', color: colors.text },
  category: { fontSize: typography.caption, color: colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: typography.body, fontWeight: '600', color: colors.text, marginBottom: 4 },
});
