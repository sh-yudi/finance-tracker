import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useExpenseStore } from '../store/expenseStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme';
import { APP_NAME } from '../config';

export function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const resetExpenses = useExpenseStore((s) => s.reset);

  const handleLogout = async () => {
    resetExpenses();
    await logout();
  };

  return (
    <View style={styles.container}>
      <Card title="Account">
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user?.name || 'Not set'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
      </Card>

      <Card title="About">
        <Text style={styles.about}>
          {APP_NAME} tracks your spending, checks recipients for fraud risk, and
          gives you a daily spend rating with savings tips. Data stays secure.
        </Text>
      </Card>

      <Button title="Log Out" variant="danger" onPress={handleLogout} style={styles.logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  label: { fontSize: typography.body, color: colors.textMuted },
  value: { fontSize: typography.body, fontWeight: '500', color: colors.text },
  about: { fontSize: typography.small, color: colors.textMuted, lineHeight: 20 },
  logout: { marginTop: spacing.md },
});
