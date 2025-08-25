import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { DatePicker } from "../../components/DatePicker";
import { EmptyState } from "../../components/EmptyState";
import { Header } from "../../components/Header";
import { StatusBar } from "../../components/StatusBar";
import { StudentCard } from "../../components/StudentCard";
import { colors } from "../../constants/Colors";
import { fonts } from "../../constants/fonts";
import { spacing } from "../../constants/spacing";
import { useAttendance } from "../../hooks/useAttendance";
import { useAuth } from "../../hooks/useAuth";
import { useClasses } from "../../hooks/useClasses";
import { useStudents } from "../../hooks/useStudents";
import { getToday } from "../../utils/dateUtils";

export default function ClassDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { getClass } = useClasses();
  const { fetchStudentsByClassId } = useStudents();
  const { getClassAttendanceByDate, getAttendanceStats, markAttendance, getStudentAttendance } = useAttendance();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  
  // Get class details
  const classItem = getClass(id);
  
  // Fetch students in this class
  useEffect(() => {
    const fetchStudents = async () => {
      if (id) {
        setLoadingStudents(true);
        const classStudents = await fetchStudentsByClassId(id);
        setStudents(classStudents || []);
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [id]);
  
  // Get attendance records for this date
  const dateString = selectedDate.toISOString().split("T")[0];
  const attendanceRecords = getClassAttendanceByDate(id, dateString);
  
  // Get attendance stats
  const attendanceStats = getAttendanceStats(id);
  
  // Calculate attendance percentage
  const attendancePercentage = attendanceStats.total > 0
    ? Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100)
    : 0;
  
  const handleMarkAttendance = (student: any, status: "present" | "absent" | "late") => {
    if (user) {
      markAttendance(student, status, dateString, user.id);
    }
  };
  
  const handleViewAttendance = () => {
    router.push(`/attendance/${id}/${dateString}`);
  };
  
  if (!classItem) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar />
        <Header title="Class Details" showBackButton />
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
        title={`${classItem.name} (${classItem.section})`} 
        showBackButton 
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="elevated" style={styles.classInfoCard}>
          <View style={styles.classHeader}>
            <View style={styles.iconContainer}>
              <Feather name="book" size={24} color={colors.card} />
            </View>
            
            <View style={styles.classInfo}>
              <Text style={styles.className}>{classItem.name}</Text>
              <Text style={styles.classSubject}>{classItem.subject}</Text>
              <Text style={styles.classSection}>Section {classItem.section}</Text>
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{classItem.totalStudents}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendanceStats.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendanceStats.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendancePercentage}%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
          </View>
        </Card>
        
        <View style={styles.dateSection}>
          <DatePicker
            date={selectedDate}
            onDateChange={setSelectedDate}
            label="Select Date"
          />
          
          <Button
            title="View Attendance Sheet"
            onPress={handleViewAttendance}
            variant="primary"
            style={styles.viewButton}
          />
        </View>
        
        <View style={styles.studentsSection}>
          <Text style={styles.sectionTitle}>Students ({students.length})</Text>
          
          {loadingStudents ? (
            <EmptyState
              title="Loading Students"
              message="Please wait while we load the student list..."
              icon="loader"
            />
          ) : !students || students.length === 0 ? (
            <EmptyState
              title="No Students"
              message="There are no students in this class yet."
              icon="users"
            />
          ) : (
            students.map(student => {
              const attendanceRecord = getStudentAttendance(student.id, dateString);
              return (
                <StudentCard
                  key={student.id}
                  student={student}
                  attendanceRecord={attendanceRecord}
                  onMarkAttendance={handleMarkAttendance}
                  showAttendanceControls={dateString === getToday()}
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
  classInfoCard: {
    marginBottom: spacing.xl,
  },
  classHeader: {
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  classInfo: {
    flex: 1,
    justifyContent: "center",
  },
  className: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  classSubject: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  classSection: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
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
  dateSection: {
    marginBottom: spacing.xl,
  },
  viewButton: {
    marginTop: spacing.sm,
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