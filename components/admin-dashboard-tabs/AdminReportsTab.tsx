import { StyleSheet, View, ScrollView, Text } from "react-native"
import { colors } from "../../constants/Colors"
import { spacing } from "../../constants/spacing"
import { Card } from "../Card"
import { fonts } from "../../constants/fonts"
import { Feather } from "@expo/vector-icons"

export function AdminReportsTab() {
  const mockReports = [
    {
      id: "1",
      title: "Overall Attendance Summary",
      description: "Comprehensive attendance data across all classes and students.",
      icon: "pie-chart",
    },
    {
      id: "2",
      title: "Student Performance by Attendance",
      description: "Analyze the correlation between attendance and academic performance.",
      icon: "trending-up",
    },
    {
      id: "3",
      title: "Teacher Activity Log",
      description: "View attendance marking activities by teachers.",
      icon: "clipboard",
    },
    {
      id: "4",
      title: "Absenteeism Trends",
      description: "Identify patterns and trends in student absenteeism.",
      icon: "alert-triangle",
    },
    {
      id: "5",
      title: "Class-wise Attendance Breakdown",
      description: "Detailed attendance reports for individual classes.",
      icon: "bar-chart",
    },
  ]

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.sectionTitle}>Available Reports</Text>
      {mockReports.map((report) => (
        <Card key={report.id} variant="outlined" style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <Feather name={report.icon as any} size={24} color={colors.primary} />
            <Text style={styles.reportTitle}>{report.title}</Text>
          </View>
          <Text style={styles.reportDescription}>{report.description}</Text>
          <View style={styles.reportActions}>
            <Text style={styles.generateButton}>Generate Report</Text>
            <Feather name="arrow-right" size={18} color={colors.primary} />
          </View>
        </Card>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  reportCard: {
    marginBottom: spacing.md,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  reportTitle: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  reportDescription: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  reportActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  generateButton: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.medium,
    color: colors.primary,
    marginRight: spacing.xs,
  },
})
