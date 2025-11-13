"use client"

import { Feather } from "@expo/vector-icons"
import React, { useMemo } from "react"
import {
    ScrollView,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    useWindowDimensions,
    View,
    ViewStyle,
} from "react-native"
import { colors } from "../../constants/Colors"
import { fonts } from "../../constants/fonts"
import { spacing } from "../../constants/spacing"
import { useAuth } from "../../hooks/useAuth"
import { useColorScheme } from "../../hooks/useColorScheme"
import { useUsers } from "../../hooks/useUsers"
import { useClasses } from "../../hooks/useClasses"
import { useStudents } from "../../hooks/useStudents"
import type { AttendanceStats } from "../../types"
import { AttendanceChart } from "../AttendanceChart"
import { Button } from "../Button"
import { StatCard } from "../StatCard"
import { generateOverallAttendanceReport, saveAndShareReport } from "../../utils/reportGenerator"
import { Alert } from "react-native"

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

const API_BASE_URL = 'http://10.156.181.203:3000'

export function AdminOverviewTab({ onNavigateToReports }: { onNavigateToReports?: () => void }) {
    const { width } = useWindowDimensions()
    const { user } = useAuth()
    const colorScheme = useColorScheme() ?? 'dark'
    const isDark = colorScheme === 'dark'
    
    // Fetch data from API
    const { users, loading: usersLoading } = useUsers()
    const { classes, loading: classesLoading } = useClasses()
    const { students, loading: studentsLoading, fetchStudents } = useStudents()
    
    // State for attendance data
    const [attendanceStats, setAttendanceStats] = React.useState<AttendanceStats>({ total: 0, present: 0, late: 0, absent: 0 })
    const [activeStudentsToday, setActiveStudentsToday] = React.useState(0)
    const [loadingAttendance, setLoadingAttendance] = React.useState(false)
    const [recentActivities, setRecentActivities] = React.useState<Array<{ id: string; icon: string; text: string; time: string }>>([])
    const [loadingActivities, setLoadingActivities] = React.useState(false)
    const [exportingCSV, setExportingCSV] = React.useState(false)

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

    // Mobile-first columns: 2 on phones, 3 if wide (e.g., landscape/tablet)
    const contentPad = spacing.lg
    const gutter = spacing.md
    const cols = width >= 700 ? 3 : 2
    const itemWidth = Math.floor((width - contentPad * 2 - gutter * (cols - 1)) / cols)

    // Fetch today's attendance statistics
    React.useEffect(() => {
        const fetchAttendanceStats = async () => {
            if (students.length === 0) {
                setAttendanceStats({ total: 0, present: 0, late: 0, absent: 0 })
                setActiveStudentsToday(0)
                return
            }
            
            setLoadingAttendance(true)
            try {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const todayStr = today.toISOString().split('T')[0]
                
                // Fetch attendance for all students (batch requests for better performance)
                // Limit to reasonable batch size to avoid overwhelming the API
                const batchSize = 10
                let presentCount = 0
                let lateCount = 0
                let absentCount = 0
                let processedCount = 0
                
                // Process students in batches
                for (let i = 0; i < students.length; i += batchSize) {
                    const batch = students.slice(i, i + batchSize)
                    const batchPromises = batch.map(async (student) => {
                        try {
                            const response = await fetch(`${API_BASE_URL}/api/students/${student.id}/attendance?month=${today.getMonth() + 1}&year=${today.getFullYear()}`)
                            if (!response.ok) return null
                            const data = await response.json()
                            // Find today's attendance
                            const todayRecord = data.attendance?.find((record: any) => record.date === todayStr)
                            return todayRecord
                        } catch (err) {
                            console.error(`Error fetching attendance for student ${student.id}:`, err)
                            return null
                        }
                    })
                    
                    const batchResults = await Promise.all(batchPromises)
                    batchResults.forEach((record: any) => {
                        if (record) {
                            processedCount++
                            if (record.status === 'present') presentCount++
                            else if (record.status === 'late') lateCount++
                            else if (record.status === 'absent') absentCount++
                        }
                    })
                }
                
                // Calculate stats
                const total = students.length
                // Students without attendance records for today are considered absent
                const studentsWithoutRecords = total - processedCount
                
                setAttendanceStats({ 
                    total, 
                    present: presentCount, 
                    late: lateCount, 
                    absent: absentCount + studentsWithoutRecords
                })
                setActiveStudentsToday(presentCount + lateCount)
            } catch (err) {
                console.error('Error fetching attendance stats:', err)
                // Set default stats on error
                setAttendanceStats({ total: students.length, present: 0, late: 0, absent: students.length })
                setActiveStudentsToday(0)
            } finally {
                setLoadingAttendance(false)
            }
        }
        
        if (students.length > 0) {
            fetchAttendanceStats()
        }
    }, [students])

    // Calculate KPIs from real data
    const totalUsers = users.length
    const totalClasses = classes.length
    const totalStudents = students.length

    // Helpers
    const chunk = <T,>(arr: readonly T[], size: number) => {
        const res: T[][] = []
        for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size))
        return res
    }
    const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0)

    const presentRate = attendanceStats.total > 0 ? pct(attendanceStats.present + attendanceStats.late, attendanceStats.total) : 0
    const lateRate = attendanceStats.total > 0 ? pct(attendanceStats.late, attendanceStats.total) : 0
    const absentRate = attendanceStats.total > 0 ? pct(attendanceStats.absent, attendanceStats.total) : 0
    
    const loading = usersLoading || classesLoading || studentsLoading || loadingAttendance

    const kpis = [
        { key: "users", title: "Total Users", value: totalUsers, icon: "users" as const, color: colors.primary, subtitle: "Teachers & Admins" },
        { key: "classes", title: "Total Classes", value: totalClasses, icon: "book-open" as const, color: colors.secondary, subtitle: "All active classes" },
        { key: "students", title: "Total Students", value: totalStudents, icon: "user-check" as const, color: colors.success, subtitle: "Across all classes" },
        { key: "active", title: "Active Students", value: activeStudentsToday, icon: "activity" as const, color: colors.statusPresent, subtitle: "Today" },
    ] as const

    const actions = [
        { key: "invite", icon: "user-plus" as const, label: "Invite User", onPress: () => console.log("Invite User") },
        { key: "create", icon: "plus-square" as const, label: "Create Class", onPress: () => console.log("Create Class") },
        { key: "report", icon: "file-text" as const, label: "Generate Report", onPress: () => console.log("Generate Report") },
        { key: "export", icon: "download" as const, label: "Export CSV", onPress: () => console.log("Export CSV") },
    ] as const

    // Fetch recent activities
    React.useEffect(() => {
        const fetchRecentActivities = async () => {
            if (students.length === 0 && classes.length === 0) {
                setRecentActivities([])
                return
            }
            
            setLoadingActivities(true)
            try {
                const activities: Array<{ id: string; icon: string; text: string; time: string }> = []
                const now = new Date()
                
                // Get recent attendance records (last 7 days)
                const recentAttendancePromises = students.slice(0, 10).map(async (student) => {
                    try {
                        const today = new Date()
                        const month = today.getMonth() + 1
                        const year = today.getFullYear()
                        const response = await fetch(`${API_BASE_URL}/api/students/${student.id}/attendance?month=${month}&year=${year}`)
                        if (response.ok) {
                            const data = await response.json()
                            const attendance = data.attendance || []
                            // Get most recent attendance record
                            const recent = attendance
                                .filter((r: any) => {
                                    const recordDate = new Date(r.date)
                                    const daysDiff = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24))
                                    return daysDiff <= 7 && daysDiff >= 0
                                })
                                .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                            
                            if (recent) {
                                const recordDate = new Date(recent.date)
                                const daysDiff = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24))
                                const classItem = classes.find(c => c.id === recent.classId)
                                const className = classItem?.name || 'Unknown Class'
                                
                                let timeStr = ''
                                if (daysDiff === 0) {
                                    const hoursDiff = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60))
                                    if (hoursDiff === 0) {
                                        const minsDiff = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60))
                                        timeStr = minsDiff <= 1 ? 'Just now' : `${minsDiff} mins ago`
                                    } else {
                                        timeStr = hoursDiff === 1 ? '1 hour ago' : `${hoursDiff} hours ago`
                                    }
                                } else if (daysDiff === 1) {
                                    timeStr = 'Yesterday'
                                } else {
                                    timeStr = `${daysDiff} days ago`
                                }
                                
                                activities.push({
                                    id: `attendance-${student.id}-${recent.date}`,
                                    icon: recent.status === 'present' ? 'check-circle' : recent.status === 'late' ? 'clock' : 'x-circle',
                                    text: `${student.name} marked ${recent.status} for ${className}`,
                                    time: timeStr,
                                })
                            }
                        }
                    } catch (err) {
                        // Silently fail for individual student fetches
                    }
                })
                
                await Promise.all(recentAttendancePromises)
                
                // Sort by time (most recent first) and limit to 4
                activities.sort((a, b) => {
                    const timeA = a.time.includes('Just now') ? 0 : a.time.includes('mins') ? 1 : a.time.includes('hour') ? 2 : a.time.includes('Yesterday') ? 3 : 4
                    const timeB = b.time.includes('Just now') ? 0 : b.time.includes('mins') ? 1 : b.time.includes('hour') ? 2 : b.time.includes('Yesterday') ? 3 : 4
                    return timeA - timeB
                })
                
                setRecentActivities(activities.slice(0, 4))
            } catch (err) {
                console.error('Error fetching recent activities:', err)
                setRecentActivities([])
            } finally {
                setLoadingActivities(false)
            }
        }
        
        if (students.length > 0 || classes.length > 0) {
            fetchRecentActivities()
        }
    }, [students, classes])

    // Dynamic styles based on theme
    const dynamicStyles = useMemo(() => ({
        container: {
            ...styles.container,
            backgroundColor: themeColors.background,
        },
        headerBlock: {
            ...styles.headerBlock,
            backgroundColor: themeColors.card,
            borderColor: themeColors.borderLight,
            shadowOpacity: isDark ? 0.3 : 0.06,
        },
        greeting: {
            ...styles.greeting,
            color: themeColors.text,
        },
        roleBadge: {
            ...styles.roleBadge,
            backgroundColor: themeColors.background,
            borderColor: themeColors.borderLight,
        },
        subtitle: {
            ...styles.subtitle,
            color: themeColors.textLight,
        },
        headerPill: {
            ...styles.headerPill,
            backgroundColor: themeColors.background,
            borderColor: themeColors.borderLight,
        },
        headerPillLabel: {
            ...styles.headerPillLabel,
            color: themeColors.textLight,
        },
        headerPillValue: {
            ...styles.headerPillValue,
            color: themeColors.text,
        },
        sectionTitle: {
            ...styles.sectionTitle,
            color: themeColors.text,
        },
        sectionRule: {
            ...styles.sectionRule,
            backgroundColor: themeColors.borderLight,
        },
        kpiCard: {
            ...styles.kpiCard,
            backgroundColor: themeColors.card,
            borderColor: themeColors.borderLight,
        },
        kpiLabel: {
            ...styles.kpiLabel,
            color: themeColors.textLight,
        },
        kpiChip: {
            ...styles.kpiChip,
            backgroundColor: themeColors.borderLight,
        },
        kpiChipText: {
            ...styles.kpiChipText,
            color: themeColors.textLight,
        },
        quickAction: {
            ...styles.quickAction,
            backgroundColor: themeColors.card,
            borderColor: themeColors.borderLight,
        },
        quickActionIconWrap: {
            ...styles.quickActionIconWrap,
            backgroundColor: themeColors.background,
            borderColor: themeColors.borderLight,
        },
        quickActionLabel: {
            ...styles.quickActionLabel,
            color: themeColors.text,
        },
        card: {
            ...styles.card,
            backgroundColor: themeColors.card,
            borderColor: themeColors.borderLight,
        },
        activityDivider: {
            ...styles.activityDivider,
            borderBottomColor: themeColors.borderLight,
        },
        activityIconWrap: {
            ...styles.activityIconWrap,
            backgroundColor: themeColors.background,
            borderColor: themeColors.borderLight,
        },
        activityText: {
            ...styles.activityText,
            color: themeColors.text,
        },
        activityTime: {
            ...styles.activityTime,
            color: themeColors.textExtraLight,
        },
    }), [themeColors, isDark])

    // Show loading state
    if (loading && totalUsers === 0 && totalClasses === 0 && totalStudents === 0) {
        return (
            <ScrollView
                style={dynamicStyles.container}
                contentContainerStyle={[styles.scrollContent, { padding: contentPad, paddingBottom: spacing.xxl, alignItems: 'center', justifyContent: 'center', minHeight: 400 }]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.sectionTitle, { color: themeColors.text, textAlign: 'center', marginTop: spacing.xxl }]}>
                    Loading dashboard data...
                </Text>
            </ScrollView>
        )
    }

    return (
        <ScrollView
            style={dynamicStyles.container}
            contentContainerStyle={[styles.scrollContent, { padding: contentPad, paddingBottom: spacing.xxl }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View
                style={[
                    dynamicStyles.headerBlock,
                    {
                        padding: spacing.lg,
                        flexDirection: width < 480 ? 'column' : 'row',
                        alignItems: width < 480 ? 'flex-start' : 'center',
                        justifyContent: 'space-between',
                        gap: width < 480 ? spacing.md : 0,
                    },
                ]}
            >
                <View style={styles.headerLeft}>
                    <View style={styles.headerTitleRow}>
                        <Text style={dynamicStyles.greeting} numberOfLines={2} accessibilityRole="header">
                            {`Hello, ${user?.name ?? "Admin"}!`}
                        </Text>
                        <View style={dynamicStyles.roleBadge}>
                            <Feather name="shield" size={14} color={colors.primary} />
                            <Text style={styles.roleBadgeText}>Administrator</Text>
                        </View>
                    </View>
                    <Text style={dynamicStyles.subtitle} numberOfLines={2}>
                        Here&apos;s what&apos;s happening across your school today.
                    </Text>
                </View>

                <View style={[styles.headerRight, width < 480 && { width: '100%', justifyContent: 'flex-start' }]}>
                    <HeaderPill icon="calendar" label="Today" value={formatDate(new Date())} themeColors={themeColors} />
                    <HeaderPill 
                    icon="activity" 
                    label="Active" 
                    value={`${activeStudentsToday}`}
                    themeColors={themeColors}
                    />
                </View>
            </View>

            {/* System Statistics - rock solid 2/3 column grid */}
            <View style={styles.section}>
                <SectionHeader title="System Statistics" themeColors={themeColors} />
                {chunk(kpis, cols).map((row, rowIdx) => (
                    <View key={`kpi-row-${rowIdx}`} style={[styles.row, { marginBottom: gutter }]}>
                        {row.map((kpi, colIdx) => {
                            const isLast = colIdx === row.length - 1
                            return (
                                <View
                                    key={kpi.key}
                                    style={[
                                        styles.cell,
                                        {
                                            width: itemWidth,
                                            marginRight: isLast ? 0 : gutter,
                                            marginBottom: 0,
                                        },
                                    ]}
                                >
                                    <StatCard
                                        title={kpi.title}
                                        value={kpi.value}
                                        icon={kpi.icon}
                                        color={kpi.color}
                                        subtitle={kpi.subtitle}
                                        compact
                                        themeColors={{
                                            card: themeColors.card,
                                            text: themeColors.text,
                                            textLight: themeColors.textLight,
                                            borderLight: themeColors.borderLight,
                                        }}
                                    />
                                </View>
                            )
                        })}
                    </View>
                ))}
            </View>

            {/* KPI Highlights - horizontal scroll to avoid wrapping on phones */}
            <View style={styles.section}>
                <SectionHeader title="Today's Highlights" themeColors={themeColors} />
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 2 }}
                >
                    <View style={[styles.highlightItem, { marginRight: gutter }]}>
                        <KpiHighlight icon="percent" label="Attendance Rate" value={`${presentRate}%`} chipLabel="Today" color={colors.primary} themeColors={themeColors} isDark={isDark} />
                    </View>
                    <View style={[styles.highlightItem, { marginRight: gutter }]}>
                        <KpiHighlight icon="clock" label="Late Rate" value={`${lateRate}%`} chipLabel="Today" color={colors.statusLate} themeColors={themeColors} isDark={isDark} />
                    </View>
                    <View style={[styles.highlightItem, { marginRight: 0 }]}>
                        <KpiHighlight icon="alert-triangle" label="Absences" value={`${absentRate}%`} chipLabel="Today" color={colors.statusAbsent} themeColors={themeColors} isDark={isDark} />
                    </View>
                </ScrollView>
            </View>

           

            {/* Attendance Summary */}
            <View style={styles.section}>
                <SectionHeader title="Attendance Summary" themeColors={themeColors} />
                <View style={dynamicStyles.card}>
                    <AttendanceChart stats={attendanceStats} title="Summary" />
                    <View style={styles.attendanceCtas}>
                        <Button
                            title="View Reports"
                            variant="outline"
                            onPress={() => {
                                if (onNavigateToReports) {
                                    onNavigateToReports()
                                }
                            }}
                            style={{ ...styles.attendanceCta, marginRight: spacing.sm } as any}
                        />
                        <Button
                            title={exportingCSV ? "Exporting..." : "Export CSV"}
                            variant="primary"
                            onPress={async () => {
                                if (exportingCSV) return
                                
                                setExportingCSV(true)
                                try {
                                    const csvContent = await generateOverallAttendanceReport(students, classes)
                                    const fileUri = await saveAndShareReport(csvContent, 'attendance-summary')
                                    if (fileUri) {
                                        Alert.alert('Success', 'Attendance summary has been exported and is ready to share.')
                                    } else {
                                        Alert.alert('Success', 'Attendance summary has been exported. File saved to device.')
                                    }
                                } catch (error) {
                                    console.error('Error exporting CSV:', error)
                                    Alert.alert('Error', 'Failed to export attendance summary. Please try again.')
                                } finally {
                                    setExportingCSV(false)
                                }
                            }}
                            style={styles.attendanceCta}
                            disabled={exportingCSV}
                        />
                    </View>
                </View>
            </View>

            {/* Recent Activities */}
            <View style={styles.section}>
                <View style={[styles.sectionHeader, { marginBottom: 0 }]}>
                    <Text style={dynamicStyles.sectionTitle}>Recent Activities</Text>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity
                        onPress={() => console.log("See all activity")}
                        accessibilityRole="button"
                        accessibilityLabel="See all activities"
                    >
                        <Text style={styles.linkText}>See all</Text>
                    </TouchableOpacity>
                </View>
                <View style={[dynamicStyles.card, styles.activityList]}>
                    {loadingActivities ? (
                        <View style={styles.activityItem}>
                            <Text style={[styles.activityText, { color: themeColors.textLight }]}>Loading activities...</Text>
                        </View>
                    ) : recentActivities.length === 0 ? (
                        <View style={styles.activityItem}>
                            <Text style={[styles.activityText, { color: themeColors.textLight }]}>No recent activities</Text>
                        </View>
                    ) : (
                        recentActivities.map((activity: { id: string; icon: string; text: string; time: string }, idx: number) => (
                        <View
                            key={activity.id}
                            style={[styles.activityItem, idx !== recentActivities.length - 1 && dynamicStyles.activityDivider]}
                            accessible
                            accessibilityRole="text"
                            accessibilityLabel={`${activity.text}, ${activity.time}`}
                        >
                            <View style={dynamicStyles.activityIconWrap}>
                                <Feather name={activity.icon} size={16} color={colors.primary} />
                            </View>
                            <View style={styles.activityTextContainer}>
                                <Text style={dynamicStyles.activityText} numberOfLines={2}>
                                    {activity.text}
                                </Text>
                                <View style={styles.activityMetaRow}>
                                    <Feather name="clock" size={12} color={themeColors.textExtraLight} />
                                    <Text style={dynamicStyles.activityTime}>{activity.time}</Text>
                                </View>
                            </View>
                        </View>
                    ))
                    )}
                </View>
            </View>
        </ScrollView>
    )
}

