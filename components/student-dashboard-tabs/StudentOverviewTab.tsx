"use client"

import { Feather } from "@expo/vector-icons"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { colors } from "../../constants/Colors"
import { fonts } from "../../constants/fonts"
import { spacing } from "../../constants/spacing"
import { useAuth } from "../../hooks/useAuth"
import { useColorScheme } from "../../hooks/useColorScheme"
import { useStudentEnrollment } from "../../hooks/useStudentEnrollment"
import { EmptyState } from "../EmptyState"
import { StatCard } from "../StatCard"

const API_BASE_URL = 'https://attendance-records-wana.vercel.app'

// Dark mode color palette
const darkColors = {
  background: "#151718",
  card: "#1F2324",
  text: "#ECEDEE",
  textLight: "#9BA1A6",
  textExtraLight: "#6C757D",
  border: "#2A2D2E",
  borderLight: "#252829",
}

// Skeleton Loading Component
const SkeletonBox = ({ width, height, style }: { width?: number | string; height?: number; style?: any }) => (
  <View
    style={[
      {
        width: width || '100%',
        height: height || 20,
        backgroundColor: `${colors.primary}08`,
        borderRadius: spacing.xs,
      },
      style,
    ]}
  />
)

const OverviewSkeleton = ({ themeColors, isDark }: any) => (
  <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} contentContainerStyle={styles.scrollContent}>
    <SkeletonBox width="60%" height={28} style={{ marginBottom: spacing.sm, backgroundColor: isDark ? `${colors.primary}15` : `${colors.primary}08` }} />
    <SkeletonBox width="80%" height={18} style={{ marginBottom: spacing.xl, backgroundColor: isDark ? `${colors.primary}15` : `${colors.primary}08` }} />
    
    <View style={styles.section}>
      <SkeletonBox width="40%" height={24} style={{ marginBottom: spacing.md, backgroundColor: isDark ? `${colors.primary}15` : `${colors.primary}08` }} />
      <View style={[styles.scheduleCard, { backgroundColor: themeColors.card, borderColor: isDark ? `${colors.primary}30` : `${colors.primary}20` }]}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isDark ? `${colors.primary}20` : `${colors.primary}12`, marginRight: spacing.md }} />
        <View style={{ flex: 1 }}>
          <SkeletonBox width="70%" height={20} style={{ marginBottom: spacing.xs, backgroundColor: isDark ? `${colors.primary}15` : `${colors.primary}08` }} />
          <SkeletonBox width="50%" height={16} style={{ marginBottom: spacing.xs, backgroundColor: isDark ? `${colors.primary}15` : `${colors.primary}08` }} />
          <SkeletonBox width="80%" height={14} style={{ backgroundColor: isDark ? `${colors.primary}15` : `${colors.primary}08` }} />
        </View>
      </View>
    </View>

    <View style={styles.section}>
      <SkeletonBox width="35%" height={24} style={{ marginBottom: spacing.md, backgroundColor: isDark ? `${colors.primary}15` : `${colors.primary}08` }} />
      <View style={styles.statsGrid}>
        <SkeletonBox width="48%" height={120} style={{ borderRadius: spacing.md, marginBottom: spacing.md, backgroundColor: isDark ? `${colors.primary}15` : `${colors.primary}08` }} />
        <SkeletonBox width="48%" height={120} style={{ borderRadius: spacing.md, marginBottom: spacing.md, backgroundColor: isDark ? `${colors.primary}15` : `${colors.primary}08` }} />
      </View>
    </View>
  </ScrollView>
)

// Progress Bar Component with Animation
const ProgressBar = ({ percentage, color, themeColors, isDark }: { percentage: number; color: string; themeColors: any; isDark: boolean }) => (
  <View style={[styles.progressBarContainer, { backgroundColor: isDark ? `${color}20` : `${color}15` }]}>
    <View
      style={[
        styles.progressBarFill,
        {
          width: `${Math.min(percentage, 100)}%`,
          backgroundColor: color,
        },
      ]}
    />
  </View>
)

// Trend Indicator Component
const TrendIndicator = ({ value, isPositive }: { value: number; isPositive: boolean }) => (
  <View style={[styles.trendContainer, { backgroundColor: isPositive ? `${colors.success}15` : `${colors.danger}15` }]}>
    <Feather name={isPositive ? "trending-up" : "trending-down"} size={14} color={isPositive ? colors.success : colors.danger} />
    <Text style={[styles.trendText, { color: isPositive ? colors.success : colors.danger }]}>
      {isPositive ? "+" : ""}{value}%
    </Text>
  </View>
)

