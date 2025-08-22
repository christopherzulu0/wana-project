import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/Colors";
import { fonts } from "../constants/fonts";
import { spacing } from "../constants/spacing";
import { AttendanceStats } from "../types";

interface AttendanceChartProps {
  stats: AttendanceStats;
  title?: string;
}

export const AttendanceChart = ({ stats, title }: AttendanceChartProps) => {
  const total = stats.total > 0 ? stats.total : 1; // Prevent division by zero
  const presentPercentage = (stats.present / total) * 100;
  const latePercentage = (stats.late / total) * 100;
  const absentPercentage = (stats.absent / total) * 100;

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={styles.chartContainer}>
        <View style={styles.barContainer}>
          <View style={styles.bar}>
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
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statIndicator, styles.presentIndicator]} />
            <Text style={styles.statLabel}>Present</Text>
            <Text style={styles.statValue}>{stats.present}</Text>
            <Text style={styles.statPercentage}>{Math.round(presentPercentage)}%</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIndicator, styles.lateIndicator]} />
            <Text style={styles.statLabel}>Late</Text>
            <Text style={styles.statValue}>{stats.late}</Text>
            <Text style={styles.statPercentage}>{Math.round(latePercentage)}%</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIndicator, styles.absentIndicator]} />
            <Text style={styles.statLabel}>Absent</Text>
            <Text style={styles.statValue}>{stats.absent}</Text>
            <Text style={styles.statPercentage}>{Math.round(absentPercentage)}%</Text>
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
  title: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  chartContainer: {
    backgroundColor: colors.card,
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  barContainer: {
    marginBottom: spacing.md,
  },
  bar: {
    flexDirection: "row",
    height: 16,
    backgroundColor: colors.borderLight,
    borderRadius: 8,
    overflow: "hidden",
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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statItem: {
    alignItems: "center",
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
  statLabel: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.xs / 2,
  },
  statValue: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  statPercentage: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },
});