/* Helpers and Reusable UI */

function formatDate(d: Date) {
    const opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }
    try {
        return new Intl.DateTimeFormat("en-US", opts).format(d)
    } catch {
        return `${d.getMonth() + 1}/${d.getDate()}`
    }
}

function SectionHeader({ title, themeColors }: { title: string; themeColors: any }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]} numberOfLines={1}>
                {title}
            </Text>
            <View style={[styles.sectionRule, { backgroundColor: themeColors.borderLight }]} />
        </View>
    )
}

function HeaderPill({
    icon,
    label,
    value,
    themeColors,
}: {
    icon: React.ComponentProps<typeof Feather>["name"]
    label: string
    value: string | number
    themeColors: any
}) {
    return (
        <View style={[styles.headerPill, { backgroundColor: themeColors.background, borderColor: themeColors.borderLight }]}>
            <Feather name={icon} size={14} color={themeColors.textLight} />
            <Text style={[styles.headerPillLabel, { color: themeColors.textLight }]} numberOfLines={1}>
                {label}
            </Text>
            <Text style={[styles.headerPillValue, { color: themeColors.text }]} numberOfLines={1}>
                {String(value)}
            </Text>
        </View>
    )
}

function QuickAction({
    icon,
    label,
    onPress,
    themeColors,
}: {
    icon: React.ComponentProps<typeof Feather>["name"]
    label: string
    onPress?: () => void
    themeColors: any
}) {
    return (
        <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }]}
            onPress={onPress}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={label}
        >
            <View style={[styles.quickActionIconWrap, { backgroundColor: themeColors.background, borderColor: themeColors.borderLight }]}>
                <Feather name={icon} size={20} color={colors.primary} />
            </View>
            <Text style={[styles.quickActionLabel, { color: themeColors.text }]} numberOfLines={1}>
                {label}
            </Text>
        </TouchableOpacity>
    )
}

