import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AttendanceChart } from "../../components/AttendanceChart";
import { AttendanceStatusBadge } from "../../components/AttendanceStatusBadge";
import { Avatar } from "../../components/Avatar";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { Header } from "../../components/Header";
import { StatusBar } from "../../components/StatusBar";
import { colors } from "../../constants/Colors";
import { fonts } from "../../constants/fonts";
import { spacing } from "../../constants/spacing";
import { useColorScheme } from "../../hooks/useColorScheme";
import { useStudents } from "../../hooks/useStudents";
import { formatDate, getPreviousDates } from "../../utils/dateUtils";

// Dark mode color palette
const darkColors = {
  background: "#151718",
  card: "#1F2324",
  text: "#ECEDEE",
  textLight: "#9BA1A6",
  border: "#2A2D2E",
  borderLight: "#252829",
}

const API_BASE_URL = 'https://attendance-records-wana.vercel.app'

// Skeleton Loading Component
const SkeletonBox = ({ width, height, style, themeColors }: { width?: number | string; height?: number; style?: any; themeColors?: any }) => (
  <View
    style={[
      {
        width: width || '100%',
        height: height || 20,
        backgroundColor: themeColors?.borderLight || colors.borderLight,
        borderRadius: spacing.xs,
      },
      style,
    ]}
  />
);

const StudentDetailsSkeleton = ({ themeColors }: { themeColors?: any }) => (
  <ScrollView
    style={styles.content}
    contentContainerStyle={styles.scrollContent}
    showsVerticalScrollIndicator={false}
  >
    {/* Profile Card Skeleton */}
    <Card variant="elevated" style={styles.profileCard}>
      <View style={styles.profileHeader}>
        {/* Avatar Skeleton */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: themeColors?.borderLight || colors.borderLight,
          }}
        />
        
        <View style={styles.profileInfo}>
          <SkeletonBox width="70%" height={24} style={{ marginBottom: spacing.sm }} themeColors={themeColors} />
          <SkeletonBox width="50%" height={20} style={{ marginBottom: spacing.xs }} themeColors={themeColors} />
          <SkeletonBox width="60%" height={18} themeColors={themeColors} />
        </View>
      </View>
      
      <View style={styles.contactInfo}>
        <View style={styles.contactItem}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: themeColors?.borderLight || colors.borderLight }} />
          <SkeletonBox width="60%" height={16} style={{ marginLeft: spacing.sm }} themeColors={themeColors} />
        </View>
        
        <View style={styles.contactItem}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: themeColors?.borderLight || colors.borderLight }} />
          <SkeletonBox width="60%" height={16} style={{ marginLeft: spacing.sm }} themeColors={themeColors} />
        </View>
      </View>
    </Card>
    
    {/* Attendance Overview Skeleton */}
    <View style={styles.attendanceSection}>
      <SkeletonBox width="40%" height={24} style={{ marginBottom: spacing.md }} themeColors={themeColors} />
      <View
        style={{
          height: 200,
          backgroundColor: themeColors?.borderLight || colors.borderLight,
          borderRadius: spacing.md,
          marginBottom: spacing.xl,
        }}
      />
    </View>
    
    {/* Recent Attendance Skeleton */}
    <View style={styles.recentSection}>
      <SkeletonBox width="35%" height={24} style={{ marginBottom: spacing.md }} themeColors={themeColors} />
      
      <Card variant="outlined" style={styles.recentCard}>
        {Array.from({ length: 10 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.attendanceItem,
              index !== 9 && { borderBottomColor: themeColors?.borderLight || colors.borderLight },
            ]}
          >
            <SkeletonBox width="40%" height={18} themeColors={themeColors} />
            <View
              style={{
                width: 80,
                height: 24,
                borderRadius: spacing.sm,
                backgroundColor: themeColors?.borderLight || colors.borderLight,
              }}
            />
          </View>
        ))}
      </Card>
    </View>
  </ScrollView>
);

