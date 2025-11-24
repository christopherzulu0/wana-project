"use client";

import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState, useEffect } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../constants/Colors";
import { fonts } from "../../constants/fonts";
import { spacing } from "../../constants/spacing";
import { useAuth } from "../../hooks/useAuth";
import { useColorScheme } from "../../hooks/useColorScheme";
import { useUsers } from "../../hooks/useUsers";
import { useClasses } from "../../hooks/useClasses";
import { useStudents } from "../../hooks/useStudents";
import type { AttendanceStats } from "../../types";
import { AttendanceChart } from "../AttendanceChart";
import { Button } from "../Button";
import { generateOverallAttendanceReport, saveAndShareReport } from "../../utils/reportGenerator";

// === Theme Colors ===
const darkColors = {
  background: "#0A0E27",
  cardPrimary: "#1A1F3A",
  cardSecondary: "#252D4A",
  surface: "rgba(26, 31, 58, 0.6)",
  text: "#F8FAFC",
  textLight: "#CBD5E1",
  textExtraLight: "#94A3B8",
  border: "#3B4563",
  accent: "#00D9FF",
  accentAlt: "#7C3AED",
  accentWarm: "#FF6B35",
  success: "#10B981",
  warning: "#FBBF24",
  danger: "#FF5555",
  gradientStart: "#00D9FF",
  gradientEnd: "#7C3AED",
};

const lightColors = {
  background: "#F5F7FA",
  cardPrimary: "#FFFFFF",
  cardSecondary: "#F0F4F8",
  surface: "rgba(255, 255, 255, 0.7)",
  text: "#0F172A",
  textLight: "#475569",
  textExtraLight: "#64748B",
  border: "#E2E8F0",
  accent: "#0891B2",
  accentAlt: "#7C3AED",
  accentWarm: "#EA580C",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  gradientStart: "#0891B2",
  gradientEnd: "#7C3AED",
};

const API_BASE_URL = 'https://attendance-records-wana.vercel.app';

