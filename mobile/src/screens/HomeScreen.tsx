import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useExpenseStore } from '../store/expenseStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ExpenseListItem } from '../components/ExpenseListItem';
import { colors, spacing, typography } from '../theme';
import type { Expense } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { expenses, total, isLoading, fetchExpenses, generateDailyReport } =
    useExpenseStore();
  const [refreshing, setRefreshing] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);

  const load = useCallback(async () => {
    await fetchExpenses();
  }, [fetchExpenses]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    const today = new Date().toISOString();
    const todayStr = today.slice(0, 10);
    const filtered = expenses.filter((e) => e.date.slice(0, 10) === todayStr && e.category !== 'INCOME');
    const sum = filtered.reduce((acc, e) => acc + Number(e.amount), 0);
    setTodayTotal(sum);
  }, [expenses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {user?.name ? `Hi, ${user.name}` : 'Hi there'}
          </Text>
          <Text style={styles.subtotal}>Spent today: ${todayTotal.toFixed(2)}</Text>
        </View>
        <Text style={styles.logoutLink} onPress={() => navigation.navigate('Settings')}>
          Settings
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Add Expense"
          onPress={() => navigation.navigate('AddExpense')}
          style={styles.actionButton}
        />
        <Button
          title="Daily Report"
          variant="secondary"
          onPress={() => navigation.navigate('Reports')}
          style={styles.actionButton}
        />
      </View>

      <Card title={`Recent Expenses (${total})`} style={styles.listCard}>
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ExpenseListItem expense={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {isLoading ? 'Loading...' : 'No expenses yet. Add your first expense!'}
            </Text>
          }
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  greeting: { fontSize: typography.heading, fontWeight: '600', color: colors.text },
  subtotal: { fontSize: typography.small, color: colors.textMuted, marginTop: 4 },
  logoutLink: { color: colors.danger, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionButton: { flex: 1 },
  listCard: { flex: 1, marginHorizontal: spacing.md },
  empty: { textAlign: 'center', color: colors.textMuted, padding: spacing.lg },
});
