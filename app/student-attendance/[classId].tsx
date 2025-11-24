"use client"

import { Feather } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect, useCallback, useMemo } from "react"
import { ActivityIndicator, StyleSheet, Text, View, ScrollView, Alert } from "react-native"
import { Button } from "../../components/Button"
import { Card } from "../../components/Card"
import { Header } from "../../components/Header"
import { StatusBar } from "../../components/StatusBar"
import { colors } from "../../constants/Colors"
import { fonts } from "../../constants/fonts"
import { spacing } from "../../constants/spacing"
import { useAuth } from "../../hooks/useAuth"
import { useColorScheme } from "../../hooks/useColorScheme"
import { useFaceEnrollment } from "../../hooks/useFaceEnrollment"
import { getToday } from "../../utils/dateUtils"

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

const API_BASE_URL = 'https://attendance-records-wana.vercel.app'

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
)

const FaceScanSkeleton = ({ themeColors }: { themeColors?: any }) => (
  <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
    {/* Description Skeleton */}
    <SkeletonBox width="90%" height={60} style={{ marginBottom: spacing.xl, alignSelf: 'center' }} themeColors={themeColors} />
    
    {/* Camera Card Skeleton */}
    <Card variant="elevated" style={styles.cameraCard}>
      <View style={[styles.cameraPlaceholder, { backgroundColor: themeColors?.borderLight || colors.borderLight }]}>
        <ActivityIndicator size="large" color={themeColors?.textLight || colors.textLight} />
        <SkeletonBox width="60%" height={20} style={{ marginTop: spacing.md }} themeColors={themeColors} />
        <SkeletonBox width="80%" height={16} style={{ marginTop: spacing.sm }} themeColors={themeColors} />
      </View>
    </Card>

    {/* Button Skeleton */}
    <SkeletonBox width="80%" height={50} style={{ marginBottom: spacing.lg, alignSelf: 'center', borderRadius: spacing.md }} themeColors={themeColors} />
  </ScrollView>
)

