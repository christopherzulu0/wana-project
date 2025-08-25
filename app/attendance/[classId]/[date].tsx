import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AttendanceChart } from "../../../components/AttendanceChart";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { EmptyState } from "../../../components/EmptyState";
import { Header } from "../../../components/Header";
import { StatusBar } from "../../../components/StatusBar";
import { StudentCard } from "../../../components/StudentCard";
import { colors } from "../../../constants/Colors";
import { fonts } from "../../../constants/fonts";
import { spacing } from "../../../constants/spacing";
import { useAttendance } from "../../../hooks/useAttendance";
import { useAuth } from "../../../hooks/useAuth";
import { useClasses } from "../../../hooks/useClasses";
import { useStudents } from "../../../hooks/useStudents";
import { formatDate, getToday } from "../../../utils/dateUtils";

export default function AttendanceSheetScreen() {
  const { classId, date } = useLocalSearchParams<{ classId: string; date: string }>();
  const { user } = useAuth();
  const { getClass } = useClasses();
  const { getStudentsByClassId } = useStudents();
  const { getClassAttendanceByDate, getAttendanceStats, markAttendance, getStudentAttendance } = useAttendance();
  
  const [filterStatus, setFilterStatus] = useState<"all" | "present" | "absent" | "late">("all");
  
  // Get class details
  const classItem = getClass(classId);
  
  // Get students in this class
  const students = getStudentsByClassId(classId);
  
  // Get attendance records for this date
  const attendanceRecords = getClassAttendanceByDate(classId, date);
  
  // Get attendance stats
  const attendanceStats = {
    present: attendanceRecords.filter(record => record.status === "present").length,
    absent: attendanceRecords.filter(record => record.status === "absent").length,
    late: attendanceRecords.filter(record => record.status === "late").length,
    total: students?.length || 0,
  };
  
  // Filter students based on attendance status
  const filteredStudents = (students || []).filter(student => {
    if (filterStatus === "all") return true;
    
    const record = getStudentAttendance(student.id, date);
    return record?.status === filterStatus;
  });
  
  const handleMarkAttendance = (student: any, status: "present" | "absent" | "late") => {
    if (user) {
      markAttendance(student, status, date, user.id);
    }
  };
  
  const handleMarkAllPresent = () => {
    if (user && students) {
      students.forEach(student => {
        markAttendance(student, "present", date, user.id);
      });
    }
  };
  
  if (!classItem) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar />
        <Header title="Attendance Sheet" showBackButton />
        <EmptyState
          title="Class Not Found"
          message="The class you're looking for doesn't exist or has been removed."
          icon="alert-circle"
        />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <Header 
        title="Attendance Sheet" 
        showBackButton 
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="elevated" style={styles.headerCard}>
          <Text style={styles.className}>{classItem.name} ({classItem.section})</Text>
          <Text style={styles.date}>{formatDate(date)}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendanceStats.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendanceStats.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendanceStats.late}</Text>
              <Text style={styles.statLabel}>Late</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendanceStats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </Card>
        
        <AttendanceChart stats={attendanceStats} title="Attendance Summary" />
        
        {date === getToday() && (
          <Button
            title="Mark All Present"
            onPress={handleMarkAllPresent}
            variant="primary"
            style={styles.markAllButton}
          />
        )}
        
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filter:</Text>
          
          <View style={styles.filterChips}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterStatus === "all" && styles.activeFilterChip
              ]}
              onPress={() => setFilterStatus("all")}
            >
              <Text 
                style={[
                  styles.filterChipText,
                  filterStatus === "all" && styles.activeFilterChipText
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterStatus === "present" && styles.activeFilterChip,
                styles.presentChip
              ]}
              onPress={() => setFilterStatus("present")}
            >
              <Text 
                style={[
                  styles.filterChipText,
                  filterStatus === "present" && styles.activeFilterChipText
                ]}
              >
                Present
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterStatus === "absent" && styles.activeFilterChip,
                styles.absentChip
              ]}
              onPress={() => setFilterStatus("absent")}
            >
              <Text 
                style={[
                  styles.filterChipText,
                  filterStatus === "absent" && styles.activeFilterChipText
                ]}
              >
                Absent
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterStatus === "late" && styles.activeFilterChip,
                styles.lateChip
              ]}
              onPress={() => setFilterStatus("late")}
            >
              <Text 
                style={[
                  styles.filterChipText,
                  filterStatus === "late" && styles.activeFilterChipText
                ]}
              >
                Late
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.studentsSection}>
          <Text style={styles.sectionTitle}>
            Students ({filteredStudents.length} of {students.length})
          </Text>
          
          {filteredStudents.length === 0 ? (
            <EmptyState
              title="No Students"
              message={`No students found with the selected filter (${filterStatus}).`}
              icon="users"
            />
          ) : (
            filteredStudents.map(student => {
              const attendanceRecord = getStudentAttendance(student.id, date);
              return (
                <StudentCard
                  key={student.id}
                  student={student}
                  attendanceRecord={attendanceRecord}
                  onMarkAttendance={handleMarkAttendance}
                  showAttendanceControls={date === getToday()}
                />
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerCard: {
    marginBottom: spacing.lg,
  },
  className: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  date: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.md,
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
  statValue: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  statLabel: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },
  markAllButton: {
    marginBottom: spacing.lg,
  },
  filtersContainer: {
    marginBottom: spacing.lg,
  },
  filtersTitle: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 100,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presentChip: {
    borderColor: colors.statusPresent,
  },
  absentChip: {
    borderColor: colors.statusAbsent,
  },
  lateChip: {
    borderColor: colors.statusLate,
  },
  filterChipText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  activeFilterChipText: {
    color: colors.card,
    fontWeight: fonts.weights.medium,
  },
  studentsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
});