export default function StudentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getStudent, loading: studentsLoading } = useStudents();
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'
  const [student, setStudent] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  
  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : colors.background,
    card: isDark ? darkColors.card : colors.card,
    text: isDark ? darkColors.text : colors.text,
    textLight: isDark ? darkColors.textLight : colors.textLight,
    border: isDark ? darkColors.border : colors.border,
    borderLight: isDark ? darkColors.borderLight : colors.borderLight,
  }), [isDark])
  
  // Fetch attendance data from API
  const fetchAttendanceData = React.useCallback(async (studentId: string) => {
    try {
      setLoadingAttendance(true);
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      // Fetch current month's attendance
      const response = await fetch(
        `${API_BASE_URL}/api/students/${studentId}/attendance?month=${currentMonth}&year=${currentYear}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const currentMonthAttendance = data.attendance || [];
        
        // Also fetch previous month's attendance to get more data for stats
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        
        try {
          const prevResponse = await fetch(
            `${API_BASE_URL}/api/students/${studentId}/attendance?month=${prevMonth}&year=${prevYear}`
          );
          if (prevResponse.ok) {
            const prevData = await prevResponse.json();
            const prevMonthAttendance = prevData.attendance || [];
            // Combine both months for better stats
            setAttendanceHistory([...currentMonthAttendance, ...prevMonthAttendance]);
          } else {
            setAttendanceHistory(currentMonthAttendance);
          }
        } catch (err) {
          console.error('Error fetching previous month attendance:', err);
          setAttendanceHistory(currentMonthAttendance);
        }
      } else {
        console.error('Failed to fetch attendance:', response.status);
        setAttendanceHistory([]);
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setAttendanceHistory([]);
    } finally {
      setLoadingAttendance(false);
    }
  }, []);
  
  // Fetch student details
  useEffect(() => {
    const fetchStudentData = async () => {
      if (studentsLoading) {
        return;
      }

      // Try to get from hook first
      const studentFromHook = getStudent(id);
      if (studentFromHook) {
        setStudent(studentFromHook);
        setLoading(false);
        // Fetch attendance data after student is loaded
        await fetchAttendanceData(studentFromHook.id);
        return;
      }

      // If not found in hook, try to fetch directly from API
      try {
        setLoading(true);
        // First, get all students and find the one we need
        const response = await fetch(`${API_BASE_URL}/api/students`);
        if (response.ok) {
          const students = await response.json();
          const foundStudent = students.find((s: any) => s.id === id);
          if (foundStudent) {
            setStudent(foundStudent);
            // Fetch attendance data after student is loaded
            await fetchAttendanceData(foundStudent.id);
          }
        }
      } catch (err) {
        console.error('Error fetching student:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [id, studentsLoading, fetchAttendanceData]);
  
  // Calculate attendance stats from real data
  const attendanceStats = React.useMemo(() => {
    const presentCount = attendanceHistory.filter(record => record.status === "present").length;
    const absentCount = attendanceHistory.filter(record => record.status === "absent").length;
    const lateCount = attendanceHistory.filter(record => record.status === "late").length;
    const totalRecords = attendanceHistory.length;
    
    return {
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      total: totalRecords,
    };
  }, [attendanceHistory]);
  
  // Get recent attendance (last 10-15 records) from real data, sorted by most recent
  const recentAttendance = React.useMemo(() => {
    if (!attendanceHistory || attendanceHistory.length === 0) {
      return [];
    }
    
    // Sort attendance records by date (most recent first)
    const sortedHistory = [...attendanceHistory].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // Descending order (newest first)
    });
    
    // Take the most recent 15 records
    return sortedHistory.slice(0, 15).map(record => {
      // Extract date in YYYY-MM-DD format
      const recordDate = record.date 
        ? (record.date.includes('T') ? record.date.split('T')[0] : record.date)
        : record.date;
      
      return {
        date: recordDate,
        status: record.status || "absent",
      };
    });
  }, [attendanceHistory]);
  
  // Show skeleton while loading
  if (loading || studentsLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar />
        <Header title="Student Details" showBackButton />
        <StudentDetailsSkeleton themeColors={themeColors} />
      </SafeAreaView>
    );
  }

  // Show error if student not found
  if (!student) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar />
        <Header title="Student Details" showBackButton />
        <EmptyState
          title="Student Not Found"
          message="The student you're looking for doesn't exist or has been removed."
          icon="alert-circle"
        />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar />
      <Header title="Student Details" showBackButton />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar 
              source={student.avatar} 
              name={student.name} 
              size={80} 
            />
            
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: themeColors.text }]}>{student.name}</Text>
              {student.registrationNumber && (
                <Text style={[styles.rollNumber, { color: themeColors.text }]}>Registration No: {student.registrationNumber}</Text>
              )}
              {student.rollNumber && !student.registrationNumber && (
                <Text style={[styles.rollNumber, { color: themeColors.text }]}>Roll No: {student.rollNumber}</Text>
              )}
              {student.class ? (
                <Text style={[styles.className, { color: themeColors.textLight }]}>{student.class.name} ({student.class.section})</Text>
              ) : student.classId ? (
                <Text style={[styles.className, { color: themeColors.textLight }]}>Class ID: {student.classId}</Text>
              ) : null}
            </View>
          </View>
          
          <View style={[styles.contactInfo, { borderTopColor: themeColors.borderLight }]}>
            <View style={styles.contactItem}>
              <Feather name="mail" size={16} color={themeColors.textLight} />
              <Text style={[styles.contactText, { color: themeColors.textLight }]}>{student.email || student.userEmail || "No email provided"}</Text>
            </View>
            
            {student.phone && (
              <View style={styles.contactItem}>
                <Feather name="phone" size={16} color={themeColors.textLight} />
                <Text style={[styles.contactText, { color: themeColors.textLight }]}>{student.phone}</Text>
              </View>
            )}
          </View>
        </Card>
        
        <View style={styles.attendanceSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Attendance Overview</Text>
          
          {loadingAttendance ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: themeColors.textLight }]}>Loading attendance data...</Text>
            </View>
          ) : (
            <AttendanceChart stats={attendanceStats} />
          )}
        </View>
        
        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Recent Attendance</Text>
          
          <Card variant="outlined" style={styles.recentCard}>
            {loadingAttendance ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: themeColors.textLight }]}>Loading...</Text>
              </View>
            ) : recentAttendance.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: themeColors.textLight }]}>No attendance records found</Text>
              </View>
            ) : (
              recentAttendance.map((item, index) => (
                <View 
                  key={`${item.date}-${index}`} 
                  style={[
                    styles.attendanceItem,
                    index !== recentAttendance.length - 1 && { borderBottomColor: themeColors.borderLight }
                  ]}
                >
                  <View style={styles.dateContainer}>
                    <Text style={[styles.dateText, { color: themeColors.text }]}>
                      {item.date ? formatDate(item.date) : 'Unknown date'}
                    </Text>
                  </View>
                  
                  <AttendanceStatusBadge status={item.status} />
                </View>
              ))
            )}
          </Card>
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
  profileCard: {
    marginBottom: spacing.xl,
  },
  profileHeader: {
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: "center",
  },
  name: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    marginBottom: spacing.xs / 2,
  },
  rollNumber: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    marginBottom: spacing.xs / 2,
  },
  className: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
  },
  contactInfo: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  contactText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    marginLeft: spacing.sm,
  },
  attendanceSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    marginBottom: spacing.md,
  },
  recentSection: {
    marginBottom: spacing.xl,
  },
  recentCard: {
    padding: 0,
  },
  attendanceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  borderBottom: {
    // borderBottomColor applied inline
  },
  dateContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    marginTop: spacing.sm,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
  },
});