function KpiHighlight({
    icon,
    label,
    value,
    chipLabel,
    color,
    themeColors,
    isDark,
}: {
    icon: React.ComponentProps<typeof Feather>["name"]
    label: string
    value: string
    chipLabel?: string
    color?: string
    themeColors: any
    isDark: boolean
}) {
    const txtColor = color || colors.primary
    return (
        <View style={[styles.kpiCard, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: isDark ? `${txtColor}20` : `${txtColor}15` }]}>
                <Feather name={icon} size={18} color={txtColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.kpiLabel, { color: themeColors.textLight }]} numberOfLines={1}>
                    {label}
                </Text>
                <Text style={[styles.kpiValue, { color: txtColor }]} numberOfLines={1}>
                    {value}
                </Text>
            </View>
            {chipLabel ? (
                <View style={[styles.kpiChip, { backgroundColor: themeColors.borderLight }]}>
                    <Text style={[styles.kpiChipText, { color: themeColors.textLight }]} numberOfLines={1}>
                        {chipLabel}
                    </Text>
                </View>
            ) : null}
        </View>
    )
}

/* Styles */

const cardBase: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {},

    // Header
    headerBlock: {
        ...cardBase,
        shadowColor: "#000",
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
        flexDirection: "column",
    },
    headerLeft: {
        flex: 1,
    },
    headerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.xs,
        flexWrap: "wrap",
    },
    greeting: {
        fontSize: fonts.sizes.xl,
        fontFamily: fonts.regular,
        fontWeight: Number(fonts.weights.bold) as any,
    },
    roleBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs / 1.5,
        paddingVertical: 6,
        paddingHorizontal: spacing.sm,
        borderRadius: 999,
        borderWidth: 1,
    },
    roleBadgeText: {
        fontSize: fonts.sizes.sm,
        fontFamily: fonts.regular,
        color: colors.primary,
        fontWeight: fonts.weights.semibold,
    } as TextStyle,
    subtitle: {
        fontSize: fonts.sizes.md,
        fontFamily: fonts.regular,
    },
    headerRight: {
        marginTop: spacing.md,
        flexDirection: "row",
        gap: spacing.xs,
        flexWrap: 'wrap',
    },
    headerPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingVertical: 8,
        paddingHorizontal: spacing.sm,
        borderRadius: spacing.sm,
        borderWidth: 1,
        minWidth: 140,
        flexGrow: 0,
        overflow: 'hidden',
    },
    headerPillLabel: {
        fontSize: fonts.sizes.sm,
        fontFamily: fonts.regular,
        flexShrink: 1,
        minWidth: 0,
    },
    headerPillValue: {
        marginLeft: "auto",
        fontSize: fonts.sizes.sm,
        fontFamily: fonts.regular,
        fontWeight: Number(fonts.weights.semibold) as any,
        maxWidth: "50%",
        flexShrink: 1,
        minWidth: 0,
    },

    // Sections
    section: {
        marginTop: spacing.lg,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: fonts.sizes.lg,
        fontFamily: fonts.regular,
        fontWeight: Number(fonts.weights.semibold) as any,
    },
    sectionRule: {
        height: 1,
        flex: 1,
    },
    linkText: {
        color: colors.primary,
        fontFamily: fonts.regular,
        fontWeight: Number(fonts.weights.medium) as any,
    },

    // Grid rows and cells (mobile-first)
    row: {
        flexDirection: "row",
    },
    cell: {
        ...cardBase,
        padding: 0,
        backgroundColor: "transparent",
        borderWidth: 0,
    },

    // Highlights
    highlightItem: {
        width: 240,
    },
    kpiCard: {
        ...cardBase,
        padding: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    kpiIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    kpiLabel: {
        fontSize: fonts.sizes.sm,
        fontFamily: fonts.regular,
        marginBottom: spacing.xs / 2,
    },
    kpiValue: {
        fontSize: fonts.sizes.xl,
        fontFamily: fonts.regular,
        fontWeight: Number(fonts.weights.bold) as any,
    },
    kpiChip: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs / 2,
        borderRadius: 999,
    },
    kpiChipText: {
        fontSize: fonts.sizes.xs,
        fontFamily: fonts.regular,
    },

    // Quick Actions
    quickAction: {
        ...cardBase,
        alignItems: "center",
        paddingVertical: spacing.lg,
        gap: spacing.sm,
    },
    quickActionIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    quickActionLabel: {
        fontSize: fonts.sizes.sm,
        fontFamily: fonts.regular,
        fontWeight: Number(fonts.weights.semibold) as any,
        textAlign: "center",
    },

    // Cards
    card: {
        ...cardBase,
        padding: spacing.lg,
    },

    // Attendance
    attendanceCtas: {
        flexDirection: "row",
        marginTop: spacing.md,
    },
    attendanceCta: {
        flex: 1,
    },

    // Activity List
    activityList: {
        padding: 0,
    },
    activityItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
    },
    activityDivider: {
        borderBottomWidth: 1,
    },
    activityIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        marginRight: spacing.sm,
        marginTop: 2,
    },
    activityTextContainer: {
        flex: 1,
    },
    activityText: {
        fontSize: fonts.sizes.md,
        fontFamily: fonts.regular,
    },
    activityMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        marginTop: spacing.xs / 2,
    },
    activityTime: {
        fontSize: fonts.sizes.xs,
        fontFamily: fonts.regular,
    },
})
