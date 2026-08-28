import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useExpenseStore } from '../store/expenseStore';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { Card } from '../components/Card';
import { RiskBadge } from '../components/RiskBadge';
import { Category, SpendType, PaymentMethod, Expense } from '../types';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

const CATEGORIES = Object.values(Category);
const SPEND_TYPES = Object.values(SpendType);
const PAYMENT_METHODS = Object.values(PaymentMethod);

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Text
      style={[
        styles.chip,
        selected && { backgroundColor: colors.primary, color: colors.white, borderColor: colors.primary },
      ]}
      onPress={onPress}
    >
      {label}
    </Text>
  );
}

export function AddExpenseScreen({ navigation }: Props) {
  const { addExpense, isLoading, error } = useExpenseStore();

  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<Category>(Category.FOOD);
  const [spendType, setSpendType] = useState<SpendType>(SpendType.ESSENTIAL);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.OTHER);
  const [result, setResult] = useState<Expense | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLocalError(null);
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setLocalError('Please enter a valid amount.');
      return;
    }
    try {
      const expense = await addExpense({
        amount: amt,
        category,
        spendType,
        paymentMethod,
        recipient: recipient || undefined,
        note: note || undefined,
      });
      setResult(expense);
    } catch (err: any) {
      setLocalError(err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error || localError ? (
          <Text style={styles.error}>{error || localError}</Text>
        ) : null}

        <TextField
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        <TextField
          label="Recipient / Payee"
          value={recipient}
          onChangeText={setRecipient}
          placeholder="Who did you pay?"
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chipWrap}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              selected={category === c}
              onPress={() => setCategory(c)}
            />
          ))}
        </View>

        <Text style={styles.label}>Spend Type</Text>
        <View style={styles.chipWrap}>
          {SPEND_TYPES.map((s) => (
            <Chip
              key={s}
              label={s}
              selected={spendType === s}
              onPress={() => setSpendType(s)}
            />
          ))}
        </View>

        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.chipWrap}>
          {PAYMENT_METHODS.map((p) => (
            <Chip
              key={p}
              label={p}
              selected={paymentMethod === p}
              onPress={() => setPaymentMethod(p)}
            />
          ))}
        </View>

        <TextField
          label="Note"
          value={note}
          onChangeText={setNote}
          placeholder="Optional note"
          multiline
        />

        <Button title="Add Expense" onPress={handleSubmit} loading={isLoading} />

        {result ? (
          <Card title="Analysis Result" style={styles.result}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Fraud Risk:</Text>
              <RiskBadge level={result.risk} score={result.fraudScore} />
            </View>
            {result.consequence ? (
              <Text style={styles.consequence}>{result.consequence}</Text>
            ) : null}
            <Button
              title="Done"
              onPress={() => navigation.goBack()}
              style={styles.doneButton}
            />
          </Card>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  error: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  label: {
    fontSize: typography.small,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: colors.text,
    overflow: 'hidden',
  },
  result: { marginTop: spacing.lg },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  resultLabel: { fontSize: typography.body, color: colors.text },
  consequence: { fontSize: typography.small, color: colors.textMuted, lineHeight: 20 },
  doneButton: { marginTop: spacing.md },
});
