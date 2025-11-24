import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
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

const API_BASE_URL = 'https://attendance-records-wana.vercel.app';

// Dark mode color palette
const darkColors = {
  background: "#0A0E27",
  backgroundGradientStart: "#0A0E27",
  backgroundGradientEnd: "#1A1F3A",
  card: "#1A1F3A",
  cardSecondary: "#252D4A",
  text: "#F8FAFC",
  textLight: "#CBD5E1",
  textExtraLight: "#94A3B8",
  border: "#3B4563",
  borderLight: "#1E293B",
  accent: "#00D9FF",
  accentAlt: "#7C3AED",
  success: "#10B981",
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
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
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

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : colors.background,
    card: isDark ? darkColors.card : colors.card,
    cardSecondary: isDark ? darkColors.cardSecondary : "#F0F4F8",
    text: isDark ? darkColors.text : colors.text,
    textLight: isDark ? darkColors.textLight : colors.textLight,
    textExtraLight: isDark ? darkColors.textExtraLight : "#64748B",
    border: isDark ? darkColors.border : colors.border,
    borderLight: isDark ? darkColors.borderLight : colors.borderLight,
    accent: isDark ? darkColors.accent : colors.primary,
    accentAlt: isDark ? darkColors.accentAlt : "#7C3AED",
    success: isDark ? darkColors.success : "#059669",
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
      
      {/* Background gradient accent */}
      <Animated.View
        style={[
          styles.backgroundAccent,
          {
            transform: [{ rotate: rotateInterpolate }],
            opacity: isDark ? 0.08 : 0.03,
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
          styles.header,
          {
            borderBottomColor: themeColors.borderLight,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.greeting, { color: themeColors.textExtraLight }]}>Welcome back,</Text>
          <Text style={[styles.userName, { color: themeColors.text }]}>{user?.name || "Teacher"}</Text>
          <View style={styles.dateContainer}>
            <View style={[styles.dateIconContainer, { backgroundColor: themeColors.accent + "15" }]}>
              <Feather name="calendar" size={12} color={themeColors.accent} />
            </View>
            <Text style={[styles.date, { color: themeColors.textExtraLight }]}>{formatDate(getToday())}</Text>
          </View>
        </View>
        
        <View style={[styles.avatarContainer, { borderColor: themeColors.accent + "30" }]}>
          <Avatar source={user?.avatar} name={user?.name} size={52} />
      </View>
      </Animated.View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.sectionIconContainer, { backgroundColor: themeColors.accent + "15" }]}>
                <Feather name="bar-chart-2" size={18} color={themeColors.accent} />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Today's Overview</Text>
                <Text style={[styles.sectionSubtitle, { color: themeColors.textExtraLight }]}>
                  Real-time attendance statistics
                </Text>
              </View>
            </View>
          </View>
          
          {error && (
            <Animated.View 
              style={[
                styles.errorContainer, { 
                  backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2",
                  borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#fecaca"
                },
                { opacity: fadeAnim }
              ]}
            >
              <View style={[styles.errorIconWrapper, { backgroundColor: "#EF4444" + "20" }]}>
                <Feather name="alert-circle" size={16} color="#EF4444" />
              </View>
              <Text style={[styles.errorText, { color: "#EF4444" }]}>{error}</Text>
            </Animated.View>
          )}
          
          {loadingStats ? (
            <View style={[styles.loadingContainer, { backgroundColor: themeColors.cardSecondary, borderColor: themeColors.border }]}>
              <ActivityIndicator size="large" color={themeColors.accent} />
              <Text style={[styles.loadingText, { color: themeColors.textLight }]}>Loading attendance data...</Text>
            </View>
          ) : (
            <View style={styles.statsColumn}>
            <StatCard
              title="Present"
              value={attendanceStats.present}
              icon="user-check"
              color={colors.statusPresent}
                subtitle={`of ${attendanceStats.total} students`}
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
                subtitle={`of ${attendanceStats.total} students`}
                themeColors={{
                  card: themeColors.card,
                  text: themeColors.text,
                  textLight: themeColors.textLight,
                  borderLight: themeColors.borderLight,
                }}
              />
              
            <StatCard
              title="Late"
              value={attendanceStats.late}
              icon="clock"
              color={colors.statusLate}
                subtitle={`of ${attendanceStats.total} students`}
                themeColors={{
                  card: themeColors.card,
                  text: themeColors.text,
                  textLight: themeColors.textLight,
                  borderLight: themeColors.borderLight,
                }}
            />
            
            <StatCard
                title="Attendance Rate"
              value={`${attendancePercentage}%`}
              icon="percent"
              color={colors.success}
                subtitle="Overall percentage"
                themeColors={{
                  card: themeColors.card,
                  text: themeColors.text,
                  textLight: themeColors.textLight,
                  borderLight: themeColors.borderLight,
                }}
            />
          </View>
          )}
        </Animated.View>
        
        {teacherClasses.length > 0 && (
          <View style={styles.classSelector}>
            <Animated.View
              style={[
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
              pointerEvents="box-none"
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: themeColors.accentAlt + "15" }]}>
                    <Feather name="book-open" size={18} color={themeColors.accentAlt} />
                  </View>
                  <View>
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Your Classes</Text>
                    <Text style={[styles.sectionSubtitle, { color: themeColors.textExtraLight }]}>
                      Select a class to view details
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.classChips}
              scrollEnabled={true}
              nestedScrollEnabled={true}
            >
              {teacherClasses.map(cls => (
                <TouchableOpacity
                  key={cls.id}
                  style={[
                    styles.classChip,
                    { 
                      backgroundColor: cls.id === activeClassId ? themeColors.accent : themeColors.cardSecondary,
                      borderColor: cls.id === activeClassId ? themeColors.accent : themeColors.border,
                    }
                  ]}
                  onPress={() => handleClassSelect(cls.id)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather 
                    name="book-open" 
                    size={14} 
                    color={cls.id === activeClassId ? "#FFFFFF" : themeColors.textLight} 
                    style={{ marginRight: spacing.xs }}
                  />
                  <Text 
                    style={[
                      styles.classChipText,
                      { color: cls.id === activeClassId ? "#FFFFFF" : themeColors.text },
                    ]}
                  >
                    {cls.name}
                  </Text>
                  {cls.section && (
                    <View style={[
                      styles.sectionBadge,
                      { backgroundColor: cls.id === activeClassId ? "rgba(255,255,255,0.2)" : themeColors.border }
                    ]}>
                      <Text style={[
                        styles.sectionBadgeText,
                        { color: cls.id === activeClassId ? "#FFFFFF" : themeColors.textExtraLight }
                      ]}>
                        {cls.section}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        <View style={styles.recentClasses}>
          <Animated.View
            style={[
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={[styles.sectionIconContainer, { backgroundColor: themeColors.success + "15" }]}>
                  <Feather name="clock" size={18} color={themeColors.success} />
                </View>
                <View>
                  <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Recent Classes</Text>
                  <Text style={[styles.sectionSubtitle, { color: themeColors.textExtraLight }]}>
                    Quick access to your classes
                  </Text>
                </View>
              </View>
            <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push("/classes")}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Text style={[styles.viewAllText, { color: themeColors.accent }]}>View All</Text>
                <Feather name="chevron-right" size={16} color={themeColors.accent} />
            </TouchableOpacity>
          </View>
          </Animated.View>
        
          {teacherClasses.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: themeColors.cardSecondary, borderColor: themeColors.border }]}>
              <View style={[styles.emptyStateIconContainer, { backgroundColor: themeColors.accent + "15" }]}>
                <Feather name="book-open" size={32} color={themeColors.accent} />
              </View>
              <Text style={[styles.emptyStateText, { color: themeColors.text }]}>
                No classes yet
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: themeColors.textLight }]}>
                Create your first class to get started
              </Text>
            </View>
          ) : (
            <View style={styles.recentClassesCards}>
              {teacherClasses.slice(0, 2).map((cls, index) => (
                <View key={cls.id} style={styles.classCardWrapper}>
                  <ClassCard classItem={cls} />
                </View>
          ))}
            </View>
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
  backgroundAccent: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -100,
    right: -100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg + spacing.sm,
    borderBottomWidth: 1,
    backgroundColor: "transparent",
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: "500" as const,
    marginBottom: spacing.xs / 2,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  userName: {
    fontSize: fonts.sizes.xxl * 1.1,
    fontFamily: fonts.regular,
    fontWeight: "800" as const,
    marginBottom: spacing.sm,
    letterSpacing: -0.8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dateIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  date: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    fontWeight: "600" as const,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    marginBottom: spacing.lg,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: fonts.sizes.xl * 1.1,
    fontFamily: fonts.regular,
    fontWeight: "700" as const,
    marginBottom: spacing.xs / 2,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    fontWeight: "500" as const,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  statsContainer: {
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    gap: spacing.md,
    width: "100%",
  },
  statsColumn: {
    flexDirection: "column",
    gap: spacing.md,
    marginBottom: spacing.lg,
    width: "100%",
  },
  classSelector: {
    marginBottom: spacing.xl,
  },
  classChips: {
    paddingRight: spacing.lg,
  },
  classChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md + spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: 18,
    marginRight: spacing.sm,
    borderWidth: 2,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classChipText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: "600" as const,
  },
  sectionBadge: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sectionBadgeText: {
    fontSize: fonts.sizes.xs - 1,
    fontFamily: fonts.regular,
    fontWeight: "600" as const,
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
    fontWeight: "600" as const,
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
  },
  recentClasses: {
    marginBottom: spacing.xl,
  },
  recentClassesCards: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  classCardWrapper: {
    marginBottom: spacing.sm,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs / 2,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  viewAllText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: "600" as const,
  },
  emptyState: {
    padding: spacing.xl * 1.5,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    minHeight: 200,
    marginTop: spacing.md,
  },
  emptyStateIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: "600" as const,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    textAlign: "center",
    marginTop: spacing.xs / 2,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: spacing.sm,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    flex: 1,
    fontWeight: "500" as const,
  },
  loadingContainer: {
    padding: spacing.xl * 1.5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    minHeight: 200,
  },
  loadingText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    marginTop: spacing.sm,
  },
});