import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RiskLevel } from '../types';
import { colors, riskColors } from '../theme';

interface RiskBadgeProps {
  level: RiskLevel | null | undefined;
  score?: number | null;
}

export function RiskBadge({ level, score }: RiskBadgeProps) {
  if (!level) return null;
  const bg = riskColors[level] || colors.textMuted;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.text}>
        {level}
        {score !== null && score !== undefined ? ` · ${score}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
