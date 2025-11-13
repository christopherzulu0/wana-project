import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../../components/Avatar";
import { ClassCard } from "../../components/ClassCard";
import { StatCard } from "../../components/StatCard";
import { StatusBar } from "../../components/StatusBar";
import { colors } from "../../constants/Colors";
import { fonts } from "../../constants/fonts";
import { spacing } from "../../constants/spacing";
import { useAuth } from "../../hooks/useAuth";
import { useColorScheme } from "../../hooks/useColorScheme";
import { useClasses } from "../../hooks/useClasses";
import { formatDate, getToday } from "../../utils/dateUtils";

const API_BASE_URL = 'http://10.156.181.203:3000';

// Dark mode color palette
const darkColors = {
  background: "#151718",
  card: "#1F2324",
  text: "#ECEDEE",
  textLight: "#9BA1A6",
  border: "#2A2D2E",
  borderLight: "#252829",
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  total: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { getClassesForTeacher } = useClasses();
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ present: 0, absent: 0, late: 0, total: 0 });
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get teacher's classes
  const teacherClasses = user ? getClassesForTeacher(user.id) : [];
  
  // Default to first class if none selected
  const activeClassId = selectedClassId || (teacherClasses.length > 0 ? teacherClasses[0].id : null);
  
  // Fetch today's attendance stats for a class
  const fetchTodayStats = useCallback(async (classId: string) => {
    try {
      setLoadingStats(true);
      setError(null);
      
      // Get class details to find enrolled students
      const classResponse = await fetch(`${API_BASE_URL}/api/classes/${classId}`);
      if (!classResponse.ok) {
        throw new Error('Failed to fetch class details');
      }
      const classData = await classResponse.json();
      const students = classData.students || [];
      
      if (students.length === 0) {
        setAttendanceStats({ present: 0, absent: 0, late: 0, total: 0 });
        setLoadingStats(false);
        return;
      }
      
      // Get today's date
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      
      // Fetch attendance for all students today
      const attendancePromises = students.map(async (student: any) => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/students/${student.id}/attendance?month=${month}&year=${year}`
          );
          if (response.ok) {
            const data = await response.json();
            const record = data.attendance?.find((a: any) => a.date === todayString && a.classId === classId);
            return record ? record.status : 'absent';
          }
          return 'absent';
        } catch (err) {
          console.error(`Error fetching attendance for student ${student.id}:`, err);
          return 'absent';
        }
      });
      
      const attendanceStatuses = await Promise.all(attendancePromises);
      
      // Calculate stats
      const present = attendanceStatuses.filter(s => s === 'present').length;
      const absent = attendanceStatuses.filter(s => s === 'absent').length;
      const late = attendanceStatuses.filter(s => s === 'late').length;
      const total = students.length;
      
      setAttendanceStats({ present, absent, late, total });
    } catch (err: any) {
      console.error('Error fetching today\'s stats:', err);
      setError(err.message || 'Failed to fetch attendance data');
      setAttendanceStats({ present: 0, absent: 0, late: 0, total: 0 });
    } finally {
      setLoadingStats(false);
    }
  }, []);
  
  // Fetch data when class changes
  useEffect(() => {
    if (activeClassId) {
      fetchTodayStats(activeClassId);
    } else {
      setAttendanceStats({ present: 0, absent: 0, late: 0, total: 0 });
    }
  }, [activeClassId, fetchTodayStats]);
  
  // Calculate attendance percentage
  const attendancePercentage = attendanceStats.total > 0
    ? Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100)
    : 0;
  
  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : colors.background,
    card: isDark ? darkColors.card : colors.card,
    text: isDark ? darkColors.text : colors.text,
    textLight: isDark ? darkColors.textLight : colors.textLight,
    border: isDark ? darkColors.border : colors.border,
    borderLight: isDark ? darkColors.borderLight : colors.borderLight,
  }), [isDark])
  
  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
  };
  
  const handleViewAttendance = () => {
    if (activeClassId) {
      router.push(`/attendance/${activeClassId}/${getToday()}`);
    }
  };

  useEffect(() => {
    console.log('Dashboard user:', user, 'loading:', loading);
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar />
      
      <View style={[styles.header, { borderBottomColor: themeColors.borderLight }]}>
        <View>
          <Text style={[styles.greeting, { color: themeColors.text }]}>Hello, {user?.name}</Text>
          <Text style={[styles.date, { color: themeColors.textLight }]}>{formatDate(getToday())}</Text>
        </View>
        
        <Avatar source={user?.avatar} name={user?.name} size={48} />
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsContainer}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Today's Overview</Text>
          
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.danger + '15', borderLeftColor: colors.danger }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}
          
          {loadingStats ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: themeColors.textLight }]}>Loading attendance data...</Text>
            </View>
          ) : (
            <>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Present"
                  value={attendanceStats.present}
                  icon="user-check"
                  color={colors.statusPresent}
                  subtitle={`${attendanceStats.total} total students`}
                  themeColors={{
                    card: themeColors.card,
                    text: themeColors.text,
                    textLight: themeColors.textLight,
                    borderLight: themeColors.borderLight,
                  }}
                />
                
                <StatCard
                  title="Absent"
                  value={attendanceStats.absent}
                  icon="user-x"
                  color={colors.statusAbsent}
                  subtitle={`${attendanceStats.total} total students`}
                  themeColors={{
                    card: themeColors.card,
                    text: themeColors.text,
                    textLight: themeColors.textLight,
                    borderLight: themeColors.borderLight,
                  }}
                />
              </View>
              
              <View style={styles.statsGrid}>
                <StatCard
                  title="Late"
                  value={attendanceStats.late}
                  icon="clock"
                  color={colors.statusLate}
                  subtitle={`${attendanceStats.total} total students`}
                  themeColors={{
                    card: themeColors.card,
                    text: themeColors.text,
                    textLight: themeColors.textLight,
                    borderLight: themeColors.borderLight,
                  }}
                />
                
                <StatCard
                  title="Attendance"
                  value={`${attendancePercentage}%`}
                  icon="percent"
                  color={colors.success}
                  subtitle="Overall attendance rate"
                  themeColors={{
                    card: themeColors.card,
                    text: themeColors.text,
                    textLight: themeColors.textLight,
                    borderLight: themeColors.borderLight,
                  }}
                />
              </View>
            </>
          )}
        </View>
        
        {teacherClasses.length > 0 && (
          <View style={styles.classSelector}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Your Classes</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.classChips}
            >
              {teacherClasses.map(cls => (
                <TouchableOpacity
                  key={cls.id}
                  style={[
                    styles.classChip,
                    { backgroundColor: themeColors.card, borderColor: themeColors.border },
                    cls.id === activeClassId && styles.activeClassChip
                  ]}
                  onPress={() => handleClassSelect(cls.id)}
                >
                  <Text 
                    style={[
                      styles.classChipText,
                      { color: themeColors.text },
                      cls.id === activeClassId && styles.activeClassChipText
                    ]}
                  >
                    {cls.name} ({cls.section})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
       
        
        <View style={styles.recentClasses}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Recent Classes</Text>
            <TouchableOpacity onPress={() => router.push("/classes")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {teacherClasses.slice(0, 2).map(cls => (
            <ClassCard key={cls.id} classItem={cls} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    marginBottom: spacing.xs / 2,
  },
  date: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    marginBottom: spacing.md,
  },
  statsContainer: {
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  classSelector: {
    marginBottom: spacing.xl,
  },
  classChips: {
    paddingRight: spacing.lg,
  },
  classChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 100,
    marginRight: spacing.sm,
    borderWidth: 1,
  },
  activeClassChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  classChipText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
  },
  activeClassChipText: {
    color: colors.card,
    fontWeight: fonts.weights.medium,
  },
  actionsContainer: {
    marginBottom: spacing.xl,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  actionCard: {
    flex: 1,
    minWidth: 150,
    maxWidth: "48%",
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  actionTitle: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
  },
  recentClasses: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  viewAllText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.primary,
    fontWeight: fonts.weights.medium,
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
});