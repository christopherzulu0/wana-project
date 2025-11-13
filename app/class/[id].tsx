import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { DatePicker } from "../../components/DatePicker";
import { EmptyState } from "../../components/EmptyState";
import { Header } from "../../components/Header";
import { StatusBar } from "../../components/StatusBar";
import { StudentCard } from "../../components/StudentCard";
import { colors } from "../../constants/Colors";
import { fonts } from "../../constants/fonts";
import { spacing } from "../../constants/spacing";
import { useAuth } from "../../hooks/useAuth";
import { useColorScheme } from "../../hooks/useColorScheme";
import { getToday } from "../../utils/dateUtils";

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

// Skeleton Loading Component
const SkeletonBox = ({ width, height, style, themeColors }: { width?: number | string; height?: number; style?: any; themeColors?: any }) => (
  <View
    style={[
      {
        width: width || '100%',
        height: height || 20,
        backgroundColor: themeColors?.borderLight || colors.borderLight,
        borderRadius: spacing.xs,
      },
      style,
    ]}
  />
);

const ClassDetailsSkeleton = ({ themeColors }: { themeColors: any }) => (
  <ScrollView
    style={styles.content}
    contentContainerStyle={styles.scrollContent}
    showsVerticalScrollIndicator={false}
  >
    {/* Class Info Card Skeleton */}
    <Card variant="elevated" style={styles.classInfoCard}>
      <View style={styles.classHeader}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: themeColors.borderLight,
          }}
        />
        
        <View style={styles.classInfo}>
          <SkeletonBox width="60%" height={24} style={{ marginBottom: spacing.xs }} themeColors={themeColors} />
          <SkeletonBox width="50%" height={20} style={{ marginBottom: spacing.xs }} themeColors={themeColors} />
          <SkeletonBox width="40%" height={18} themeColors={themeColors} />
        </View>
      </View>
      
      <View style={[styles.statsContainer, { borderTopColor: themeColors.borderLight }]}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.statItem}>
            <SkeletonBox width={40} height={24} style={{ marginBottom: spacing.xs }} themeColors={themeColors} />
            <SkeletonBox width={50} height={16} themeColors={themeColors} />
          </View>
        ))}
      </View>
    </Card>
    
    {/* Date Section Skeleton */}
    <View style={styles.dateSection}>
      <SkeletonBox width="100%" height={56} style={{ marginBottom: spacing.sm }} themeColors={themeColors} />
      <SkeletonBox width="100%" height={48} themeColors={themeColors} />
    </View>
    
    {/* Students Section Skeleton */}
    <View style={styles.studentsSection}>
      <SkeletonBox width="40%" height={24} style={{ marginBottom: spacing.md }} themeColors={themeColors} />
      
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} variant="outlined" style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: themeColors.borderLight,
                marginRight: spacing.md,
              }}
            />
            <View style={{ flex: 1 }}>
              <SkeletonBox width="60%" height={20} style={{ marginBottom: spacing.xs }} themeColors={themeColors} />
              <SkeletonBox width="40%" height={16} themeColors={themeColors} />
            </View>
          </View>
        </Card>
      ))}
    </View>
  </ScrollView>
);

