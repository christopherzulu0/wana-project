import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../../components/Avatar";
import { ClassCard } from "../../components/ClassCard";
import { StatCard } from "../../components/StatCard";
import { StatusBar } from "../../components/StatusBar";
import { colors } from "../../constants/Colors";
import { fonts } from "../../constants/fonts";
import { spacing } from "../../constants/spacing";
import { useAuth } from "../../hooks/useAuth";
import { useClasses } from "../../hooks/useClasses";
import { formatDate, getToday } from "../../utils/dateUtils";
import { getTodayAttendanceStats } from "../../utils/mockData";

export default function DashboardScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { getClassesForTeacher } = useClasses();
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  // Get teacher's classes
  const teacherClasses = user ? getClassesForTeacher(user.id) : [];
  
  // Default to first class if none selected
  const activeClassId = selectedClassId || (teacherClasses.length > 0 ? teacherClasses[0].id : null);
  
  // Get attendance stats for selected class
  const attendanceStats = activeClassId ? getTodayAttendanceStats(activeClassId) : { present: 0, absent: 0, late: 0, total: 0 };
  
  // Calculate attendance percentage
  const attendancePercentage = attendanceStats.total > 0
    ? Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100)
    : 0;
  
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
    <SafeAreaView style={styles.container}>
      <StatusBar />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name}</Text>
          <Text style={styles.date}>{formatDate(getToday())}</Text>
        </View>
        
        <Avatar source={user?.avatar} name={user?.name} size={48} />
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Present"
              value={attendanceStats.present}
              icon="user-check"
              color={colors.statusPresent}
              subtitle={`${attendanceStats.total} total students`}
            />
            
            <StatCard
              title="Absent"
              value={attendanceStats.absent}
              icon="user-x"
              color={colors.statusAbsent}
              subtitle={`${attendanceStats.total} total students`}
            />
          </View>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Late"
              value={attendanceStats.late}
              icon="clock"
              color={colors.statusLate}
              subtitle={`${attendanceStats.total} total students`}
            />
            
            <StatCard
              title="Attendance"
              value={`${attendancePercentage}%`}
              icon="percent"
              color={colors.success}
              subtitle="Overall attendance rate"
            />
          </View>
        </View>
        
        {teacherClasses.length > 0 && (
          <View style={styles.classSelector}>
            <Text style={styles.sectionTitle}>Your Classes</Text>
            
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
                    cls.id === activeClassId && styles.activeClassChip
                  ]}
                  onPress={() => handleClassSelect(cls.id)}
                >
                  <Text 
                    style={[
                      styles.classChipText,
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
        
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleViewAttendance}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="check-square" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionTitle}>Take Attendance</Text>
              <Text style={styles.actionSubtitle}>Mark today's attendance</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push("/reports")}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.secondary + "20" }]}>
                <Feather name="file-text" size={24} color={colors.secondary} />
              </View>
              <Text style={styles.actionTitle}>View Reports</Text>
              <Text style={styles.actionSubtitle}>Attendance analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.recentClasses}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Classes</Text>
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  greeting: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  date: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
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
    color: colors.text,
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
    backgroundColor: colors.card,
    borderRadius: 100,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeClassChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  classChipText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.text,
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
    backgroundColor: colors.card,
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
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
    color: colors.text,
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
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
});