// Mini Stat Component
const MiniStat = ({ icon, label, value, color, trend, themeColors }: any) => (
  <View style={[styles.miniStatCard, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }]}>
    <View style={[styles.miniStatIconWrapper, { backgroundColor: `${color}15` }]}>
      <Feather name={icon} size={18} color={color} />
    </View>
    <View style={styles.miniStatContent}>
      <Text style={[styles.miniStatLabel, { color: themeColors.textLight }]}>{label}</Text>
      <View style={styles.miniStatValueContainer}>
        <Text style={[styles.miniStatValue, { color: themeColors.text }]}>{value}</Text>
        {trend && <TrendIndicator value={trend} isPositive={trend > 0} />}
      </View>
    </View>
  </View>
)

// Attendance Streak Component
const AttendanceStreak = ({ presentDays, totalDays, isMobile, isTablet, themeColors, isDark }: any) => {
  const streakPercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0
  const streakStatus = streakPercentage >= 90 ? "🔥 On Fire!" : streakPercentage >= 75 ? "⭐ Great" : "📈 Good"
  
  return (
    <View style={[styles.streakContainer, isMobile && styles.streakContainerMobile, { backgroundColor: isDark ? `${colors.primary}12` : `${colors.primary}08` }]}>
      <View style={styles.streakHeader}>
        <Text style={[styles.streakTitle, isMobile && styles.streakTitleMobile, { color: themeColors.text }]}>Attendance Streak</Text>
        <Text style={[styles.streakStatus, isMobile && styles.streakStatusMobile, { color: themeColors.textLight }]}>{streakStatus}</Text>
      </View>
      <Text style={[styles.streakDays, isMobile && styles.streakDaysMobile, { color: themeColors.text }]}>{presentDays} consecutive days</Text>
    </View>
  )
}

// Recommendation Card Component
const RecommendationCard = ({ title, message, icon, color, isMobile, themeColors }: any) => (
  <View style={[styles.recommendationCard, isMobile && styles.recommendationCardMobile, { borderLeftColor: color, borderLeftWidth: 4, backgroundColor: themeColors.card, borderColor: themeColors.borderLight }]}>
    <View style={[styles.recommendationIcon, isMobile && styles.recommendationIconMobile, { backgroundColor: `${color}15` }]}>
      <Feather name={icon} size={isMobile ? 16 : 20} color={color} />
    </View>
    <View style={styles.recommendationContent}>
      <Text style={[styles.recommendationTitle, isMobile && styles.recommendationTitleMobile, { color: themeColors.text }]}>{title}</Text>
      <Text style={[styles.recommendationText, isMobile && styles.recommendationTextMobile, { color: themeColors.textLight }]}>{message}</Text>
    </View>
  </View>
)

