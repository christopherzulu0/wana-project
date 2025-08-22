"use client"

import { StyleSheet, View, FlatList, Text, TouchableOpacity } from "react-native"
import { colors } from "../../constants/Colors"
import { spacing } from "../../constants/spacing"
import { mockStudents, getClassById } from "../../utils/mockData"
import { ClassCard } from "../ClassCard"
import { fonts } from "../../constants/fonts"
import { useAuth } from "../../hooks/useAuth"
import { EmptyState } from "../EmptyState"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"

export function StudentClassesTab() {
  const { user } = useAuth()
  const router = useRouter()

  // Assuming the logged-in user is a student, we'll use a mock student for now
  const student = mockStudents.find((s) => s.id === user?.id) || mockStudents[0] // Fallback to first mock student

  // Get the class the student is enrolled in
  const studentClass = student.classId ? getClassById(student.classId) : null
  const classes = studentClass ? [studentClass] : [] // Wrap in array for FlatList

  const renderClassItem = ({ item }: { item: (typeof classes)[0] }) => (
    <View>
      <ClassCard classItem={item} />
      <TouchableOpacity
        style={styles.markAttendanceButton}
        onPress={() => router.push(`/student-attendance/${item.id}`)}
      >
        <Feather name="camera" size={20} color={colors.card} />
        <Text style={styles.markAttendanceButtonText}>Mark Attendance</Text>
      </TouchableOpacity>
    </View>
  )

  const renderEmptyComponent = () => (
    <EmptyState title="No Classes Found" message="You are not currently enrolled in any classes." icon="book" />
  )

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>My Enrolled Classes ({classes.length})</Text>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        renderItem={renderClassItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  markAttendanceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: spacing.md,
    paddingVertical: spacing.md,
    marginTop: -spacing.xsm, // Overlap with card bottom
    marginHorizontal: spacing.md, // Match card padding
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  markAttendanceButtonText: {
    color: colors.card,
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    marginLeft: spacing.sm,
  },
})
