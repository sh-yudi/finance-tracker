import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { useExpenseStore } from '../store/expenseStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { DailyReport } from '../types';
import { categoryColors, colors, spacing, typography } from '../theme';

function ratingColor(rating: number): string {
  if (rating >= 7) return colors.success;
  if (rating >= 5) return colors.warning;
  return colors.danger;
}

export function ReportsScreen() {
  const { report, generateDailyReport, isLoading } = useExpenseStore();
  const [localError, setLocalError] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        try {
          await generateDailyReport();
        } catch (err: any) {
          setLocalError(err.message);
        }
      })();
    }, [generateDailyReport]),
  );

  const screenWidth = Dimensions.get('window').width - 48;

  const pieData = report
    ? Object.entries(report.categoryBreakdown).map(([name, value]) => ({
        name,
        population: value,
        color: categoryColors[name] || colors.textMuted,
        legendFontColor: colors.textMuted,
        legendFontSize: 12,
      }))
    : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {localError ? <Text style={styles.error}>{localError}</Text> : null}

      {!report ? (
        <Text style={styles.empty}>Loading report...</Text>
      ) : (
        <>
          <Card style={styles.ratingCard}>
            <Text style={styles.ratingLabel}>Today's Spend Rating</Text>
            <Text style={[styles.ratingValue, { color: ratingColor(report.spendRating) }]}>
              {report.spendRating}/10
            </Text>
            <Text style={styles.ratingText}>{report.ratingLabel}</Text>
            <Text style={styles.amount}>{report.totalSpent.toFixed(2)} {report.date.slice(0, 10)}</Text>
          </Card>

          <Card title="Category Breakdown">
            {pieData.length > 0 ? (
              <PieChart
                data={pieData}
                width={screenWidth}
                height={200}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                chartConfig={{
                  color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                  labelColor: () => colors.textMuted,
                }}
                absolute
              />
            ) : (
              <Text style={styles.empty}>No spending yet.</Text>
            )}
          </Card>

          <Card title="Summary">
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Essential</Text>
              <Text style={styles.sumValue}>{report.essentialSpend.toFixed(2)}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Optional</Text>
              <Text style={styles.sumValue}>{report.optionalSpend.toFixed(2)}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Transactions</Text>
              <Text style={styles.sumValue}>{report.expenseCount}</Text>
            </View>
          </Card>

          {report.topRecipients.length > 0 ? (
            <Card title="Top Recipients">
              {report.topRecipients.map((r) => (
                <View key={r.recipient} style={styles.sumRow}>
                  <Text style={styles.sumLabel} numberOfLines={1}>
                    {r.recipient}
                  </Text>
                  <Text style={styles.sumValue}>{r.total.toFixed(2)}</Text>
                </View>
              ))}
            </Card>
          ) : null}

          {report.savingsTip ? (
            <Card title="Savings Tip">
              <Text style={styles.tip}>{report.savingsTip}</Text>
            </Card>
          ) : null}

          <Button
            title="Refresh Report"
            variant="secondary"
            onPress={() => generateDailyReport()}
            loading={isLoading}
            style={styles.refresh}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  error: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  empty: { color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
  ratingCard: { alignItems: 'center' },
  ratingLabel: { fontSize: typography.body, color: colors.textMuted },
  ratingValue: { fontSize: 56, fontWeight: '700', marginVertical: spacing.sm },
  ratingText: { fontSize: typography.body, fontWeight: '600', color: colors.text },
  amount: { fontSize: typography.small, color: colors.textMuted, marginTop: spacing.xs },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
  },
  sumLabel: { fontSize: typography.small, color: colors.text, flex: 1 },
  sumValue: { fontSize: typography.small, fontWeight: '600', color: colors.text },
  tip: { fontSize: typography.small, color: colors.textMuted, lineHeight: 20 },
  refresh: { marginTop: spacing.sm },
});
