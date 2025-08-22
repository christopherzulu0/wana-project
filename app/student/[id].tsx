import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AttendanceChart } from "../../components/AttendanceChart";
import { AttendanceStatusBadge } from "../../components/AttendanceStatusBadge";
import { Avatar } from "../../components/Avatar";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { Header } from "../../components/Header";
import { StatusBar } from "../../components/StatusBar";
import { colors } from "../../constants/Colors";
import { fonts } from "../../constants/fonts";
import { spacing } from "../../constants/spacing";
import { useStudents } from "../../hooks/useStudents";
import { formatDate, getPreviousDates } from "../../utils/dateUtils";
import { getStudentAttendanceHistory } from "../../utils/mockData";

export default function StudentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getStudent } = useStudents();
  
  // Get student details
  const student = getStudent(id);
  
  // Get attendance history
  const attendanceHistory = student ? getStudentAttendanceHistory(student.id) : [];
  
  // Calculate attendance stats
  const totalRecords = attendanceHistory.length;
  const presentCount = attendanceHistory.filter(record => record.status === "present").length;
  const absentCount = attendanceHistory.filter(record => record.status === "absent").length;
  const lateCount = attendanceHistory.filter(record => record.status === "late").length;
  
  const attendanceStats = {
    present: presentCount,
    absent: absentCount,
    late: lateCount,
    total: totalRecords,
  };
  
  // Get recent attendance (last 10 days)
  const recentDates = getPreviousDates(10);
  const recentAttendance = recentDates.map(date => {
    const record = attendanceHistory.find(record => record.date === date);
    return {
      date,
      status: record?.status || "absent",
    };
  });
  
  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar />
        <Header title="Student Details" showBackButton />
        <EmptyState
          title="Student Not Found"
          message="The student you're looking for doesn't exist or has been removed."
          icon="alert-circle"
        />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <Header title="Student Details" showBackButton />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar 
              source={student.avatar} 
              name={student.name} 
              size={80} 
            />
            
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{student.name}</Text>
              <Text style={styles.rollNumber}>Roll No: {student.rollNumber}</Text>
              <Text style={styles.className}>{student.class.name} ({student.class.section})</Text>
            </View>
          </View>
          
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Feather name="mail" size={16} color={colors.textLight} />
              <Text style={styles.contactText}>{student.email || "No email provided"}</Text>
            </View>
            
            <View style={styles.contactItem}>
              <Feather name="phone" size={16} color={colors.textLight} />
              <Text style={styles.contactText}>{student.phone || "No phone provided"}</Text>
            </View>
          </View>
        </Card>
        
        <View style={styles.attendanceSection}>
          <Text style={styles.sectionTitle}>Attendance Overview</Text>
          
          <AttendanceChart stats={attendanceStats} />
        </View>
        
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Attendance</Text>
          
          <Card variant="outlined" style={styles.recentCard}>
            {recentAttendance.map((item, index) => (
              <View 
                key={item.date} 
                style={[
                  styles.attendanceItem,
                  index !== recentAttendance.length - 1 && styles.borderBottom
                ]}
              >
                <View style={styles.dateContainer}>
                  <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                </View>
                
                <AttendanceStatusBadge status={item.status} />
              </View>
            ))}
          </Card>
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
  profileCard: {
    marginBottom: spacing.xl,
  },
  profileHeader: {
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: "center",
  },
  name: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  rollNumber: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  className: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },
  contactInfo: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  contactText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginLeft: spacing.sm,
  },
  attendanceSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  recentSection: {
    marginBottom: spacing.xl,
  },
  recentCard: {
    padding: 0,
  },
  attendanceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dateContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.text,
  },
});