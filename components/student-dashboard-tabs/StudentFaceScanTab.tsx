"use client"

import { Feather } from "@expo/vector-icons"
import { useState, useRef, useEffect } from "react"
import { ActivityIndicator, StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import type { CameraType } from "expo-camera"
import { Button } from "../../components/Button"
import { Card } from "../../components/Card"
import { colors } from "../../constants/Colors"
import { fonts } from "../../constants/fonts"
import { spacing } from "../../constants/spacing"
import { useAuth } from "../../hooks/useAuth"
import { useFaceEnrollment } from "../../hooks/useFaceEnrollment"
import { mockStudents } from "../../utils/mockData"
import { getToday } from "../../utils/dateUtils"

export function StudentFaceScanTab() {
  const { user } = useAuth()
  const { verifyFaceAndMarkAttendance } = useFaceEnrollment()
  const [permission, requestPermission] = useCameraPermissions()
  const [isScanning, setIsScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<"success" | "failure" | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [cameraType, setCameraType] = useState<CameraType>('front')
  
  const cameraRef = useRef<CameraView>(null)

  // Find the logged-in student
  const student = mockStudents.find((s) => s.id === user?.id) || mockStudents[0]

  useEffect(() => {
    // No model loading needed - Python backend handles face recognition
    setModelLoaded(true)
  }, [])


  const detectAndMatchFace = async () => {
    if (!cameraRef.current || isScanning) return

    setIsScanning(true)
    setScanStatus("Capturing your face...")
    setScanResult(null)
    setFaceDetected(false)

    try {
      // Take a photo with base64
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      })

      if (!photo || !photo.base64) {
        setScanStatus("Failed to capture photo. Please try again.")
        setScanResult("failure")
        setIsScanning(false)
        return
      }

      const base64Image = `data:image/jpeg;base64,${photo.base64}`
      
      setScanStatus("Verifying your identity with Python AI...")
      
      // Get student's class (for demonstration, using first class)
      // In production, you'd select the current class
      const classId = student.classId || student.class?.id || '1'
      
      console.log('Student ID:', student.id, 'Type:', typeof student.id)
      console.log('Class ID:', classId, 'Type:', typeof classId)
      console.log('Image length:', base64Image.length)
      
      // Call backend API which uses Python for REAL face verification
      const result = await verifyFaceAndMarkAttendance(
        student.id,
        classId,
        base64Image
      )
      
      if (result.success) {
        setFaceDetected(true)
        setScanStatus(`✓ Face verified! Attendance marked. (Match: ${result.similarity}%)`)
        setScanResult("success")
        Alert.alert(
          'Success!',
          `Your face was verified and attendance has been marked!\n\nSimilarity: ${result.similarity}%`
        )
      } else {
        setScanStatus(result.message || "Face not recognized")
        setScanResult("failure")
        // Alert already shown in hook
      }
      
    } catch (error) {
      console.error('Face scan error:', error)
      setScanStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setScanResult("failure")
    } finally {
      setIsScanning(false)
    }
  }

  const toggleCameraType = () => {
    setCameraType(current => 
      current === 'back' ? 'front' : 'back'
    )
  }

  if (!permission) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </ScrollView>
    )
  }

  if (!permission.granted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.centerContainer}>
          <Feather name="camera-off" size={64} color={colors.textLight} />
          <Text style={styles.errorTitle}>Camera Access Required</Text>
          <Text style={styles.errorDescription}>
            Please grant camera permission to use face recognition for attendance.
          </Text>
          <Button
            title="Grant Permission"
            onPress={requestPermission}
            variant="primary"
            style={styles.permissionButton}
          />
        </View>
      </ScrollView>
    )
  }

  if (!modelLoaded) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading face detection model...</Text>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.sectionTitle}>Mark Attendance with Face Scan</Text>
      <Text style={styles.description}>
        Position your face clearly in the camera frame to mark your attendance for today.
      </Text>

      {/* Camera view */}
      <Card variant="elevated" style={styles.cameraCard}>
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing={cameraType}
            ref={cameraRef}
          />
          
          {/* Face detection overlay - positioned absolutely on top */}
          <View style={styles.overlay}>
            <View style={styles.faceGuide}>
              <View style={styles.faceGuideCorner} />
              <View style={[styles.faceGuideCorner, styles.topRight]} />
              <View style={[styles.faceGuideCorner, styles.bottomLeft]} />
              <View style={[styles.faceGuideCorner, styles.bottomRight]} />
            </View>
            
            {faceDetected && (
              <View style={styles.successOverlay}>
                <Feather name="check-circle" size={48} color={colors.success} />
                <Text style={styles.successText}>Face Detected!</Text>
              </View>
            )}
          </View>
          
          {/* Camera controls */}
          <View style={styles.cameraControls}>
            <TouchableOpacity 
              style={styles.flipButton}
              onPress={toggleCameraType}
            >
              <Feather name="rotate-cw" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Scan button */}
      <Button
        title={isScanning ? "Scanning..." : "Scan Face for Attendance"}
        onPress={detectAndMatchFace}
        loading={isScanning}
        disabled={isScanning}
        variant="primary"
        style={styles.scanButton}
        icon={
          isScanning ? undefined : <Feather name="aperture" size={20} color={colors.card} style={styles.buttonIcon} />
        }
      />

      {/* Status display */}
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

      {/* Help text */}
      <Card variant="outlined" style={styles.helpCard}>
        <View style={styles.helpHeader}>
          <Feather name="help-circle" size={20} color={colors.primary} />
          <Text style={styles.helpTitle}>Tips for better recognition</Text>
        </View>
        <Text style={styles.helpText}>
          • Ensure good lighting on your face{'\n'}
          • Look directly at the camera{'\n'}
          • Remove sunglasses or face masks{'\n'}
          • Keep your face centered in the frame
        </Text>
      </Card>
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
    paddingBottom: spacing.xxl,
    alignItems: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  description: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.xl,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  cameraCard: {
    width: "100%",
    aspectRatio: 4 / 3,
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  cameraContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuide: {
    width: 200,
    height: 250,
    position: 'relative',
  },
  faceGuideCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.primary,
    borderWidth: 3,
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    top: 'auto',
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: 'bold',
    color: colors.success,
    marginTop: spacing.sm,
  },
  cameraControls: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
  },
  flipButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    padding: spacing.sm,
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
  helpCard: {
    width: "90%",
    marginTop: spacing.md,
  },
  helpHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  helpTitle: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  helpText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    lineHeight: 20,
  },
})
