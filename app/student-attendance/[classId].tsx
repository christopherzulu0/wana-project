"use client"

import { Feather } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState } from "react"
import { ActivityIndicator, StyleSheet, Text, View, ScrollView } from "react-native"
import { Button } from "../../components/Button"
import { Card } from "../../components/Card"
import { Header } from "../../components/Header"
import { StatusBar } from "../../components/StatusBar"
import { colors } from "../../constants/Colors"
import { fonts } from "../../constants/fonts"
import { spacing } from "../../constants/spacing"
import { useAttendance } from "../../hooks/useAttendance"
import { useAuth } from "../../hooks/useAuth"
import { useClasses } from "../../hooks/useClasses"
import { mockStudents } from "../../utils/mockData" // For mock student data
import { getToday } from "../../utils/dateUtils"

export default function StudentFaceScanScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { getClass } = useClasses()
  const { markAttendance } = useAttendance()

  const [isScanning, setIsScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<"success" | "failure" | null>(null)

  const classItem = classId ? getClass(classId) : null

  // Find the logged-in student from mock data (conceptual for demo)
  const student = mockStudents.find((s) => s.id === user?.id) || mockStudents[0] // Fallback

  const handleScanFace = () => {
    if (!student || !classItem || !user) {
      setScanStatus("Error: Student or class data missing.")
      setScanResult("failure")
      return
    }

    setIsScanning(true)
    setScanStatus("Scanning your face...")
    setScanResult(null)

    // Simulate a machine learning process
    setTimeout(() => {
      const success = Math.random() > 0.3 // 70% chance of success
      if (success) {
        // Mark attendance for the logged-in student in this class
        markAttendance(student, "present", getToday(), user.id)
        setScanStatus("Attendance marked successfully!")
        setScanResult("success")
      } else {
        setScanStatus("Face not recognized. Please try again.")
        setScanResult("failure")
      }
      setIsScanning(false)
    }, 3000) // Simulate 3-second scanning time
  }

  if (!classItem) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar />
        <Header title="Mark Attendance" showBackButton />
        <View style={styles.emptyStateContainer}>
          <Feather name="alert-circle" size={48} color={colors.textLight} />
          <Text style={styles.emptyStateText}>Class not found.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <Header title={`Mark Attendance for ${classItem.name}`} showBackButton />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.description}>
          Position your face clearly in the camera frame to mark your attendance for{" "}
          <Text style={styles.classNameText}>
            {classItem.name} ({classItem.section})
          </Text>
          .
        </Text>

        <Card variant="elevated" style={styles.cameraCard}>
          <View style={styles.cameraPlaceholder}>
            <Feather name="camera" size={60} color={colors.textExtraLight} />
            <Text style={styles.cameraText}>Camera Feed Placeholder</Text>
            <Text style={styles.cameraSubText}>(TensorFlow.js integration would process live video here)</Text>
          </View>
        </Card>

        <Button
          title={isScanning ? "Scanning..." : "Scan Face for Attendance"}
          onPress={handleScanFace}
          loading={isScanning}
          disabled={isScanning}
          variant="primary"
          style={styles.scanButton}
          icon={
            isScanning ? undefined : <Feather name="aperture" size={20} color={colors.card} style={styles.buttonIcon} />
          }
        />

        {scanStatus && (
          <View
            style={[
              styles.statusContainer,
              scanResult === "success" ? styles.successStatus : scanResult === "failure" ? styles.failureStatus : null,
            ]}
          >
            {isScanning && <ActivityIndicator size="small" color={colors.text} style={styles.statusIcon} />}
            {scanResult === "success" && (
              <Feather name="check-circle" size={20} color={colors.success} style={styles.statusIcon} />
            )}
            {scanResult === "failure" && (
              <Feather name="x-circle" size={20} color={colors.danger} style={styles.statusIcon} />
            )}
            <Text
              style={[
                styles.statusText,
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
    backgroundColor: colors.background,
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
    fontWeight: fonts.weights.bold,
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.md,
  },
  description: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.xl,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  classNameText: {
    fontWeight: fonts.weights.bold,
    color: colors.primary,
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
    backgroundColor: colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: spacing.md,
  },
  cameraText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  cameraSubText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    color: colors.textExtraLight,
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    width: "90%",
    justifyContent: "center",
  },
  statusIcon: {
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.text,
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