export default function StudentFaceScanScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { verifyFaceAndMarkAttendance, loading: faceEnrollmentLoading } = useFaceEnrollment()
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'

  const [classItem, setClassItem] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<"success" | "failure" | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attendanceAlreadyMarked, setAttendanceAlreadyMarked] = useState(false)
  
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

  // Fetch class data
  const fetchClass = useCallback(async () => {
    if (!classId) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/classes/${classId}`)
      if (response.ok) {
        const data = await response.json()
        setClassItem(data)
      } else if (response.status === 404) {
        setError('Class not found')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch class' }))
        setError(errorData.error || 'Failed to fetch class data')
      }
    } catch (err) {
      console.error('Error fetching class:', err)
      setError('Network error occurred while fetching class data')
    }
  }, [classId])

  // Fetch student data by user ID
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
          setError('Student record not found. Please contact an administrator to link your account.')
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

  // Check if attendance is already marked for today
  const checkAttendanceForToday = useCallback(async () => {
    if (!studentId || !classId) return

    try {
      const today = new Date().toISOString().split('T')[0]
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      
      const response = await fetch(
        `${API_BASE_URL}/api/students/${studentId}/attendance?month=${currentMonth}&year=${currentYear}`
      )

      if (response.ok) {
        const data = await response.json()
        const todayAttendance = data.attendance || []
        
        const hasAttendance = todayAttendance.some(
          (record: any) => 
            record.date === today && 
            (record.classId === classId || record.classId === classId.toString())
        )
        
        setAttendanceAlreadyMarked(hasAttendance)
      }
    } catch (err) {
      console.error('Error checking attendance status:', err)
    }
  }, [studentId, classId])

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      await Promise.all([
        fetchClass(),
        fetchStudent(),
      ])
      
      setLoading(false)
    }

    fetchData()
  }, [fetchClass, fetchStudent])

  // Check attendance status after student is loaded
  useEffect(() => {
    if (studentId && classId && !loading) {
      checkAttendanceForToday()
    }
  }, [studentId, classId, loading, checkAttendanceForToday])

  const handleScanFace = async () => {
    if (!student || !classItem || !user || !studentId || !classId) {
      setScanStatus("Error: Student or class data missing.")
      setScanResult("failure")
      return
    }

    if (attendanceAlreadyMarked) {
      Alert.alert(
        'Attendance Already Marked',
        `You have already marked your attendance for ${classItem.name} today.`,
        [{ text: 'OK' }]
      )
      return
    }

    // For now, we'll use a placeholder base64 image
    // In a real implementation, this would come from the camera
    const placeholderBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="

    setIsScanning(true)
    setScanStatus("Scanning your face...")
    setScanResult(null)

    try {
      const result = await verifyFaceAndMarkAttendance(
        studentId,
        classId,
        placeholderBase64
      )

      if (result.success) {
        setScanStatus("Attendance marked successfully!")
        setScanResult("success")
        setAttendanceAlreadyMarked(true)
        
        // Navigate back after a short delay
        setTimeout(() => {
          router.back()
        }, 2000)
      } else {
        setScanStatus(result.message || "Face not recognized. Please try again.")
        setScanResult("failure")
      }
    } catch (err) {
      console.error('Face scan error:', err)
      setScanStatus("An error occurred during face verification. Please try again.")
      setScanResult("failure")
    } finally {
      setIsScanning(false)
    }
  }

  // Show skeleton while loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar />
        <Header title="Mark Attendance" showBackButton />
        <FaceScanSkeleton themeColors={themeColors} />
      </SafeAreaView>
    )
  }

  // Show error state
  if (error || !classItem || !student) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar />
        <Header title="Mark Attendance" showBackButton />
        <View style={styles.emptyStateContainer}>
          <Feather name="alert-circle" size={48} color={colors.danger} />
          <Text style={[styles.emptyStateText, { color: themeColors.text }]}>
            {error || "Class or student data not found."}
          </Text>
          <Text style={[styles.emptyStateSubText, { color: themeColors.textLight }]}>
            Please check your connection and try again.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar />
      <Header title={`Mark Attendance for ${classItem.name}`} showBackButton />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.description, { color: themeColors.textLight }]}>
          Position your face clearly in the camera frame to mark your attendance for{" "}
          <Text style={styles.classNameText}>
            {classItem.name} {classItem.section && `(${classItem.section})`}
          </Text>
          .
        </Text>

        {attendanceAlreadyMarked && (
          <Card variant="outlined" style={styles.infoCard}>
            <View style={styles.infoContainer}>
              <Feather name="check-circle" size={20} color={colors.success} />
              <Text style={[styles.infoText, { color: colors.success }]}>
                You have already marked attendance for this class today.
              </Text>
            </View>
          </Card>
        )}

        <Card variant="elevated" style={styles.cameraCard}>
          <View style={[styles.cameraPlaceholder, { backgroundColor: themeColors.borderLight }]}>
            <Feather name="camera" size={60} color={themeColors.textExtraLight} />
            <Text style={[styles.cameraText, { color: themeColors.textLight }]}>Camera Feed Placeholder</Text>
            <Text style={[styles.cameraSubText, { color: themeColors.textExtraLight }]}>(TensorFlow.js integration would process live video here)</Text>
          </View>
        </Card>

        <Button
          title={isScanning ? "Scanning..." : attendanceAlreadyMarked ? "Already Marked" : "Scan Face for Attendance"}
          onPress={handleScanFace}
          loading={isScanning || faceEnrollmentLoading}
          disabled={isScanning || faceEnrollmentLoading || attendanceAlreadyMarked}
          variant="primary"
          style={styles.scanButton}
          icon={
            isScanning || attendanceAlreadyMarked ? undefined : (
              <Feather name="aperture" size={20} color={colors.card} style={styles.buttonIcon} />
            )
          }
        />

        {scanStatus && (
          <View
            style={[
              styles.statusContainer,
              { backgroundColor: themeColors.card, borderColor: themeColors.border },
              scanResult === "success" ? styles.successStatus : scanResult === "failure" ? styles.failureStatus : null,
            ]}
          >
            {isScanning && <ActivityIndicator size="small" color={themeColors.text} style={styles.statusIcon} />}
            {scanResult === "success" && (
              <Feather name="check-circle" size={20} color={colors.success} style={styles.statusIcon} />
            )}
            {scanResult === "failure" && (
              <Feather name="x-circle" size={20} color={colors.danger} style={styles.statusIcon} />
            )}
            <Text
              style={[
                styles.statusText,
                { color: themeColors.text },
                scanResult === "success" ? styles.successText : scanResult === "failure" ? styles.failureText : null,
              ]}
            >
              {scanStatus}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
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
    alignItems: "center",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyStateText: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold as any,
    textAlign: "center",
    marginTop: spacing.md,
  },
  emptyStateSubText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  description: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    marginBottom: spacing.xl,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  classNameText: {
    fontWeight: fonts.weights.bold as any,
    color: colors.primary,
  },
  infoCard: {
    width: "100%",
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  infoText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    flex: 1,
  },
  cameraCard: {
    width: "100%",
    aspectRatio: 16 / 9, // Standard video aspect ratio
    marginBottom: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden", // Ensures content stays within bounds
  },
  cameraPlaceholder: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: spacing.md,
  },
  cameraText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    marginTop: spacing.sm,
  },
  cameraSubText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    marginTop: spacing.xs,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  scanButton: {
    width: "80%",
    marginBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: spacing.sm,
    borderWidth: 1,
    width: "90%",
    justifyContent: "center",
  },
  statusIcon: {
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    textAlign: "center",
  },
  successStatus: {
    borderColor: colors.success,
    backgroundColor: colors.success + "15",
  },
  successText: {
    color: colors.success,
  },
  failureStatus: {
    borderColor: colors.danger,
    backgroundColor: colors.danger + "15",
  },
  failureText: {
    color: colors.danger,
  },
})