import React, { useMemo, useState, useEffect, useCallback } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, useWindowDimensions, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
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

const API_BASE_URL = 'https://attendance-records-wana.vercel.app';

// Dark mode color palette
const darkColors = {
  background: "#0F1115",
  card: "#1A1D24",
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
  const { width: screenWidth } = useWindowDimensions();
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'
  
  // Animation for background accents
  const rotateAnim1 = React.useRef(new Animated.Value(0)).current;
  const rotateAnim2 = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    const rotateAnimation1 = Animated.loop(
      Animated.timing(rotateAnim1, {
        toValue: 1,
        duration: 25000,
        useNativeDriver: true,
      })
    );
    const rotateAnimation2 = Animated.loop(
      Animated.timing(rotateAnim2, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: true,
      })
    );
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    
    rotateAnimation1.start();
    rotateAnimation2.start();
    pulseAnimation.start();
    
    return () => {
      rotateAnimation1.stop();
      rotateAnimation2.stop();
      pulseAnimation.stop();
    };
  }, []);
  
  const rotateInterpolate1 = rotateAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  const rotateInterpolate2 = rotateAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [dailyStats, setDailyStats] = useState<AttendanceStats>({ present: 0, absent: 0, late: 0, total: 0 });
  const [monthlyStats, setMonthlyStats] = useState<MonthlyAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const scaleAnim = useMemo(() => new Animated.Value(0.95), []);
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);
  
  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : "#F8F9FA",
    card: isDark ? darkColors.card : colors.card,
    text: isDark ? darkColors.text : colors.text,
    textLight: isDark ? darkColors.textLight : colors.textLight,
    border: isDark ? darkColors.border : colors.border,
    borderLight: isDark ? darkColors.borderLight : colors.borderLight,
    accent: isDark ? "#00D9FF" : "#3B82F6",
    accentAlt: isDark ? "#7C3AED" : "#8B5CF6",
    success: isDark ? "#10B981" : "#059669",
  }), [isDark])
  
  // Gradient colors for background
  const gradientColors = useMemo(() => {
    if (isDark) {
      return ["#0A0E27", "#0F1115", "#15181D", "#1A1F2E", "#0F1115"];
    } else {
      return ["#F5F7FA", "#F8F9FA", "#FFFFFF", "#F0F4F8", "#F8F9FA"];
    }
  }, [isDark]) as [string, string, string, string, string];
  
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
      
      {/* Gradient Background */}
      <LinearGradient 
        colors={gradientColors} 
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Animated background accents */}
      <Animated.View
        style={[
          styles.backgroundAccent,
          styles.backgroundAccent1,
          {
            transform: [
              { rotate: rotateInterpolate1 },
              { scale: pulseAnim },
            ],
            opacity: isDark ? 0.15 : 0.05,
          },
        ]}
      >
        <LinearGradient
          colors={[themeColors.accent, themeColors.accentAlt]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      
      <Animated.View
        style={[
          styles.backgroundAccent,
          styles.backgroundAccent2,
          {
            transform: [{ rotate: rotateInterpolate2 }],
            opacity: isDark ? 0.1 : 0.03,
          },
        ]}
      >
        <LinearGradient
          colors={[themeColors.accentAlt, themeColors.success]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      
      <Animated.View
        style={[
          styles.backgroundAccent,
          styles.backgroundAccent3,
          {
            transform: [{ scale: pulseAnim }],
            opacity: isDark ? 0.08 : 0.02,
          },
        ]}
      >
        <LinearGradient
          colors={[themeColors.success, themeColors.accent]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      
     

      
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
          <Animated.View 
            style={[
              styles.monthCardWrapper, 
              { 
                borderColor: isDark ? colors.primary + "30" : colors.primary + "20",
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
            <LinearGradient
              colors={isDark ? ["#1A1F3A", "#252D4A", "#1F2542", "#1A1F3A"] : ["#FFFFFF", "#F8FAFC", "#F0F4F8", "#FFFFFF"]}
              style={styles.monthCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Decorative accent */}
              <View style={[styles.cardAccent, { backgroundColor: colors.primary + "08" }]} />
              
              <View style={styles.monthCard}>
                <View style={styles.monthHeader}>
                  <View style={styles.monthIconWrapper}>
                    <LinearGradient
                      colors={[colors.primary + "35", colors.primary + "25", colors.primary + "20"]}
                      style={styles.monthIconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={[styles.iconInnerGlow, { backgroundColor: colors.primary + "20" }]} />
                      <Feather name="calendar" size={28} color={colors.primary} />
                    </LinearGradient>
                  </View>
                  <View style={styles.monthHeaderText}>
                    <View style={styles.titleRow}>
                      <Text 
                        style={[styles.monthTitle, { color: themeColors.text }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        Daily Attendance
                      </Text>
                      <View style={[styles.badge, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
                        <Feather name="trending-up" size={14} color={colors.primary} />
                      </View>
                    </View>
                    <View style={styles.subtitleRow}>
                      <Feather name="clock" size={14} color={themeColors.textLight} style={{ marginRight: spacing.xs }} />
                      <Text style={[styles.monthSubtitle, { color: themeColors.textLight }]}>
                        {formatDate(selectedDate.toISOString().split("T")[0])}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: themeColors.textLight }]}>Loading attendance data...</Text>
                  </View>
                ) : (
                  <View style={[styles.statsGrid, { borderTopColor: themeColors.borderLight }]}>
                    <View style={[styles.statItem, styles.statItemEnhanced]}>
                      <View style={styles.statItemInner}>
                        <LinearGradient
                          colors={[colors.statusPresent + "25", colors.statusPresent + "15", colors.statusPresent + "10"]}
                          style={[styles.statIconWrapper, { borderColor: colors.statusPresent + "50" }]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={[styles.iconInnerGlow, { backgroundColor: colors.statusPresent + "25" }]} />
                          <Feather name="check-circle" size={24} color={colors.statusPresent} />
                        </LinearGradient>
                        <Text 
                          style={[styles.statLabel, { color: themeColors.textLight }]}
                          numberOfLines={1}
                        >
                          Present
                        </Text>
                        <Text style={[styles.statValue, { color: colors.statusPresent }]}>
                          {dailyStats.total > 0
                            ? Math.round((dailyStats.present / dailyStats.total) * 100)
                            : 0}%
                        </Text>
                      </View>
                    </View>
                    
                    <View style={[styles.statItem, styles.statItemEnhanced]}>
                      <View style={styles.statItemInner}>
                        <LinearGradient
                          colors={[colors.statusAbsent + "25", colors.statusAbsent + "15", colors.statusAbsent + "10"]}
                          style={[styles.statIconWrapper, { borderColor: colors.statusAbsent + "50" }]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={[styles.iconInnerGlow, { backgroundColor: colors.statusAbsent + "25" }]} />
                          <Feather name="x-circle" size={24} color={colors.statusAbsent} />
                        </LinearGradient>
                        <Text 
                          style={[styles.statLabel, { color: themeColors.textLight }]}
                          numberOfLines={1}
                        >
                          Absent
                        </Text>
                        <Text style={[styles.statValue, { color: colors.statusAbsent }]}>
                          {dailyStats.total > 0
                            ? Math.round((dailyStats.absent / dailyStats.total) * 100)
                            : 0}%
                        </Text>
                      </View>
                    </View>
                    
                    <View style={[styles.statItem, styles.statItemEnhanced]}>
                      <View style={styles.statItemInner}>
                        <LinearGradient
                          colors={[colors.statusLate + "25", colors.statusLate + "15", colors.statusLate + "10"]}
                          style={[styles.statIconWrapper, { borderColor: colors.statusLate + "50" }]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={[styles.iconInnerGlow, { backgroundColor: colors.statusLate + "25" }]} />
                          <Feather name="clock" size={24} color={colors.statusLate} />
                        </LinearGradient>
                        <Text 
                          style={[styles.statLabel, { color: themeColors.textLight }]}
                          numberOfLines={1}
                        >
                          Late
                        </Text>
                        <Text style={[styles.statValue, { color: colors.statusLate }]}>
                          {dailyStats.total > 0
                            ? Math.round((dailyStats.late / dailyStats.total) * 100)
                            : 0}%
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </LinearGradient>
          </Animated.View>
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
            <Animated.View 
              key={index} 
              style={[
                styles.monthCardWrapper, 
                { 
                  borderColor: isDark ? colors.primary + "30" : colors.primary + "20",
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                }
              ]}
            >
              <LinearGradient
                colors={isDark ? ["#1A1F3A", "#252D4A", "#1F2542", "#1A1F3A"] : ["#FFFFFF", "#F8FAFC", "#F0F4F8", "#FFFFFF"]}
                style={styles.monthCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Decorative accent */}
                <View style={[styles.cardAccent, { backgroundColor: colors.primary + "08" }]} />
                
                <View style={styles.monthCard}>
                  <View style={styles.monthHeader}>
                    <View style={styles.monthIconWrapper}>
                      <LinearGradient
                        colors={[colors.primary + "35", colors.primary + "25", colors.primary + "20"]}
                        style={styles.monthIconContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={[styles.iconInnerGlow, { backgroundColor: colors.primary + "20" }]} />
                        <Text style={[styles.monthIcon, { color: colors.primary }]}>
                          {monthData.month.substring(0, 3).toUpperCase()}
                        </Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.monthHeaderText}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.monthTitle, { color: themeColors.text }]}>
                          {monthData.month} {monthData.year}
                        </Text>
                        <View style={[styles.badge, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
                          <Feather name="bar-chart-2" size={14} color={colors.primary} />
                        </View>
                      </View>
                      <View style={styles.subtitleRow}>
                        <Feather name="calendar" size={14} color={themeColors.textLight} style={{ marginRight: spacing.xs }} />
                        <Text style={[styles.monthSubtitle, { color: themeColors.textLight }]}>
                          Monthly Attendance Summary
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                
                  
                  <View style={[styles.statsGrid, { borderTopColor: themeColors.borderLight }]}>
                <View style={[styles.statItem, styles.statItemEnhanced]}>
                  <View style={styles.statItemInner}>
                    <LinearGradient
                      colors={[colors.statusPresent + "25", colors.statusPresent + "15", colors.statusPresent + "10"]}
                      style={[styles.statIconWrapper, { borderColor: colors.statusPresent + "50" }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={[styles.iconInnerGlow, { backgroundColor: colors.statusPresent + "25" }]} />
                      <Feather name="check-circle" size={24} color={colors.statusPresent} />
                    </LinearGradient>
                    <Text 
                      style={[styles.statLabel, { color: themeColors.textLight }]}
                      numberOfLines={1}
                    >
                      Present
                    </Text>
                    <Text style={[styles.statValue, { color: colors.statusPresent }]}>
                      {monthData.stats.total > 0
                        ? Math.round((monthData.stats.present / monthData.stats.total) * 100)
                        : 0}%
                    </Text>
                  </View>
                </View>
                
                <View style={[styles.statItem, styles.statItemEnhanced]}>
                  <View style={styles.statItemInner}>
                    <LinearGradient
                      colors={[colors.statusAbsent + "25", colors.statusAbsent + "15", colors.statusAbsent + "10"]}
                      style={[styles.statIconWrapper, { borderColor: colors.statusAbsent + "50" }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={[styles.iconInnerGlow, { backgroundColor: colors.statusAbsent + "25" }]} />
                      <Feather name="x-circle" size={24} color={colors.statusAbsent} />
                    </LinearGradient>
                    <Text 
                      style={[styles.statLabel, { color: themeColors.textLight }]}
                      numberOfLines={1}
                    >
                      Absent
                    </Text>
                    <Text style={[styles.statValue, { color: colors.statusAbsent }]}>
                      {monthData.stats.total > 0
                        ? Math.round((monthData.stats.absent / monthData.stats.total) * 100)
                        : 0}%
                    </Text>
                  </View>
                </View>
                
                <View style={[styles.statItem, styles.statItemEnhanced]}>
                  <View style={styles.statItemInner}>
                    <LinearGradient
                      colors={[colors.statusLate + "25", colors.statusLate + "15", colors.statusLate + "10"]}
                      style={[styles.statIconWrapper, { borderColor: colors.statusLate + "50" }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={[styles.iconInnerGlow, { backgroundColor: colors.statusLate + "25" }]} />
                      <Feather name="clock" size={24} color={colors.statusLate} />
                    </LinearGradient>
                    <Text 
                      style={[styles.statLabel, { color: themeColors.textLight }]}
                      numberOfLines={1}
                    >
                      Late
                    </Text>
                    <Text style={[styles.statValue, { color: colors.statusLate }]}>
                      {monthData.stats.total > 0
                        ? Math.round((monthData.stats.late / monthData.stats.total) * 100)
                        : 0}%
                    </Text>
                  </View>
                </View>
              </View>
                </View>
              </LinearGradient>
            </Animated.View>
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
    position: "relative",
  },
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backgroundAccent: {
    position: "absolute",
    borderRadius: 200,
  },
  backgroundAccent1: {
    width: 450,
    height: 450,
    top: -150,
    right: -150,
  },
  backgroundAccent2: {
    width: 350,
    height: 350,
    bottom: -100,
    left: -100,
  },
  backgroundAccent3: {
    width: 300,
    height: 300,
    top: 300,
    left: -80,
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
    fontWeight: "600" as const,
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
    fontWeight: "500" as const,
  },
  reportSection: {
    marginBottom: spacing.xl,
  },
  dateText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    marginBottom: spacing.md,
  },
  monthCardWrapper: {
    borderRadius: spacing.lg + 6,
    borderWidth: 2,
    overflow: "hidden",
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  monthCardGradient: {
    borderRadius: spacing.lg + 6,
    flex: 1,
    overflow: "hidden",
  },
  cardAccent: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
  },
  monthCard: {
    padding: spacing.xl + spacing.sm,
    position: "relative",
    zIndex: 1,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  monthIconWrapper: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  monthIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: colors.primary + "50",
    overflow: "hidden",
    position: "relative",
  },
  iconInnerGlow: {
    position: "absolute",
    width: "60%",
    height: "60%",
    borderRadius: 50,
    top: "20%",
    left: "20%",
    opacity: 0.6,
  },
  monthIcon: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: "700" as const,
    letterSpacing: 1,
  },
  monthHeaderText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs / 2,
  },
  monthTitle: {
    fontSize: fonts.sizes.xl + 2,
    fontFamily: fonts.regular,
    fontWeight: "800" as const,
    letterSpacing: -0.8,
    flex: 1,
  },
  monthSubtitle: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: "600" as const,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    opacity: 0.85,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 2,
    gap: spacing.md,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  statItemEnhanced: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.lg + 2,
    minHeight: 160,
    justifyContent: "center",
    position: "relative",
  },
  statItemInner: {
    alignItems: "center",
    width: "100%",
    flex: 1,
    justifyContent: "center",
  },
  statIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
    borderWidth: 2.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    position: "relative",
  },
  statCountBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
  },
  statValue: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: "700" as const,
  },
  statSubValue: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: "500" as const,
    marginTop: spacing.xs / 2,
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
  statsContainer: {
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    width: "100%",
    flexWrap: "nowrap",
  },
  statBoxWrapper: {
    borderRadius: spacing.lg,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statBoxGradient: {
    borderRadius: spacing.lg,
    flex: 1,
    width: "100%",
  },
  statBox: {
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
    width: "100%",
    flex: 1,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
    borderWidth: 2,
    flexShrink: 0,
  },
  statIconDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  statLabel: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: "600" as const,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    textAlign: "center",
    width: "100%",
    flexShrink: 0,
    minHeight: fonts.sizes.sm * 1.5,
  },
  statNumber: {
    fontSize: fonts.sizes.xxl + 4,
    fontFamily: fonts.regular,
    fontWeight: "700" as const,
    textAlign: "center",
    width: "100%",
    minHeight: 32,
  },
});