export default function ClassDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [classItem, setClassItem] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedClassIdRef = useRef<string | null>(null);
  
  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : colors.background,
    card: isDark ? darkColors.card : colors.card,
    text: isDark ? darkColors.text : colors.text,
    textLight: isDark ? darkColors.textLight : colors.textLight,
    border: isDark ? darkColors.border : colors.border,
    borderLight: isDark ? darkColors.borderLight : colors.borderLight,
  }), [isDark])
  
  // Fetch data on mount or when id changes
  useEffect(() => {
    if (!id) return;
    
    // Prevent duplicate fetches for the same id
    if (fetchedClassIdRef.current === id) return;
    
    // Mark as fetching
    fetchedClassIdRef.current = id;
    
    // Fetch class data
    const loadClassData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/api/classes/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch class details');
        }
        
        const data = await response.json();
        setClassItem(data.class);
      } catch (err: any) {
        console.error('Error fetching class data:', err);
        setError(err.message || 'Failed to fetch class data');
        // Reset ref on error so we can retry
        if (fetchedClassIdRef.current === id) {
          fetchedClassIdRef.current = null;
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch students
    const loadStudents = async () => {
      try {
        setLoadingStudents(true);
        const response = await fetch(`${API_BASE_URL}/api/classes/${id}`);
        if (response.ok) {
          const data = await response.json();
          setStudents(data.students || []);
        } else {
          setStudents([]);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };
    
    loadClassData();
    loadStudents();
    
    // Cleanup: reset ref when id changes
    return () => {
      if (fetchedClassIdRef.current === id) {
        fetchedClassIdRef.current = null;
      }
    };
  }, [id]); // Only depend on id
  
  // Fetch attendance when date changes or class is loaded
  useEffect(() => {
    if (classItem && id) {
      const dateString = selectedDate.toISOString().split("T")[0];
      fetch(`${API_BASE_URL}/api/classes/${id}/attendance/${dateString}`)
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          return { attendance: [] };
        })
        .then(data => {
          setAttendanceRecords(data.attendance || []);
        })
        .catch(err => {
          console.error('Error fetching attendance records:', err);
          setAttendanceRecords([]);
        });
    }
  }, [classItem, id, selectedDate]); // Direct dependencies instead of callback
  
  // Get attendance stats
  const attendanceStats = useMemo(() => {
    const present = attendanceRecords.filter(record => record.status === "present").length;
    const absent = attendanceRecords.filter(record => record.status === "absent").length;
    const late = attendanceRecords.filter(record => record.status === "late").length;
    const total = students.length;
    
    return { present, absent, late, total };
  }, [attendanceRecords, students.length]);
  
  // Calculate attendance percentage
  const attendancePercentage = attendanceStats.total > 0
    ? Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100)
    : 0;
  
  // Get attendance record for a student
  const getStudentAttendance = (studentId: string) => {
    return attendanceRecords.find(record => record.studentId === studentId);
  };
  
  const handleViewAttendance = () => {
    const dateString = selectedDate.toISOString().split("T")[0];
    router.push(`/attendance/${id}/${dateString}`);
  };
  
  // Show skeleton while loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar />
        <Header title="Class Details" showBackButton />
        <ClassDetailsSkeleton themeColors={themeColors} />
      </SafeAreaView>
    );
  }
  
  // Show error state only after loading completes
  if (!classItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar />
        <Header title="Class Details" showBackButton />
        <EmptyState
          title="Class Not Found"
          message="The class you're looking for doesn't exist or has been removed."
          icon="alert-circle"
        />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar />
      <Header 
        title={`${classItem.name} (${classItem.section})`} 
        showBackButton 
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="elevated" style={styles.classInfoCard}>
          <View style={styles.classHeader}>
            <View style={styles.iconContainer}>
              <Feather name="book" size={24} color={colors.card} />
            </View>
            
            <View style={styles.classInfo}>
              <Text style={[styles.className, { color: themeColors.text }]}>{classItem.name}</Text>
              <Text style={[styles.classSubject, { color: themeColors.text }]}>{classItem.subject}</Text>
              <Text style={[styles.classSection, { color: themeColors.textLight }]}>Section {classItem.section}</Text>
            </View>
          </View>
          
          <View style={[styles.statsContainer, { borderTopColor: themeColors.borderLight }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: themeColors.text }]}>{students.length}</Text>
              <Text style={[styles.statLabel, { color: themeColors.textLight }]}>Students</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: themeColors.text }]}>{attendanceStats.present}</Text>
              <Text style={[styles.statLabel, { color: themeColors.textLight }]}>Present</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: themeColors.text }]}>{attendanceStats.absent}</Text>
              <Text style={[styles.statLabel, { color: themeColors.textLight }]}>Absent</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: themeColors.text }]}>{attendancePercentage}%</Text>
              <Text style={[styles.statLabel, { color: themeColors.textLight }]}>Attendance</Text>
            </View>
          </View>
        </Card>
        
        <View style={styles.dateSection}>
          <DatePicker
            date={selectedDate}
            onDateChange={setSelectedDate}
            label="Select Date"
            themeColors={themeColors}
          />
          
          <Button
            title="View Attendance Sheet"
            onPress={handleViewAttendance}
            variant="primary"
            style={styles.viewButton}
          />
        </View>
        
        <View style={styles.studentsSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Students ({students.length})</Text>
          
          {loadingStudents ? (
            <EmptyState
              title="Loading Students"
              message="Please wait while we load the student list..."
              icon="loader"
            />
          ) : !students || students.length === 0 ? (
            <EmptyState
              title="No Students"
              message="There are no students in this class yet."
              icon="users"
            />
          ) : (
            students.map(student => {
              const attendanceRecord = getStudentAttendance(student.id);
              return (
                <StudentCard
                  key={student.id}
                  student={student}
                  attendanceRecord={attendanceRecord}
                  showAttendanceControls={false}
                  themeColors={themeColors}
                />
              );
            })
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
  classInfoCard: {
    marginBottom: spacing.xl,
  },
  classHeader: {
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  classInfo: {
    flex: 1,
    justifyContent: "center",
  },
  className: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    marginBottom: spacing.xs / 2,
  },
  classSubject: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    marginBottom: spacing.xs / 2,
  },
  classSection: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    marginBottom: spacing.xs / 2,
  },
  statLabel: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
  },
  dateSection: {
    marginBottom: spacing.xl,
  },
  viewButton: {
    marginTop: spacing.sm,
  },
  studentsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    marginBottom: spacing.md,
  },
});