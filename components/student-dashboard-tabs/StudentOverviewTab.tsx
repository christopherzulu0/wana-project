"use client"

import { StyleSheet, Text, View, ScrollView } from "react-native"
import { colors } from "../../constants/Colors"
import { fonts } from "../../constants/fonts"
import { useAuth } from "../../hooks/useAuth"
import { spacing } from "../../constants/spacing"
import { StatCard } from "../StatCard"
import { mockStudents, getStudentAttendanceHistory } from "../../utils/mockData"
import { Feather } from "@expo/vector-icons"

export function StudentOverviewTab() {
  const { user } = useAuth()

  // Assuming the logged-in user is a student, we'll use a mock student for now
  // In a real app, you'd fetch the student's data based on user.id
  const student = mockStudents.find((s) => s.id === user?.id) || mockStudents[0] // Fallback to first mock student

  const attendanceHistory = getStudentAttendanceHistory(student.id)
  const totalRecords = attendanceHistory.length
  const presentCount = attendanceHistory.filter((record) => record.status === "present").length
  const lateCount = attendanceHistory.filter((record) => record.status === "late").length

  const attendancePercentage = totalRecords > 0 ? Math.round(((presentCount + lateCount) / totalRecords) * 100) : 0

  // Static data for next class
  const nextClass = {
    name: "Computer Science",
    section: "A",
    time: "10:00 AM - 11:30 AM",
    room: "Room 201",
    teacher: "John Smith",
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.greeting}>Hello, {student?.name}!</Text>
      <Text style={styles.info}>Welcome to your student dashboard.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        <View style={styles.scheduleCard}>
          <Feather name="clock" size={24} color={colors.primary} style={styles.scheduleIcon} />
          <View style={styles.scheduleDetails}>
            <Text style={styles.scheduleTitle}>
              Next Class: {nextClass.name} ({nextClass.section})
            </Text>
            <Text style={styles.scheduleTime}>{nextClass.time}</Text>
            <Text style={styles.scheduleLocation}>
              Room: {nextClass.room} | Teacher: {nextClass.teacher}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Statistics</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Overall Attendance"
            value={`${attendancePercentage}%`}
            icon="percent"
            color={colors.primary}
            subtitle="Your attendance rate"
            style={styles.statCardItem}
          />
          <StatCard
            title="Classes Enrolled"
            value={student.class ? 1 : 0} // Assuming one class per student for simplicity
            icon="book"
            color={colors.secondary}
            subtitle="Total classes"
            style={styles.statCardItem}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.quickLinksGrid}>
          <View style={styles.quickLinkItem}>
            <Feather name="calendar" size={24} color={colors.success} />
            <Text style={styles.quickLinkText}>View Calendar</Text>
          </View>
          <View style={styles.quickLinkItem}>
            <Feather name="message-square" size={24} color={colors.warning} />
            <Text style={styles.quickLinkText}>Message Teacher</Text>
          </View>
        </View>
      </View>
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
  greeting: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  info: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  scheduleIcon: {
    marginRight: spacing.md,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  scheduleTime: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.xs / 2,
  },
  scheduleLocation: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    color: colors.textExtraLight,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  statCardItem: {
    width: "48%",
    marginBottom: spacing.md,
  },
  quickLinksGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.card,
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  quickLinkItem: {
    alignItems: "center",
    padding: spacing.sm,
  },
  quickLinkText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: "center",
  },
})
