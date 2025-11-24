import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AttendanceChart } from "../../../components/AttendanceChart";
import { Card } from "../../../components/Card";
import { EmptyState } from "../../../components/EmptyState";
import { Header } from "../../../components/Header";
import { StatusBar } from "../../../components/StatusBar";
import { StudentCard } from "../../../components/StudentCard";
import { colors } from "../../../constants/Colors";
import { fonts } from "../../../constants/fonts";
import { spacing } from "../../../constants/spacing";
import { useAuth } from "../../../hooks/useAuth";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { formatDate } from "../../../utils/dateUtils";

const API_BASE_URL = 'https://attendance-records-wana.vercel.app';

// Dark mode color palette
const darkColors = {
  background: "#151718",
  card: "#1F2324",
  text: "#ECEDEE",
  textLight: "#9BA1A6",
  border: "#2A2D2E",
  borderLight: "#252829",
}

interface Student {
  id: string;
  name: string;
  email?: string;
  registrationNumber?: string;
  rollNumber?: string;
  classId?: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: "present" | "absent" | "late";
  method: string;
}

export default function AttendanceSheetScreen() {
  const { classId, date } = useLocalSearchParams<{ classId: string; date: string }>();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'
  
  const [filterStatus, setFilterStatus] = useState<"all" | "present" | "absent" | "late">("all");
  const [classItem, setClassItem] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : colors.background,
    card: isDark ? darkColors.card : colors.card,
    text: isDark ? darkColors.text : colors.text,
    textLight: isDark ? darkColors.textLight : colors.textLight,
    border: isDark ? darkColors.border : colors.border,
    borderLight: isDark ? darkColors.borderLight : colors.borderLight,
  }), [isDark])
  
  // Fetch class details and students
  const fetchClassData = useCallback(async () => {
    if (!classId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/classes/${classId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch class details');
      }
      
      const data = await response.json();
      setClassItem(data.class);
      setStudents(data.students || []);
    } catch (err: any) {
      console.error('Error fetching class data:', err);
      setError(err.message || 'Failed to fetch class data');
    } finally {
      setLoading(false);
    }
  }, [classId]);
  
  // Fetch attendance records for the date
  const fetchAttendanceRecords = useCallback(async () => {
    if (!classId || !date) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/classes/${classId}/attendance/${date}`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data.attendance || []);
      } else {
        setAttendanceRecords([]);
      }
    } catch (err) {
      console.error('Error fetching attendance records:', err);
      setAttendanceRecords([]);
    }
  }, [classId, date]);
  
  // Fetch data on mount and when classId or date changes
  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);
  
  useEffect(() => {
    fetchAttendanceRecords();
  }, [fetchAttendanceRecords]);
  
  // Get attendance stats
  const attendanceStats = useMemo(() => {
    const present = attendanceRecords.filter(record => record.status === "present").length;
    const absent = attendanceRecords.filter(record => record.status === "absent").length;
    const late = attendanceRecords.filter(record => record.status === "late").length;
    const total = students.length;
    
    return { present, absent, late, total };
  }, [attendanceRecords, students.length]);
  
  // Get attendance record for a student
  const getStudentAttendance = (studentId: string): AttendanceRecord | undefined => {
    return attendanceRecords.find(record => record.studentId === studentId);
  };
  
  // Filter students based on attendance status
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (filterStatus === "all") return true;
      
      const record = attendanceRecords.find(r => r.studentId === student.id);
      return record?.status === filterStatus;
    });
  }, [students, filterStatus, attendanceRecords]);
  
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar />
        <Header title="Attendance Sheet" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textLight }]}>Loading class data...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!classItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
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
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
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
          <Text style={[styles.className, { color: themeColors.text }]}>{classItem.name} ({classItem.section})</Text>
          <Text style={[styles.date, { color: themeColors.textLight }]}>{formatDate(date)}</Text>
          
          <View style={[styles.statsContainer, { borderTopColor: themeColors.borderLight }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: themeColors.text }]}>{attendanceStats.present}</Text>
              <Text style={[styles.statLabel, { color: themeColors.textLight }]}>Present</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: themeColors.text }]}>{attendanceStats.absent}</Text>
              <Text style={[styles.statLabel, { color: themeColors.textLight }]}>Absent</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: themeColors.text }]}>{attendanceStats.late}</Text>
              <Text style={[styles.statLabel, { color: themeColors.textLight }]}>Late</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: themeColors.text }]}>{attendanceStats.total}</Text>
              <Text style={[styles.statLabel, { color: themeColors.textLight }]}>Total</Text>
            </View>
          </View>
        </Card>
        
        <AttendanceChart stats={attendanceStats} title="Attendance Summary" />
        
        <View style={styles.filtersContainer}>
          <Text style={[styles.filtersTitle, { color: themeColors.text }]}>Filter:</Text>
          
          <View style={styles.filterChips}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                { backgroundColor: themeColors.card, borderColor: themeColors.border },
                filterStatus === "all" && styles.activeFilterChip
              ]}
              onPress={() => setFilterStatus("all")}
            >
              <Text 
                style={[
                  styles.filterChipText,
                  { color: themeColors.text },
                  filterStatus === "all" && styles.activeFilterChipText
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterChip,
                { backgroundColor: themeColors.card, borderColor: colors.statusPresent },
                filterStatus === "present" && styles.activeFilterChip,
                styles.presentChip
              ]}
              onPress={() => setFilterStatus("present")}
            >
              <Text 
                style={[
                  styles.filterChipText,
                  { color: themeColors.text },
                  filterStatus === "present" && styles.activeFilterChipText
                ]}
              >
                Present
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterChip,
                { backgroundColor: themeColors.card, borderColor: colors.statusAbsent },
                filterStatus === "absent" && styles.activeFilterChip,
                styles.absentChip
              ]}
              onPress={() => setFilterStatus("absent")}
            >
              <Text 
                style={[
                  styles.filterChipText,
                  { color: themeColors.text },
                  filterStatus === "absent" && styles.activeFilterChipText
                ]}
              >
                Absent
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterChip,
                { backgroundColor: themeColors.card, borderColor: colors.statusLate },
                filterStatus === "late" && styles.activeFilterChip,
                styles.lateChip
              ]}
              onPress={() => setFilterStatus("late")}
            >
              <Text 
                style={[
                  styles.filterChipText,
                  { color: themeColors.text },
                  filterStatus === "late" && styles.activeFilterChipText
                ]}
              >
                Late
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.studentsSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Students ({filteredStudents.length} of {students.length})
          </Text>
          
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.danger + '15', borderLeftColor: colors.danger }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}
          
          {filteredStudents.length === 0 ? (
            <EmptyState
              title="No Students"
              message={students.length === 0 
                ? "No students are enrolled in this class." 
                : `No students found with the selected filter (${filterStatus}).`}
              icon="users"
            />
          ) : (
            filteredStudents.map(student => {
              const attendanceRecord = getStudentAttendance(student.id);
              
              return (
                <StudentCard
                  key={student.id}
                  student={student}
                  attendanceRecord={attendanceRecord}
                  showAttendanceControls={false}
                  themeColors={themeColors}
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
    marginBottom: spacing.xs,
  },
  date: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    marginBottom: spacing.md,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    marginBottom: spacing.xs / 2,
  },
  statLabel: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
  },
  filtersContainer: {
    marginBottom: spacing.lg,
  },
  filtersTitle: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    marginBottom: spacing.sm,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 100,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presentChip: {
    // borderColor applied inline
  },
  absentChip: {
    // borderColor applied inline
  },
  lateChip: {
    // borderColor applied inline
  },
  filterChipText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
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
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    marginTop: spacing.md,
  },
  errorContainer: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: spacing.sm,
    borderLeftWidth: 4,
  },
  errorText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
  },
});