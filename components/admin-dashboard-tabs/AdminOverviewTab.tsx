"use client"

import React from "react"
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
    ViewStyle,
    TextStyle,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { colors } from "../../constants/Colors"
import { fonts } from "../../constants/fonts"
import { spacing } from "../../constants/spacing"
import { useAuth } from "../../hooks/useAuth"
import { StatCard } from "../StatCard"
import { mockUsers, mockClasses, mockStudents } from "../../utils/mockData"
import { AttendanceChart } from "../AttendanceChart"
import type { AttendanceStats } from "../../types"
import { Button } from "../Button"

export function AdminOverviewTab() {
    const { width } = useWindowDimensions()
    const { user } = useAuth()

    // Mobile-first columns: 2 on phones, 3 if wide (e.g., landscape/tablet)
    const contentPad = spacing.lg
    const gutter = spacing.md
    const cols = width >= 700 ? 3 : 2
    const itemWidth = Math.floor((width - contentPad * 2 - gutter * (cols - 1)) / cols)

    // Stable, deterministic KPIs (no randomness)
    const totalUsers = mockUsers.length
    const totalClasses = mockClasses.length
    const totalStudents = mockStudents.length
    const activeStudentsToday = Math.round(totalStudents * 0.72)

    // Attendance summary
    const present = Math.min(totalStudents, Math.round(totalStudents * 0.78))
    const late = Math.round(present * 0.07)
    const absent = Math.max(0, totalStudents - present)
    const attendanceStats: AttendanceStats = { total: totalStudents, present, late, absent }

    // Helpers
    const chunk = <T,>(arr: readonly T[], size: number) => {
        const res: T[][] = []
        for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size))
        return res
    }
    const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0)

    const presentRate = pct(present + late, attendanceStats.total)
    const lateRate = pct(late, attendanceStats.total)
    const absentRate = pct(absent, attendanceStats.total)

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

    const recentActivities = [
        { id: "1", icon: "check-circle", text: "John Smith marked attendance for CS-A", time: "2 mins ago" },
        { id: "2", icon: "user-plus", text: "New student Alice Brown enrolled in CS-A", time: "1 hour ago" },
        { id: "3", icon: "edit-3", text: "Class Mathematics-B updated by Sarah Johnson", time: "3 hours ago" },
        { id: "4", icon: "file-text", text: "Report generated for Physics-A attendance", time: "Yesterday" },
    ] as const

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.scrollContent, { padding: contentPad, paddingBottom: spacing.xxl }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={[styles.headerBlock, { padding: spacing.lg }]}>
                <View style={styles.headerLeft}>
                    <View style={styles.headerTitleRow}>
                        <Text style={styles.greeting} numberOfLines={2} accessibilityRole="header">
                            {`Hello, ${user?.name ?? "Admin"}!`}
                        </Text>
                        <View style={styles.roleBadge}>
                            <Feather name="shield" size={14} color={colors.primary} />
                            <Text style={styles.roleBadgeText}>Administrator</Text>
                        </View>
                    </View>
                    <Text style={styles.subtitle} numberOfLines={2}>
                        Here&apos;s what&apos;s happening across your school today.
                    </Text>
                </View>

                <View style={styles.headerRight}>
                    <HeaderPill icon="calendar" label="Today" value={formatDate(new Date())} />
                    <HeaderPill icon="activity" label="Active" value={`${activeStudentsToday}`} />
                </View>
            </View>

            {/* System Statistics - rock solid 2/3 column grid */}
            <View style={styles.section}>
                <SectionHeader title="System Statistics" />
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
                                    />
                                </View>
                            )
                        })}
                    </View>
                ))}
            </View>

            {/* KPI Highlights - horizontal scroll to avoid wrapping on phones */}
            <View style={styles.section}>
                <SectionHeader title="Today’s Highlights" />
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 2 }}
                >
                    <View style={[styles.highlightItem, { marginRight: gutter }]}>
                        <KpiHighlight icon="percent" label="Attendance Rate" value={`${presentRate}%`} chipLabel="Today" color={colors.primary} />
                    </View>
                    <View style={[styles.highlightItem, { marginRight: gutter }]}>
                        <KpiHighlight icon="clock" label="Late Rate" value={`${lateRate}%`} chipLabel="Today" color={colors.statusLate} />
                    </View>
                    <View style={[styles.highlightItem, { marginRight: 0 }]}>
                        <KpiHighlight icon="alert-triangle" label="Absences" value={`${absentRate}%`} chipLabel="Today" color={colors.statusAbsent} />
                    </View>
                </ScrollView>
            </View>

            {/* Quick Actions - same stable grid as KPIs */}
            <View style={styles.section}>
                <SectionHeader title="Quick Actions" />
                {chunk(actions, cols).map((row, rowIdx) => (
                    <View key={`act-row-${rowIdx}`} style={[styles.row, { marginBottom: gutter }]}>
                        {row.map((a, colIdx) => {
                            const isLast = colIdx === row.length - 1
                            return (
                                <View
                                    key={a.key}
                                    style={[
                                        styles.cell,
                                        {
                                            width: itemWidth,
                                            marginRight: isLast ? 0 : gutter,
                                            marginBottom: 0,
                                        },
                                    ]}
                                >
                                    <QuickAction icon={a.icon} label={a.label} onPress={a.onPress} />
                                </View>
                            )
                        })}
                    </View>
                ))}
            </View>

            {/* Attendance Summary */}
            <View style={styles.section}>
                <SectionHeader title="Attendance Summary" />
                <View style={styles.card}>
                    <AttendanceChart stats={attendanceStats} title="Summary" />
                    <View style={styles.attendanceCtas}>
                        <Button
                            title="View Reports"
                            variant="outline"
                            onPress={() => console.log("Navigate to Reports")}
                            style={[styles.attendanceCta, { marginRight: spacing.sm }]}
                        />
                        <Button
                            title="Export CSV"
                            variant="primary"
                            onPress={() => console.log("Export CSV")}
                            style={styles.attendanceCta}
                        />
                    </View>
                </View>
            </View>

            {/* Recent Activities */}
            <View style={styles.section}>
                <View style={[styles.sectionHeader, { marginBottom: 0 }]}>
                    <Text style={styles.sectionTitle}>Recent Activities</Text>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity
                        onPress={() => console.log("See all activity")}
                        accessibilityRole="button"
                        accessibilityLabel="See all activities"
                    >
                        <Text style={styles.linkText}>See all</Text>
                    </TouchableOpacity>
                </View>
                <View style={[styles.card, styles.activityList]}>
                    {recentActivities.map((activity, idx) => (
                        <View
                            key={activity.id}
                            style={[styles.activityItem, idx !== recentActivities.length - 1 && styles.activityDivider]}
                            accessible
                            accessibilityRole="text"
                            accessibilityLabel={`${activity.text}, ${activity.time}`}
                        >
                            <View style={styles.activityIconWrap}>
                                <Feather name={activity.icon} size={16} color={colors.primary} />
                            </View>
                            <View style={styles.activityTextContainer}>
                                <Text style={styles.activityText} numberOfLines={2}>
                                    {activity.text}
                                </Text>
                                <View style={styles.activityMetaRow}>
                                    <Feather name="clock" size={12} color={colors.textExtraLight} />
                                    <Text style={styles.activityTime}>{activity.time}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
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

function SectionHeader({ title }: { title: string }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} numberOfLines={1}>
                {title}
            </Text>
            <View style={styles.sectionRule} />
        </View>
    )
}

function HeaderPill({
    icon,
    label,
    value,
}: {
    icon: React.ComponentProps<typeof Feather>["name"]
    label: string
    value: string | number
}) {
    return (
        <View style={styles.headerPill}>
            <Feather name={icon} size={14} color={colors.textLight} />
            <Text style={styles.headerPillLabel} numberOfLines={1}>
                {label}
            </Text>
            <Text style={styles.headerPillValue} numberOfLines={1}>
                {String(value)}
            </Text>
        </View>
    )
}

function QuickAction({
    icon,
    label,
    onPress,
}: {
    icon: React.ComponentProps<typeof Feather>["name"]
    label: string
    onPress?: () => void
}) {
    return (
        <TouchableOpacity
            style={styles.quickAction}
            onPress={onPress}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={label}
        >
            <View style={styles.quickActionIconWrap}>
                <Feather name={icon} size={20} color={colors.primary} />
            </View>
            <Text style={styles.quickActionLabel} numberOfLines={1}>
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
}: {
    icon: React.ComponentProps<typeof Feather>["name"]
    label: string
    value: string
    chipLabel?: string
    color?: string
}) {
    const txtColor = color || colors.primary
    return (
        <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: `${txtColor}15` }]}>
                <Feather name={icon} size={18} color={txtColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.kpiLabel} numberOfLines={1}>
                    {label}
                </Text>
                <Text style={[styles.kpiValue, { color: txtColor }]} numberOfLines={1}>
                    {value}
                </Text>
            </View>
            {chipLabel ? (
                <View style={styles.kpiChip}>
                    <Text style={styles.kpiChipText} numberOfLines={1}>
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
        backgroundColor: colors.background,
    },
    scrollContent: {},

    // Header
    headerBlock: {
        ...cardBase,
        shadowColor: "#000",
        shadowOpacity: 0.06,
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
        fontWeight: fonts.weights.bold,
        color: colors.text,
    },
    roleBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs / 1.5,
        paddingVertical: 6,
        paddingHorizontal: spacing.sm,
        borderRadius: 999,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderLight,
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
        color: colors.textLight,
    },
    headerRight: {
        marginTop: spacing.md,
        flexDirection: "row",
        gap: spacing.xs,
    },
    headerPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingVertical: 8,
        paddingHorizontal: spacing.sm,
        borderRadius: spacing.sm,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderLight,
        minWidth: 140,
        flexGrow: 0,
    },
    headerPillLabel: {
        fontSize: fonts.sizes.sm,
        fontFamily: fonts.regular,
        color: colors.textLight,
    },
    headerPillValue: {
        marginLeft: "auto",
        fontSize: fonts.sizes.sm,
        fontFamily: fonts.regular,
        color: colors.text,
        fontWeight: fonts.weights.semibold,
        maxWidth: "50%",
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
        fontWeight: fonts.weights.semibold,
        color: colors.text,
    },
    sectionRule: {
        height: 1,
        backgroundColor: colors.borderLight,
        flex: 1,
    },
    linkText: {
        color: colors.primary,
        fontFamily: fonts.regular,
        fontWeight: fonts.weights.medium,
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
        color: colors.textLight,
        marginBottom: spacing.xs / 2,
    },
    kpiValue: {
        fontSize: fonts.sizes.xl,
        fontFamily: fonts.regular,
        fontWeight: fonts.weights.bold,
    },
    kpiChip: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs / 2,
        borderRadius: 999,
        backgroundColor: colors.borderLight,
    },
    kpiChipText: {
        fontSize: fonts.sizes.xs,
        fontFamily: fonts.regular,
        color: colors.textLight,
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
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderLight,
        alignItems: "center",
        justifyContent: "center",
    },
    quickActionLabel: {
        fontSize: fonts.sizes.sm,
        fontFamily: fonts.regular,
        color: colors.text,
        fontWeight: fonts.weights.semibold,
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
        borderBottomColor: colors.borderLight,
    },
    activityIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderLight,
        marginRight: spacing.sm,
        marginTop: 2,
    },
    activityTextContainer: {
        flex: 1,
    },
    activityText: {
        fontSize: fonts.sizes.md,
        fontFamily: fonts.regular,
        color: colors.text,
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
        color: colors.textExtraLight,
    },
})