export function AdminOverviewTab({ onNavigateToReports }: { onNavigateToReports?: () => void }) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';

  const { users, loading: usersLoading } = useUsers();
  const { classes, loading: classesLoading } = useClasses();
  const { students, loading: studentsLoading } = useStudents();

  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ total: 0, present: 0, late: 0, absent: 0 });
  const [activeStudentsToday, setActiveStudentsToday] = useState(0);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [recentActivities, setRecentActivities] = useState<Array<{ id: string; icon: string; text: string; time: string }>>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);

  const themeColors = useMemo(() => ({
    ...(isDark ? darkColors : lightColors),
  }), [isDark]);

  const contentPad = width < 480 ? spacing.md : spacing.lg;
  const gutter = spacing.md;

  // === Fetch Attendance Stats ===
  useEffect(() => {
    const fetchAttendanceStats = async () => {
      if (students.length === 0) {
        setAttendanceStats({ total: 0, present: 0, late: 0, absent: 0 });
        setActiveStudentsToday(0);
        return;
      }

      setLoadingAttendance(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        let present = 0, late = 0, absent = 0;

        const batchSize = 10;
        for (let i = 0; i < students.length; i += batchSize) {
          const batch = students.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(async (s) => {
              try {
                const res = await fetch(`${API_BASE_URL}/api/students/${s.id}/attendance?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`);
                if (!res.ok) return null;
                const data = await res.json();
                return data.attendance?.find((r: any) => r.date === today);
              } catch {
                return null;
              }
            })
          );

          results.forEach((r: any) => {
            if (r) {
              if (r.status === 'present') present++;
              else if (r.status === 'late') late++;
              else if (r.status === 'absent') absent++;
            }
          });
        }

        const total = students.length;
        const unmarked = total - (present + late + absent);
        setAttendanceStats({ total, present, late, absent: absent + unmarked });
        setActiveStudentsToday(present + late);
      } catch (err) {
        console.error(err);
        setAttendanceStats({ total: students.length, present: 0, late: 0, absent: students.length });
      } finally {
        setLoadingAttendance(false);
      }
    };

    fetchAttendanceStats();
  }, [students]);

  // === Fetch Recent Activities ===
  useEffect(() => {
    const fetchRecentActivities = async () => {
      if (students.length === 0) return;
      setLoadingActivities(true);
      try {
        const activities: any[] = [];
        const now = new Date();

        const recent = await Promise.all(
          students.slice(0, 8).map(async (s) => {
            try {
              const res = await fetch(`${API_BASE_URL}/api/students/${s.id}/attendance?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
              if (!res.ok) return null;
              const data = await res.json();
              const recents = (data.attendance || [])
                .filter((r: any) => {
                  const diff = (now.getTime() - new Date(r.date).getTime()) / (1000 * 60 * 60 * 24);
                  return diff <= 7;
                })
                .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
              return recents ? { ...recents, student: s } : null;
            } catch {
              return null;
            }
          })
        );

        recent.filter(Boolean).forEach((r: any) => {
          const diff = (now.getTime() - new Date(r.date).getTime()) / (1000 * 60);
          let timeStr = '';
          if (diff < 60) timeStr = diff < 2 ? 'Just now' : `${Math.floor(diff)} mins ago`;
          else if (diff < 1440) timeStr = `${Math.floor(diff / 60)}h ago`;
          else timeStr = `${Math.floor(diff / 1440)}d ago`;

          const className = classes.find(c => c.id === r.classId)?.name || 'Class';

          activities.push({
            id: `${r.student.id}-${r.date}`,
            icon: r.status === 'present' ? 'check-circle' : r.status === 'late' ? 'clock' : 'x-circle',
            text: `${r.student.name} marked ${r.status} in ${className}`,
            time: timeStr,
          });
        });

        setRecentActivities(activities.sort((a, b) => a.time.localeCompare(b.time)).slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchRecentActivities();
  }, [students, classes]);

  const totalUsers = users.length;
  const totalClasses = classes.length;
  const totalStudents = students.length;
  const loading = usersLoading || classesLoading || studentsLoading || loadingAttendance;

  const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0;
  const presentRate = pct(attendanceStats.present + attendanceStats.late, attendanceStats.total);
  const lateRate = pct(attendanceStats.late, attendanceStats.total);
  const absentRate = pct(attendanceStats.absent, attendanceStats.total);

    const kpis = [
    { title: "Total Users", value: totalUsers, icon: "users" as const, color: themeColors.accent, subtitle: "Teachers & Admins" },
    { title: "Total Classes", value: totalClasses, icon: "book-open" as const, color: themeColors.accentAlt, subtitle: "Active classes" },
    { title: "Total Students", value: totalStudents, icon: "user-check" as const, color: themeColors.success, subtitle: "All students" },
    { title: "Active Today", value: activeStudentsToday, icon: "activity" as const, color: themeColors.accentWarm, subtitle: "Present or late" },
  ];

  // === Skeleton Loader Component ===
  const Skeleton = ({ width, height, style }: any) => {
    const animatedValue = new Animated.Value(0);
    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(animatedValue, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }, []);

    const opacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    return (
      <Animated.View style={[{ width, height, backgroundColor: themeColors.border, borderRadius: 8 }, style, { opacity }]} />
    );
  };

  if (loading && totalUsers === 0 && totalClasses === 0 && totalStudents === 0) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} contentContainerStyle={{ padding: contentPad, paddingBottom: spacing.xxl }}>
        <View style={styles.skeletonHero}>
          <Skeleton width="60%" height={32} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={20} />
        </View>
        <View style={styles.skeletonGrid}>
          {[...Array(4)].map((_, i) => (
            <View key={i} style={styles.skeletonKpi}>
              <Skeleton width={40} height={40} style={{ borderRadius: 20, marginBottom: 8 }} />
              <Skeleton width="70%" height={16} style={{ marginBottom: 4 }} />
              <Skeleton width="50%" height={14} />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

    return (
        <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      contentContainerStyle={{ padding: contentPad, paddingBottom: spacing.xxl }}
            showsVerticalScrollIndicator={false}
        >
      {/* === Hero Section with Gradient === */}
      <LinearGradient
        colors={[themeColors.accent + '20', themeColors.accentAlt + '10']}
        style={styles.heroCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
            >
        <View style={styles.heroContent}>
          <View>
            <Text style={[styles.heroTitle, { color: themeColors.text }]} numberOfLines={1}>
              Welcome, {user?.name?.split(' ')[0] || "Admin"}!
                        </Text>
            <View style={styles.heroBadge}>
              <Feather name="shield" size={14} color={themeColors.accent} />
              <Text style={[styles.heroBadgeText, { color: themeColors.accent }]}>Administrator</Text>
                        </View>
                    </View>
          <Text style={[styles.heroSubtitle, { color: themeColors.textLight }]}>
            Monitor attendance & manage school efficiently
                    </Text>
                </View>

        <View style={styles.heroPills}>
          <HeroPill icon="calendar" label={new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} />
          <HeroPill icon="zap" label={`${activeStudentsToday} Active`} highlight />
        </View>
      </LinearGradient>

      {/* === Key Metrics === */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Key Metrics</Text>
        <View style={styles.kpiGrid}>
          {kpis.map((kpi, i) => (
            <LinearGradient
              key={i}
              colors={[themeColors.accent + '20', themeColors.accentAlt + '10']}
              style={[styles.kpiCard, { borderColor: kpi.color + '40' }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <LinearGradient
                colors={[kpi.color + '15', kpi.color + '05']}
                style={styles.kpiIconBg}
              >
                <Feather name={kpi.icon} size={22} color={kpi.color} />
              </LinearGradient>
              <Text style={[styles.kpiValue, { color: kpi.color }]}>{kpi.value}</Text>
              <Text style={[styles.kpiTitle, { color: themeColors.text }]}>{kpi.title}</Text>
              <Text style={[styles.kpiSubtitle, { color: themeColors.textExtraLight }]}>{kpi.subtitle}</Text>
            </LinearGradient>
          ))}
                </View>
            </View>

      {/* === Today's Performance === */}
            <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Today's Performance</Text>
        <View style={styles.performanceGrid}>
          {[
            { label: "Attendance", value: presentRate, icon: "check-circle", color: themeColors.success },
            { label: "Late", value: lateRate, icon: "clock", color: themeColors.warning },
            { label: "Absent", value: absentRate, icon: "x-circle", color: themeColors.danger },
            { label: "Active", value: activeStudentsToday, total: attendanceStats.total, icon: "users", color: themeColors.accent },
          ].map((item, i) => (
            <LinearGradient
              key={i}
              colors={[themeColors.accent + '20', themeColors.accentAlt + '10']}
              style={[styles.perfCard, { borderColor: item.color + '40' }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
                                >
              <View style={[styles.perfIcon, { backgroundColor: item.color + '15' }]}>
                <Feather name={item.icon} size={18} color={item.color} />
                                </View>
              <Text style={[styles.perfValue, { color: item.color }]}>
                {item.total ? `${item.value}/${item.total}` : `${item.value}%`}
              </Text>
              <Text style={[styles.perfLabel, { color: themeColors.textLight }]}>{item.label}</Text>
            </LinearGradient>
                ))}
            </View>
            </View>

      {/* === Attendance Summary === */}
            <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Attendance Summary</Text>
        <LinearGradient
          colors={[themeColors.accent + '20', themeColors.accentAlt + '10']}
          style={[styles.chartCard, { borderColor: themeColors.accentAlt + '30' }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {loadingAttendance ? (
            <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="small" color={themeColors.accent} />
            </View>
          ) : (
            <AttendanceChart stats={attendanceStats} title="Today's Breakdown" />
          )}
          <View style={styles.ctaRow}>
            <Button title="View Reports" variant="outline" onPress={onNavigateToReports} style={{ flex: 1, marginRight: spacing.sm }} />
                        <Button
              title={exportingCSV ? "Exporting..." : "Export CSV"}
                            variant="primary"
              onPress={async () => {
                if (exportingCSV) return;
                setExportingCSV(true);
                try {
                  const csv = await generateOverallAttendanceReport(students, classes);
                  const uri = await saveAndShareReport(csv, 'attendance-report');
                  Alert.alert('Success', uri ? 'Report ready to share!' : 'Report saved to device.');
                } catch (err) {
                  Alert.alert('Error', 'Export failed.');
                } finally {
                  setExportingCSV(false);
                }
              }}
              disabled={exportingCSV}
              style={{ flex: 1 }}
                        />
                    </View>
        </LinearGradient>
            </View>

      {/* === Recent Activity === */}
            <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Recent Activity</Text>
        <LinearGradient
          colors={[themeColors.accent + '20', themeColors.accentAlt + '10']}
          style={styles.activityCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {loadingActivities ? (
            <View style={styles.activitySkeleton}>
              {[...Array(3)].map((_, i) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: spacing.md }}>
                  <Skeleton width={32} height={32} style={{ borderRadius: 16, marginRight: spacing.sm }} />
                  <View style={{ flex: 1 }}>
                    <Skeleton width="80%" height={16} style={{ marginBottom: 4 }} />
                    <Skeleton width="40%" height={14} />
                            </View>
                        </View>
                    ))}
            </View>
          ) : recentActivities.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={32} color={themeColors.textExtraLight} />
              <Text style={[styles.emptyText, { color: themeColors.textLight }]}>No recent activity</Text>
            </View>
          ) : (
            recentActivities.map((act, i) => (
              <View key={act.id} style={[styles.activityItem, i === recentActivities.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.activityDot, { backgroundColor: act.icon === 'check-circle' ? themeColors.success : act.icon === 'clock' ? themeColors.warning : themeColors.danger }]} />
                <View style={[styles.activityLine, i === recentActivities.length - 1 && { display: 'none' }]} />
                <View style={styles.activityContent}>
                  <Feather name={act.icon as any} size={16} color={act.icon === 'check-circle' ? themeColors.success : act.icon === 'clock' ? themeColors.warning : themeColors.danger} />
                  <Text style={[styles.activityText, { color: themeColors.text }]}>{act.text}</Text>
                  <Text style={[styles.activityTime, { color: themeColors.textExtraLight }]}>{act.time}</Text>
                </View>
              </View>
            ))
          )}
        </LinearGradient>
        </View>
    </ScrollView>
  );
}

// === Subcomponents ===
const HeroPill = ({ icon, label, highlight }: any) => {
  const themeColors = useColorScheme() === 'dark' ? darkColors : lightColors;
  return (
    <View style={[styles.pill, highlight && { backgroundColor: themeColors.accentWarm + '25', borderColor: themeColors.accentWarm + '50' }]}>
      <Feather name={icon} size={14} color={highlight ? themeColors.accentWarm : themeColors.textLight} />
      <Text style={[styles.pillText, { color: highlight ? themeColors.accentWarm : themeColors.textLight }]}>{label}</Text>
    </View>
  );
};

// === Styles ===
const styles = StyleSheet.create({
  container: { flex: 1 },
  heroCard: { 
    borderRadius: 20, 
    padding: spacing.lg, 
    marginBottom: spacing.xl, 
    borderWidth: 1.5, 
    borderColor: 'transparent',
    shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  heroContent: { marginBottom: spacing.md },
  heroTitle: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 12, backgroundColor: '#00D9FF15', borderWidth: 1, borderColor: '#00D9FF' },
  heroBadgeText: { marginLeft: 4, fontSize: 12, fontFamily: fonts.medium, color: '#00D9FF' },
  heroSubtitle: { fontSize: 15, marginTop: spacing.sm, fontFamily: fonts.regular },
  heroPills: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: 20, backgroundColor: '#CBD5E115', borderWidth: 1, borderColor: '#CBD5E125' },
  pillText: { marginLeft: 6, fontSize: 13, fontFamily: fonts.medium },

  section: { marginBottom: spacing.xl },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, marginBottom: spacing.md },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  kpiCard: { 
        flex: 1,
        minWidth: 140,
    padding: spacing.lg, 
    borderRadius: 20, 
    borderWidth: 1.5, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    },
  kpiIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  kpiValue: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 36 },
  kpiTitle: { fontFamily: fonts.semibold, fontSize: 14, textAlign: 'center' },
  kpiSubtitle: { fontSize: 12, marginTop: 2, textAlign: 'center' },

  performanceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  perfCard: { 
        flex: 1,
    minWidth: 120, 
    padding: spacing.lg, 
    borderRadius: 20, 
    borderWidth: 1.5, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    },
  perfIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  perfValue: { fontFamily: fonts.bold, fontSize: 22 },
  perfLabel: { fontSize: 13, marginTop: 4 },

  chartCard: { 
    borderRadius: 20, 
    padding: spacing.lg, 
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    },
  ctaRow: { flexDirection: 'row', marginTop: spacing.lg, gap: spacing.sm },

  activityCard: { 
    borderRadius: 20, 
        padding: spacing.lg,
    borderWidth: 1.5, 
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    },
  activityItem: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: '#3B456315' },
  activityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6, marginRight: spacing.md },
  activityLine: { position: 'absolute', left: 4.5, top: 16, bottom: -spacing.lg, width: 1.5, backgroundColor: '#3B456330' },
  activityContent: { flex: 1, marginLeft: spacing.sm },
  activityText: { fontSize: 14, flex: 1, marginLeft: spacing.xs },
  activityTime: { fontSize: 12, alignSelf: 'flex-end', marginTop: spacing.xs },

  emptyState: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { marginTop: spacing.sm, fontSize: 14 },

  skeletonHero: { padding: spacing.lg, backgroundColor: '#1A1F3A', borderRadius: 16, marginBottom: spacing.xl },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  skeletonKpi: { flex: 1, minWidth: 140, padding: spacing.lg, alignItems: 'center' },
  activitySkeleton: { paddingVertical: spacing.md },
}); 