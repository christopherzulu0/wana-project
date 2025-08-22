import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
import { useClasses } from "../../hooks/useClasses";
import { formatDate } from "../../utils/dateUtils";
import { getMonthlyAttendanceStats, getTodayAttendanceStats } from "../../utils/mockData";

export default function ReportsScreen() {
  const { user } = useAuth();
  const { getClassesForTeacher } = useClasses();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  // Get teacher's classes
  const teacherClasses = user ? getClassesForTeacher(user.id) : [];
  
  // Default to first class if none selected
  const activeClassId = selectedClassId || (teacherClasses.length > 0 ? teacherClasses[0].id : null);
  
  // Get attendance stats
  const dateString = selectedDate.toISOString().split("T")[0];
  const dailyStats = activeClassId ? getTodayAttendanceStats(activeClassId) : { present: 0, absent: 0, late: 0, total: 0 };
  const monthlyStats = activeClassId ? getMonthlyAttendanceStats(activeClassId) : [];
  
  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <Header title="Attendance Reports" />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Filters</Text>
          
          <DatePicker
            date={selectedDate}
            onDateChange={setSelectedDate}
            label="Select Date"
          />
          
          <Text style={styles.label}>Select Class</Text>
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
        
        <View style={styles.reportSection}>
          <Text style={styles.sectionTitle}>Daily Attendance</Text>
          <Text style={styles.dateText}>{formatDate(dateString)}</Text>
          
          <AttendanceChart stats={dailyStats} />
        </View>
        
        <View style={styles.reportSection}>
          <Text style={styles.sectionTitle}>Monthly Overview</Text>
          
          {monthlyStats.map((monthData, index) => (
            <Card key={index} style={styles.monthCard}>
              <Text style={styles.monthTitle}>
                {monthData.month} {monthData.year}
              </Text>
              
              <AttendanceChart stats={monthData.stats} />
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Present Rate</Text>
                  <Text style={[styles.statValue, { color: colors.statusPresent }]}>
                    {monthData.stats.total > 0
                      ? Math.round((monthData.stats.present / monthData.stats.total) * 100)
                      : 0}%
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Absent Rate</Text>
                  <Text style={[styles.statValue, { color: colors.statusAbsent }]}>
                    {monthData.stats.total > 0
                      ? Math.round((monthData.stats.absent / monthData.stats.total) * 100)
                      : 0}%
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Late Rate</Text>
                  <Text style={[styles.statValue, { color: colors.statusLate }]}>
                    {monthData.stats.total > 0
                      ? Math.round((monthData.stats.late / monthData.stats.total) * 100)
                      : 0}%
                  </Text>
                </View>
              </View>
            </Card>
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
  filterSection: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  classChips: {
    paddingRight: spacing.lg,
    marginBottom: spacing.md,
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
  reportSection: {
    marginBottom: spacing.xl,
  },
  dateText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  monthCard: {
    marginBottom: spacing.lg,
  },
  monthTitle: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
  },
});