export function StudentOverviewTab() {
  const { width, height } = useWindowDimensions()
  const { user } = useAuth()
  const { enrolledClasses, loading: enrollmentLoading } = useStudentEnrollment()
  const colorScheme = useColorScheme() ?? 'light'
  const isDark = colorScheme === 'dark'
  
  const [student, setStudent] = useState<any>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)

  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : colors.background,
    card: isDark ? darkColors.card : colors.card,
    text: isDark ? darkColors.text : colors.text,
    textLight: isDark ? darkColors.textLight : colors.textLight,
    textExtraLight: isDark ? darkColors.textExtraLight : colors.textExtraLight,
    border: isDark ? darkColors.border : colors.border,
    borderLight: isDark ? darkColors.borderLight : colors.borderLight,
  }), [isDark])

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    greeting: {
      fontSize: fonts.sizes.md,
      fontFamily: fonts.regular,
      color: themeColors.textLight,
      marginBottom: spacing.xs,
    },
    studentName: {
      fontSize: fonts.sizes.xxl,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.bold as any,
      color: themeColors.text,
    },
    sectionLabel: {
      fontSize: fonts.sizes.lg,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.bold as any,
      color: themeColors.text,
    },
    scheduleCard: {
      backgroundColor: themeColors.card,
      borderColor: isDark ? `${colors.primary}30` : `${colors.primary}20`,
    },
    scheduleTitle: {
      fontSize: fonts.sizes.md,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.bold as any,
      color: themeColors.text,
    },
    scheduleTime: {
      fontSize: fonts.sizes.sm,
      fontFamily: fonts.regular,
      color: themeColors.textLight,
    },
    scheduleMetaText: {
      fontSize: fonts.sizes.xs,
      fontFamily: fonts.regular,
      color: themeColors.textLight,
    },
    attendanceOverviewCard: {
      backgroundColor: themeColors.card,
    },
    attendancePercentage: {
      fontSize: fonts.sizes.xxl,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.bold as any,
      color: themeColors.text,
    },
    miniStatCard: {
      backgroundColor: themeColors.card,
      borderColor: themeColors.borderLight,
    },
    miniStatLabel: {
      fontSize: fonts.sizes.xs,
      fontFamily: fonts.regular,
      color: themeColors.textLight,
    },
    miniStatValue: {
      fontSize: fonts.sizes.lg,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.bold as any,
      color: themeColors.text,
    },
    streakContainer: {
      backgroundColor: isDark ? `${colors.primary}12` : `${colors.primary}08`,
    },
    streakTitle: {
      fontSize: fonts.sizes.md,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.semibold as any,
      color: themeColors.text,
    },
    streakStatus: {
      fontSize: fonts.sizes.sm,
      fontFamily: fonts.regular,
      color: themeColors.textLight,
    },
    streakDays: {
      fontSize: fonts.sizes.lg,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.bold as any,
      color: themeColors.text,
    },
    recommendationCard: {
      backgroundColor: themeColors.card,
      borderColor: themeColors.borderLight,
    },
    recommendationTitle: {
      fontSize: fonts.sizes.md,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.semibold as any,
      color: themeColors.text,
    },
    recommendationText: {
      fontSize: fonts.sizes.sm,
      fontFamily: fonts.regular,
      color: themeColors.textLight,
    },
  }), [themeColors, isDark])

  // Responsive calculations
  const isTablet = width > 768
  const isMobile = width < 600
  const isLandscape = height < width

  // Responsive styles
  const responsiveStyles = useMemo(() => ({
    statsPerRow: isTablet ? 2 : isMobile ? 1 : 2,
    headerFontSize: isMobile ? fonts.sizes.lg : fonts.sizes.xl,
    sectionMargin: isTablet ? spacing.xl : spacing.lg,
  }), [isTablet, isMobile])

  // Fetch student data
  const fetchStudent = useCallback(async () => {
    if (!user?.id || user.role !== 'student') {
      setError('Access denied. This page is only available for students.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/by-user/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.student?.id) {
          setStudent(data.student)
          setStudentId(data.student.id.toString())
        } else {
          setError('Student record not found. Please contact an administrator.')
        }
      } else if (response.status === 404) {
        setError('Your student record is not linked to your account. Please contact an administrator.')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch student record' }))
        setError(errorData.error || 'Failed to fetch student record')
      }
    } catch (err) {
      console.error('Error fetching student:', err)
      setError('Network error occurred while fetching student data')
    }
  }, [user?.id, user?.role])

  // Fetch attendance history
  const fetchAttendanceHistory = useCallback(async () => {
    if (!studentId) return

    try {
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      const response = await fetch(
        `${API_BASE_URL}/api/students/${studentId}/attendance?month=${currentMonth}&year=${currentYear}`
      )

      if (response.ok) {
        const data = await response.json()
        setAttendanceHistory(data.attendance || [])
      }
    } catch (err) {
      console.error('Error fetching attendance history:', err)
    }
  }, [studentId])

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      await fetchStudent()
      setLoading(false)
    }

    fetchData()
  }, [fetchStudent])

  // Fetch attendance history when student ID is available
  useEffect(() => {
    if (studentId) {
      fetchAttendanceHistory()
    }
  }, [studentId, fetchAttendanceHistory])

  // Calculate statistics
  const totalRecords = attendanceHistory.length
  const presentCount = attendanceHistory.filter((record) => record.status === "present").length
  const lateCount = attendanceHistory.filter((record) => record.status === "late").length
  const absentCount = attendanceHistory.filter((record) => record.status === "absent").length

  const attendancePercentage = totalRecords > 0 
    ? Math.round(((presentCount + lateCount) / totalRecords) * 100) 
    : 0

  // Calculate weekly stats
  const weekAgoDate = new Date()
  weekAgoDate.setDate(weekAgoDate.getDate() - 7)
  const weekAttendance = attendanceHistory.filter(record => new Date(record.date) >= weekAgoDate)
  const weekPresentCount = weekAttendance.filter(r => r.status === "present").length
  const weekPercentage = weekAttendance.length > 0 ? Math.round((weekPresentCount / weekAttendance.length) * 100) : 0

  // Get attendance color based on percentage
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return colors.success
    if (percentage >= 50) return colors.warning
    return colors.danger
  }

  // Get next class from enrolled classes (if available)
  const nextClass = enrolledClasses.length > 0 ? enrolledClasses[0] : null

  // Show skeleton while loading
  if (loading || enrollmentLoading) {
    return <OverviewSkeleton themeColors={themeColors} isDark={isDark} />
  }

  // Show error state
  if (error || !student) {
    return (
      <ScrollView style={dynamicStyles.container} contentContainerStyle={styles.scrollContent}>
        <EmptyState
          title={error ? "Error Loading Data" : "Student Not Found"}
          message={error || "Unable to load your student information. Please try again later."}
          icon="alert-circle"
        />
      </ScrollView>
    )
  }

  const attendanceColor = getAttendanceColor(attendancePercentage)

  return (
    <ScrollView 
      style={dynamicStyles.container} 
      contentContainerStyle={[styles.scrollContent, isLandscape && styles.scrollContentLandscape]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section with Gradient */}
      <View style={[styles.headerSection, isMobile && styles.headerSectionMobile]}>
        <View style={{ flex: 1 }}>
          <Text style={[dynamicStyles.greeting, isMobile && styles.greetingMobile]}>Welcome back,</Text>
          <Text 
            style={[
              dynamicStyles.studentName, 
              isMobile && styles.studentNameMobile,
              isTablet && styles.studentNameTablet
            ]}
            numberOfLines={1}
          >
            {student?.name || 'Student'}
          </Text>
        </View>
        <View style={[styles.avatarPlaceholder, isMobile && styles.avatarPlaceholderMobile, { backgroundColor: isDark ? `${colors.primary}30` : `${colors.primary}20`, borderColor: isDark ? `${colors.primary}50` : `${colors.primary}40` }]}>
          <Feather 
            name="user" 
            size={isMobile ? 20 : 24} 
            color={colors.primary} 
          />
        </View>
      </View>

      {/* Today's Schedule Section */}
      <View style={[styles.section, { marginBottom: responsiveStyles.sectionMargin }]}>
        <View style={styles.sectionLabelContainer}>
          <View style={styles.sectionLabelDot} />
          <Text style={[dynamicStyles.sectionLabel, isMobile && styles.sectionLabelMobile]}>Today's Schedule</Text>
        </View>
        {nextClass ? (
          <View style={[styles.scheduleCard, styles.scheduleCardActive, dynamicStyles.scheduleCard]}>
            <View style={[styles.scheduleIconWrapper, isMobile && styles.scheduleIconWrapperMobile]}>
              <Feather name="clock" size={isMobile ? 24 : 28} color={colors.primary} />
            </View>
            <View style={styles.scheduleDetails}>
              <View style={styles.scheduleHeaderRow}>
                <Text 
                  style={[dynamicStyles.scheduleTitle, isMobile && styles.scheduleTitleMobile]}
                  numberOfLines={1}
                >
                  {nextClass.name}
                </Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{nextClass.section}</Text>
                </View>
              </View>
              {nextClass.schedule && (
                <Text style={[styles.scheduleTime, isMobile && styles.scheduleTimeMobile]}>
                  {nextClass.schedule}
                </Text>
              )}
              {nextClass.room && (
                <View style={[styles.scheduleMetaContainer, isMobile && styles.scheduleMetaContainerMobile]}>
                  {nextClass.room && (
                    <View style={styles.scheduleMeta}>
                      <Feather name="map-pin" size={isMobile ? 12 : 14} color={colors.textLight} />
                      <Text style={[styles.scheduleMetaText, isMobile && styles.scheduleMetaTextMobile]}>
                        {nextClass.room}
                      </Text>
                    </View>
                  )}
                  {nextClass.teacherName && (
                    <View style={styles.scheduleMeta}>
                      <Feather name="user-check" size={isMobile ? 12 : 14} color={colors.textLight} />
                      <Text style={[styles.scheduleMetaText, isMobile && styles.scheduleMetaTextMobile]}>
                        {nextClass.teacherName}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.scheduleCard, styles.scheduleCardInactive, dynamicStyles.scheduleCard]}>
            <View style={[styles.scheduleIconWrapper, isMobile && styles.scheduleIconWrapperMobile]}>
              <Feather name="calendar" size={isMobile ? 24 : 28} color={colors.textLight} />
            </View>
          <View style={styles.scheduleDetails}>
              <Text style={[styles.scheduleTitle, isMobile && styles.scheduleTitleMobile]}>
                No classes scheduled
              </Text>
              <Text style={[styles.scheduleTime, isMobile && styles.scheduleTimeMobile]}>
                You are not enrolled in any classes yet.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Attendance Overview Card with Advanced Design */}
      <View style={[styles.section, { marginBottom: responsiveStyles.sectionMargin }]}>
        <View style={[styles.attendanceOverviewCard, dynamicStyles.attendanceOverviewCard]}>
          {/* Header with Gradient Background */}
          <View style={styles.attendanceHeader}>
            <View style={styles.attendanceHeaderContent}>
              <Text style={[styles.attendanceHeaderLabel, { color: themeColors.text }]}>Attendance Overview</Text>
              <Text style={[styles.attendanceHeaderSubtext, { color: themeColors.textLight }]}>This Month</Text>
            </View>
            <View style={[styles.attendancePercentageBadge, { borderColor: attendanceColor }]}>
              <Text style={[styles.attendancePercentageTextBadge, { color: attendanceColor }]}>
                {attendancePercentage}%
              </Text>
            </View>
          </View>

          {/* Main Circle with Progress */}
          <View style={styles.attendanceCircleContainer}>
            <View style={[styles.attendanceCircle, { borderColor: attendanceColor }]}>
              <Text style={[styles.attendancePercentageText, { color: attendanceColor }]}>
                {attendancePercentage}%
            </Text>
              <Text style={[styles.attendanceCircleLabel, { color: themeColors.textLight }]}>Overall</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <ProgressBar percentage={attendancePercentage} color={attendanceColor} themeColors={themeColors} isDark={isDark} />
            <Text style={[styles.progressLabel, { color: themeColors.textLight }]}>
              {presentCount + lateCount} of {totalRecords} days
            </Text>
          </View>

          {/* Weekly Comparison */}
          <View style={styles.attendanceComparison}>
            <View style={styles.comparisonItem}>
              <Text style={[styles.comparisonLabel, { color: themeColors.textLight }]}>This Week</Text>
              <Text style={[styles.comparisonValue, { color: themeColors.text }]}>{weekPercentage}%</Text>
            </View>
            <View style={[styles.comparisonDivider, { backgroundColor: themeColors.border }]} />
            <View style={styles.comparisonItem}>
              <Text style={[styles.comparisonLabel, { color: themeColors.textLight }]}>Last 7 Days</Text>
              <Text style={[styles.comparisonValue, { color: themeColors.text }]}>{weekAttendance.length} days</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Mini Stats */}
      <View style={[styles.section, { marginBottom: responsiveStyles.sectionMargin }]}>
        <View style={styles.miniStatsContainer}>
          <MiniStat 
            icon="check-circle" 
            label="Present" 
            value={presentCount}
            color={colors.success}
            trend={5}
            themeColors={themeColors}
          />
          <MiniStat 
            icon="x-circle" 
            label="Absent" 
            value={absentCount}
            color={colors.danger}
            trend={-2}
            themeColors={themeColors}
          />
          {lateCount > 0 && (
            <MiniStat 
              icon="clock" 
              label="Late" 
              value={lateCount}
              color={colors.warning}
              trend={0}
              themeColors={themeColors}
            />
          )}
        </View>
      </View>

      {/* Statistics Section */}
      <View style={[styles.section, { marginBottom: responsiveStyles.sectionMargin }]}>
        <View style={styles.sectionLabelContainer}>
          <View style={styles.sectionLabelDot} />
          <Text style={[dynamicStyles.sectionLabel, isMobile && styles.sectionLabelMobile]}>
            Detailed Statistics
          </Text>
        </View>
        
        {/* Top Row Stats */}
        <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
          <View style={isTablet ? styles.statCardItemTablet : styles.statCardItem}>
          <StatCard
            title="Classes Enrolled"
              value={enrolledClasses.length}
            icon="book"
            color={colors.secondary}
            subtitle="Total classes"
              compact={isMobile}
            themeColors={themeColors}
            />
          </View>
          <View style={isTablet ? styles.statCardItemTablet : styles.statCardItem}>
            <StatCard
              title="Total Days"
              value={totalRecords}
              icon="calendar"
              color={colors.primary}
              subtitle="Tracked"
              compact={isMobile}
            themeColors={themeColors}
            />
          </View>
        </View>
      </View>

      {/* Attendance Streak */}
      <AttendanceStreak presentDays={presentCount} totalDays={totalRecords} isMobile={isMobile} isTablet={isTablet} themeColors={themeColors} isDark={isDark} />

      {/* Recommendations Section */}
      <View style={[styles.section, { marginBottom: responsiveStyles.sectionMargin }]}>
        <View style={styles.sectionLabelContainer}>
          <View style={styles.sectionLabelDot} />
          <Text style={[dynamicStyles.sectionLabel, isMobile && styles.sectionLabelMobile]}>
            Insights & Tips
          </Text>
        </View>
        
        {attendancePercentage < 75 && (
          <RecommendationCard
            title="Improve Your Attendance"
            message={`You're at ${attendancePercentage}%. Aim for 75% or higher to maintain excellent attendance.`}
            icon="alert-circle"
            color={colors.warning}
            isMobile={isMobile}
            themeColors={themeColors}
          />
        )}
        
        {absentCount > presentCount && (
          <RecommendationCard
            title="Increase Participation"
            message="You have more absences than presence. Try to attend more classes regularly."
            icon="message-circle"
            color={colors.danger}
            isMobile={isMobile}
            themeColors={themeColors}
          />
        )}
        
        {attendancePercentage >= 90 && (
          <RecommendationCard
            title="Excellent Work!"
            message="You're maintaining excellent attendance. Keep up the great performance!"
            icon="check-circle"
            color={colors.success}
            isMobile={isMobile}
            themeColors={themeColors}
          />
        )}
        
        {presentCount === 0 && (
          <RecommendationCard
            title="Get Started"
            message="Start marking your attendance in classes to build your record."
            icon="arrow-right"
            color={colors.primary}
            isMobile={isMobile}
            themeColors={themeColors}
          />
        )}
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
    paddingBottom: spacing.xxl * 2,
  },
  scrollContentLandscape: {
    paddingVertical: spacing.md,
  },
  
  // Header Section
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  headerSectionMobile: {
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  greetingMobile: {
    fontSize: fonts.sizes.sm,
    marginBottom: spacing.xs / 2,
  },
  studentName: {
    fontSize: fonts.sizes.xxl,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold as any,
    color: colors.text,
  },
  studentNameMobile: {
    fontSize: fonts.sizes.xl,
  },
  studentNameTablet: {
    fontSize: fonts.sizes.xxl,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: `${colors.primary}40`,
    marginLeft: spacing.md,
  },
  avatarPlaceholderMobile: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: spacing.sm,
  },

  // Section Label
  sectionLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionLabelDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  sectionLabel: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold as any,
    color: colors.text,
  },
  sectionLabelMobile: {
    fontSize: fonts.sizes.md,
  },

  // Section Styling
  section: {
    marginBottom: spacing.xl,
  },

  // Schedule Card
  scheduleCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  scheduleCardActive: {
    backgroundColor: colors.card,
    borderColor: `${colors.primary}30`,
  },
  scheduleCardInactive: {
    backgroundColor: colors.card,
    borderColor: colors.borderLight,
  },
  scheduleIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.lg,
  },
  scheduleIconWrapperMobile: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: spacing.md,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  scheduleTitle: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold as any,
    color: colors.text,
    flex: 1,
  },
  scheduleTitleMobile: {
    fontSize: fonts.sizes.sm,
  },
  scheduleTime: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  scheduleTimeMobile: {
    fontSize: fonts.sizes.xs,
    marginBottom: spacing.xs / 2,
  },
  scheduleMetaContainer: {
    flexDirection: "row",
    gap: spacing.md,
  },
  scheduleMetaContainerMobile: {
    gap: spacing.sm,
  },
  scheduleMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs / 2,
  },
  scheduleMetaText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },
  scheduleMetaTextMobile: {
    fontSize: fonts.sizes.xs - 1,
  },

  // Badge
  sectionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    backgroundColor: `${colors.primary}20`,
    borderRadius: spacing.xs,
  },
  sectionBadgeText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold as any,
    color: colors.primary,
  },

  // Attendance Overview Card
  attendanceOverviewCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: `${colors.primary}20`,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  attendanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  attendanceHeaderContent: {
    flex: 1,
  },
  attendanceHeaderLabel: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold as any,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  attendanceHeaderSubtext: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },
  attendancePercentageBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${colors.primary}05`,
  },
  attendancePercentageTextBadge: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold as any,
  },
  attendanceCircleContainer: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  attendanceCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${colors.primary}08`,
  },
  attendancePercentageText: {
    fontSize: fonts.sizes.xxl,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold as any,
  },
  attendanceCircleLabel: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: spacing.xs / 2,
  },
  progressSection: {
    marginBottom: spacing.lg,
  },
  progressBarContainer: {
    width: "100%",
    height: 10,
    backgroundColor: colors.borderLight,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  progressLabel: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: "center",
  },
  attendanceComparison: {
    flexDirection: "row",
    backgroundColor: `${colors.primary}08`,
    borderRadius: spacing.md,
    padding: spacing.md,
  },
  comparisonItem: {
    flex: 1,
    alignItems: "center",
  },
  comparisonLabel: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.xs / 2,
  },
  comparisonValue: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold as any,
    color: colors.text,
  },
  comparisonDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
  },

  // Mini Stats
  miniStatsContainer: {
    flexDirection: "row",
    gap: spacing.md,
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  miniStatIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  miniStatContent: {
    flex: 1,
  },
  miniStatLabel: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.xs / 2,
  },
  miniStatValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  miniStatValue: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold as any,
    color: colors.text,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: spacing.xs,
    gap: spacing.xs / 2,
  },
  trendText: {
    fontSize: fonts.sizes.xs - 1,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold as any,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statsGridTablet: {
    justifyContent: "space-around",
  },
  statCardItem: {
    width: "100%",
    marginBottom: spacing.sm,
  },
  statCardItemTablet: {
    width: "48%",
  },

  // Performance Card
  performanceCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  performanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  performanceBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  performanceTitle: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.xs / 2,
  },
  performanceValue: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold as any,
  },
  performanceHint: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    lineHeight: 20,
  },

  // Quick Links
  quickLinksGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.card,
    borderRadius: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickLinksGridLandscape: {
    paddingVertical: spacing.md,
  },
  quickLinkItem: {
    flex: 1,
    alignItems: "center",
  },
  quickLinkItemMobile: {
    flex: 1,
    alignItems: "center",
  },
  quickLinkIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  quickLinkIconWrapperMobile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    marginBottom: spacing.xs,
  },
  quickLinkText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold as any,
    color: colors.text,
    textAlign: "center",
  },
  quickLinkTextMobile: {
    fontSize: fonts.sizes.xs,
  },

  // Attendance Streak
  streakContainer: {
    backgroundColor: `${colors.primary}08`,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    alignItems: "center",
  },
  streakContainerMobile: {
    padding: spacing.sm,
    borderRadius: spacing.sm,
  },
  streakHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: spacing.xs,
  },
  streakTitle: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold as any,
    color: colors.text,
  },
  streakTitleMobile: {
    fontSize: fonts.sizes.sm,
  },
  streakStatus: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },
  streakStatusMobile: {
    fontSize: fonts.sizes.xs,
  },
  streakDays: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold as any,
    color: colors.text,
  },
  streakDaysMobile: {
    fontSize: fonts.sizes.md,
  },

  // Recommendation Card
  recommendationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    marginTop: spacing.md,
  },
  recommendationCardMobile: {
    padding: spacing.sm,
    borderRadius: spacing.sm,
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  recommendationIconMobile: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold as any,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  recommendationTitleMobile: {
    fontSize: fonts.sizes.sm,
  },
  recommendationText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    lineHeight: 20,
  },
  recommendationTextMobile: {
    fontSize: fonts.sizes.xs,
  },
})