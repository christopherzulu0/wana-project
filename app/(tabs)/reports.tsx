import React, { useMemo, useState, useEffect, useCallback } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AttendanceChart } from "../../components/AttendanceChart";
import { Card } from "../../components/Card";
import { DatePicker } from "../../components/DatePicker";
import { Header } from "../../components/Header";
import { StatusBar } from "../../components/StatusBar";
import { colors } from "../../constants/Colors";
import { fonts } from "../../constants/fonts";
import { spacing } from "../../constants/spacing";
import { useAuth } from "../../hooks/useAuth";
import { useColorScheme } from "../../hooks/useColorScheme";
import { useClasses } from "../../hooks/useClasses";
import { formatDate } from "../../utils/dateUtils";

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

interface MonthlyAttendance {
  month: string;
  year: number;
  stats: AttendanceStats;
}

export default function ReportsScreen() {
  const { user } = useAuth();
  const { getClassesForTeacher } = useClasses();
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [dailyStats, setDailyStats] = useState<AttendanceStats>({ present: 0, absent: 0, late: 0, total: 0 });
  const [monthlyStats, setMonthlyStats] = useState<MonthlyAttendance[]>([]);
  const [loading, setLoading] = useState(false);
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
  
  // Get teacher's classes
  const teacherClasses = user ? getClassesForTeacher(user.id) : [];
  
  // Default to first class if none selected
  const activeClassId = selectedClassId || (teacherClasses.length > 0 ? teacherClasses[0].id : null);
  
  // Fetch daily attendance stats for a specific date and class
  const fetchDailyStats = useCallback(async (classId: string, date: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get class details to find enrolled students
      const classResponse = await fetch(`${API_BASE_URL}/api/classes/${classId}`);
      if (!classResponse.ok) {
        throw new Error('Failed to fetch class details');
      }
      const classData = await classResponse.json();
      const students = classData.students || [];
      
      if (students.length === 0) {
        setDailyStats({ present: 0, absent: 0, late: 0, total: 0 });
        setLoading(false);
        return;
      }
      
      // Fetch attendance for all students on the selected date
      const dateString = date.toISOString().split('T')[0];
      const attendancePromises = students.map(async (student: any) => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/students/${student.id}/attendance?month=${date.getMonth() + 1}&year=${date.getFullYear()}`
          );
          if (response.ok) {
            const data = await response.json();
            const record = data.attendance?.find((a: any) => a.date === dateString && a.classId === classId);
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
      
      setDailyStats({ present, absent, late, total });
    } catch (err: any) {
      console.error('Error fetching daily stats:', err);
      setError(err.message || 'Failed to fetch daily attendance');
      setDailyStats({ present: 0, absent: 0, late: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch monthly attendance stats for a class
  const fetchMonthlyStats = useCallback(async (classId: string) => {
    try {
      setError(null);
      
      // Get class details to find enrolled students
      const classResponse = await fetch(`${API_BASE_URL}/api/classes/${classId}`);
      if (!classResponse.ok) {
        throw new Error('Failed to fetch class details');
      }
      const classData = await classResponse.json();
      const students = classData.students || [];
      
      if (students.length === 0) {
        setMonthlyStats([]);
        return;
      }
      
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Fetch stats for current month and previous 2 months
      const monthlyData: MonthlyAttendance[] = [];
      
      for (let i = 0; i < 3; i++) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const year = monthIndex > currentMonth ? currentYear - 1 : currentYear;
        
        // Fetch attendance for all students in this month
        const attendancePromises = students.map(async (student: any) => {
          try {
            const response = await fetch(
              `${API_BASE_URL}/api/students/${student.id}/attendance?month=${monthIndex + 1}&year=${year}`
            );
            if (response.ok) {
              const data = await response.json();
              // Filter attendance for this class
              return data.attendance?.filter((a: any) => a.classId === classId) || [];
            }
            return [];
          } catch (err) {
            console.error(`Error fetching monthly attendance for student ${student.id}:`, err);
            return [];
          }
        });
        
        const allAttendance = await Promise.all(attendancePromises);
        const flatAttendance = allAttendance.flat();
        
        // Calculate stats
        const present = flatAttendance.filter((a: any) => a.status === 'present').length;
        const absent = flatAttendance.filter((a: any) => a.status === 'absent').length;
        const late = flatAttendance.filter((a: any) => a.status === 'late').length;
        const total = flatAttendance.length;
        
        monthlyData.push({
          month: months[monthIndex],
          year,
          stats: { present, absent, late, total }
        });
      }
      
      setMonthlyStats(monthlyData);
    } catch (err: any) {
      console.error('Error fetching monthly stats:', err);
      setError(err.message || 'Failed to fetch monthly attendance');
      setMonthlyStats([]);
    }
  }, []);
  
  // Fetch data when class or date changes
  useEffect(() => {
    if (activeClassId) {
      fetchDailyStats(activeClassId, selectedDate);
      fetchMonthlyStats(activeClassId);
    } else {
      setDailyStats({ present: 0, absent: 0, late: 0, total: 0 });
      setMonthlyStats([]);
    }
  }, [activeClassId, selectedDate, fetchDailyStats, fetchMonthlyStats]);
  
  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar />
      <Header title="Attendance Reports" />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.filterSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Filters</Text>
          
          <DatePicker
            date={selectedDate}
            onDateChange={setSelectedDate}
            label="Select Date"
            themeColors={themeColors}
          />
          
          <Text style={[styles.label, { color: themeColors.text }]}>Select Class</Text>
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
        
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.danger + '15', borderLeftColor: colors.danger }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}
        
        <View style={styles.reportSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Daily Attendance</Text>
          <Text style={[styles.dateText, { color: themeColors.textLight }]}>
            {formatDate(selectedDate.toISOString().split("T")[0])}
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: themeColors.textLight }]}>Loading attendance data...</Text>
            </View>
          ) : (
            <AttendanceChart stats={dailyStats} />
          )}
        </View>
        
        <View style={styles.reportSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Monthly Overview</Text>
          
          {loading && monthlyStats.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: themeColors.textLight }]}>Loading monthly data...</Text>
            </View>
          ) : monthlyStats.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: themeColors.textLight }]}>No monthly data available</Text>
            </View>
          ) : (
            monthlyStats.map((monthData, index) => (
            <Card key={index} style={styles.monthCard}>
              <Text style={[styles.monthTitle, { color: themeColors.text }]}>
                {monthData.month} {monthData.year}
              </Text>
              
              <AttendanceChart stats={monthData.stats} />
              
              <View style={[styles.statsGrid, { borderTopColor: themeColors.borderLight }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: themeColors.textLight }]}>Present Rate</Text>
                  <Text style={[styles.statValue, { color: colors.statusPresent }]}>
                    {monthData.stats.total > 0
                      ? Math.round((monthData.stats.present / monthData.stats.total) * 100)
                      : 0}%
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: themeColors.textLight }]}>Absent Rate</Text>
                  <Text style={[styles.statValue, { color: colors.statusAbsent }]}>
                    {monthData.stats.total > 0
                      ? Math.round((monthData.stats.absent / monthData.stats.total) * 100)
                      : 0}%
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: themeColors.textLight }]}>Late Rate</Text>
                  <Text style={[styles.statValue, { color: colors.statusLate }]}>
                    {monthData.stats.total > 0
                      ? Math.round((monthData.stats.late / monthData.stats.total) * 100)
                      : 0}%
                  </Text>
                </View>
              </View>
            </Card>
            ))
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
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    marginBottom: spacing.md,
  },
  filterSection: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    marginBottom: spacing.xs,
  },
  classChips: {
    paddingRight: spacing.lg,
    marginBottom: spacing.md,
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
  reportSection: {
    marginBottom: spacing.xl,
  },
  dateText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    marginBottom: spacing.md,
  },
  monthCard: {
    marginBottom: spacing.lg,
  },
  monthTitle: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
  },
  errorContainer: {
    padding: spacing.md,
    marginBottom: spacing.lg,
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