import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/Colors";
import { fonts } from "../constants/fonts";
import { spacing } from "../constants/spacing";
import { AttendanceStats } from "../types";
import { useColorScheme } from "../hooks/useColorScheme";

// Dark mode color palette
const darkColors = {
  background: "#0A0E27",
  card: "#1A1F3A",
  cardPrimary: "#1A1F3A",
  cardSecondary: "#252D4A",
  text: "#F8FAFC",
  textLight: "#CBD5E1",
  textExtraLight: "#94A3B8",
  border: "#3B4563",
  borderLight: "#3B4563",
}

const lightColors = {
  background: "#F5F7FA",
  card: "#FFFFFF",
  cardPrimary: "#FFFFFF",
  cardSecondary: "#F0F4F8",
  text: "#0F172A",
  textLight: "#475569",
  textExtraLight: "#64748B",
  border: "#E2E8F0",
  borderLight: "#E2E8F0",
}

interface AttendanceChartProps {
  stats: AttendanceStats;
  title?: string;
}

export const AttendanceChart = ({ stats, title }: AttendanceChartProps) => {
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'

  // Theme-aware colors
  const themeColors = useMemo(() => ({
    ...(isDark ? darkColors : lightColors),
  }), [isDark])
  const total = stats.total > 0 ? stats.total : 1; // Prevent division by zero
  const presentPercentage = (stats.present / total) * 100;
  const latePercentage = (stats.late / total) * 100;
  const absentPercentage = (stats.absent / total) * 100;

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    title: {
      fontSize: fonts.sizes.md,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.semibold as any,
      color: themeColors.text,
      marginBottom: spacing.md,
    },
    chartContainer: {
      backgroundColor: themeColors.card,
      borderRadius: spacing.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    bar: {
      backgroundColor: themeColors.borderLight,
    },
    statsContainer: {
      borderTopColor: themeColors.borderLight,
    },
    statLabel: {
      fontSize: fonts.sizes.xs,
      fontFamily: fonts.regular,
      color: themeColors.textLight,
      marginBottom: spacing.xs / 2,
    },
    statValue: {
      fontSize: fonts.sizes.md,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.bold as any,
      color: themeColors.text,
      marginBottom: spacing.xs / 2,
    },
    statPercentage: {
      fontSize: fonts.sizes.xs,
      fontFamily: fonts.regular,
      color: themeColors.textLight,
    },
  }), [themeColors])

  return (
    <View style={styles.container}>
      {title && <Text style={dynamicStyles.title as any}>{title}</Text>}
      
      <View style={[dynamicStyles.chartContainer, styles.chartContainerBase] as any}>
        <View style={styles.barContainer}>
          <View style={[styles.barBase, dynamicStyles.bar] as any}>
            <View 
              style={[
                styles.barSegment, 
                styles.presentBar,
                { width: `${presentPercentage}%` }
              ]} 
            />
            <View 
              style={[
                styles.barSegment, 
                styles.lateBar,
                { width: `${latePercentage}%` }
              ]} 
            />
            <View 
              style={[
                styles.barSegment, 
                styles.absentBar,
                { width: `${absentPercentage}%` }
              ]} 
            />
          </View>
        </View>
        
        <View style={[styles.statsContainerBase, dynamicStyles.statsContainer] as any}>
          <View style={[styles.statItem, { backgroundColor: themeColors.cardSecondary }]}>
            <View style={[styles.statIndicator, styles.presentIndicator]} />
            <Text style={dynamicStyles.statValue as any}>{stats.present}</Text>
            <Text style={dynamicStyles.statPercentage as any}>{Math.round(presentPercentage)}%</Text>
          </View>
          
          <View style={[styles.statItem, { backgroundColor: themeColors.cardSecondary }]}>
            <View style={[styles.statIndicator, styles.lateIndicator]} />
            <Text style={dynamicStyles.statValue as any}>{stats.late}</Text>
            <Text style={dynamicStyles.statPercentage as any}>{Math.round(latePercentage)}%</Text>
          </View>
          
          <View style={[styles.statItem, { backgroundColor: themeColors.cardSecondary }]}>
            <View style={[styles.statIndicator, styles.absentIndicator]} />
            <Text style={dynamicStyles.statValue as any}>{stats.absent}</Text>
            <Text style={dynamicStyles.statPercentage as any}>{Math.round(absentPercentage)}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  chartContainerBase: {
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
  },
  barContainer: {
    marginBottom: spacing.md,
  },
  barBase: {
    flexDirection: "row",
    height: 16,
    borderRadius: 8,
    overflow: "hidden" as const,
  },
  barSegment: {
    height: "100%",
  },
  presentBar: {
    backgroundColor: colors.statusPresent,
  },
  lateBar: {
    backgroundColor: colors.statusLate,
  },
  absentBar: {
    backgroundColor: colors.statusAbsent,
  },
  statsContainerBase: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: spacing.md,
    flex: 1,
    marginHorizontal: spacing.xs / 2,
  },
  statIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: spacing.xs,
  },
  presentIndicator: {
    backgroundColor: colors.statusPresent,
  },
  lateIndicator: {
    backgroundColor: colors.statusLate,
  },
  absentIndicator: {
    backgroundColor: colors.statusAbsent,
  },
});