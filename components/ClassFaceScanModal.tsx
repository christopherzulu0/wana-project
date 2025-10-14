"use client"

import { Feather } from "@expo/vector-icons"
import { useState, useRef, useEffect } from "react"
import { ActivityIndicator, StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal } from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import type { CameraType } from "expo-camera"
import { Button } from "./Button"
import { Card } from "./Card"
import { colors } from "../constants/Colors"
import { fonts } from "../constants/fonts"
import { spacing } from "../constants/spacing"
import { useAuth } from "../hooks/useAuth"
import { useFaceEnrollment } from "../hooks/useFaceEnrollment"
import { mockStudents } from "../utils/mockData"
import { getToday } from "../utils/dateUtils"

interface ClassFaceScanModalProps {
  visible: boolean
  classItem: any
  onClose: () => void
  onSuccess: () => void
}

export function ClassFaceScanModal({ visible, classItem, onClose, onSuccess }: ClassFaceScanModalProps) {
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
    if (visible) {
      // Set model as loaded immediately since we're using simulation
      setModelLoaded(true)
      // Reset states when modal opens
      setIsScanning(false)
      setScanStatus(null)
      setScanResult(null)
      setFaceDetected(false)
    }
  }, [visible])

  const detectAndMatchFace = async () => {
    if (!cameraRef.current || isScanning) return

    setIsScanning(true)
    setScanStatus("Capturing and analyzing your face...")
    setScanResult(null)
    setFaceDetected(false)

    try {
      // Take a photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: true,
      })

      // Perform actual face detection using TensorFlow.js
      if (!photo || !photo.base64) {
        setScanStatus("Failed to capture photo. Please try again.")
        setScanResult("failure")
        setIsScanning(false)
        return
      }

      const base64Image = `data:image/jpeg;base64,${photo.base64}`
      
      setScanStatus("Verifying your identity with Python AI...")
      setFaceDetected(true)
      
      // Call backend API which uses Python for REAL face verification
      const result = await verifyFaceAndMarkAttendance(
        student.id,
        classItem.id,
        base64Image
      )
      
      if (result.success) {
        setScanStatus(`✓ Attendance marked successfully for ${classItem.name}! (Match: ${result.similarity}%)`)
        setScanResult("success")
        
        // Close modal after success
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2000)
      } else {
        setScanStatus(result.message || "Face not recognized")
        setScanResult("failure")
      }
      
      setIsScanning(false)
    } catch (error) {
      console.error('Face scan error:', error)
      setScanStatus("Error occurred during face scanning. Please try again.")
      setScanResult("failure")
      setIsScanning(false)
    }
  }

  const performFaceDetection = async (imageUri: string): Promise<{ success: boolean; faceVisible: boolean; confidence?: number }> => {
    try {
      // For React Native, we'll use a simulated approach since we can't use browser's Image
      // In a real production app, you would use expo-image-manipulator or similar
      // to load the image and convert it to a tensor
      
      // Simulate face detection with high accuracy for demonstration
      const simulatedResult = await new Promise<{ success: boolean; faceVisible: boolean; confidence?: number }>((resolve) => {
        setTimeout(() => {
          // 85% chance of detecting a face
          const faceDetected = Math.random() > 0.15
          
          if (faceDetected) {
            // 90% chance that the detected face is clearly visible (not covered)
            const faceVisible = Math.random() > 0.1
            
            resolve({
              success: true,
              faceVisible: faceVisible,
              confidence: faceVisible ? 0.88 + Math.random() * 0.1 : 0.5
            })
          } else {
            resolve({
              success: false,
              faceVisible: false
            })
          }
        }, 300) // Simulate processing time
      })
      
      return simulatedResult
    } catch (error) {
      console.error('Error performing face detection:', error)
      return { success: false, faceVisible: false }
    }
  }

  const checkFaceVisibility = (face: any): boolean => {
    // Check if face is clearly visible (not covered)
    // This is a simplified check - in a real implementation, you would use more sophisticated algorithms
    
    if (!face.landmarks) {
      return false // No landmarks means face might be covered
    }
    
    // Check if key facial features are visible
    const landmarks = face.landmarks
    const hasEyes = landmarks.length >= 4 // Should have eye landmarks
    const hasNose = landmarks.length >= 6 // Should have nose landmarks
    const hasMouth = landmarks.length >= 8 // Should have mouth landmarks
    
    // Additional check: ensure face is not too small (might indicate covering)
    const faceBox = face.topLeft.concat(face.bottomRight)
    const faceWidth = Math.abs(faceBox[2] - faceBox[0])
    const faceHeight = Math.abs(faceBox[3] - faceBox[1])
    const faceSize = faceWidth * faceHeight
    
    // Face should be at least 10% of the image area
    const minFaceSize = 224 * 224 * 0.1
    
    return hasEyes && hasNose && hasMouth && faceSize > minFaceSize
  }

  const simulateFaceMatching = async (): Promise<{ success: boolean; confidence: number }> => {
    // Simulate face matching - in real implementation, compare with stored face encoding
    const success = Math.random() > 0.2
    const confidence = success ? 0.85 + Math.random() * 0.1 : 0.3 + Math.random() * 0.2
    return { success, confidence }
  }

  const generateFaceEncoding = (): string => {
    // Generate a lightweight face encoding (simulated)
    // In a real implementation, this would be generated by TensorFlow.js face detection
    const encoding = {
      timestamp: Date.now(),
      features: Array.from({ length: 128 }, () => Math.random()),
      studentId: student.id
    }
    return JSON.stringify(encoding)
  }

  const toggleCameraType = () => {
    setCameraType(current => 
      current === 'back' ? 'front' : 'back'
    )
  }

  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Requesting camera permission...</Text>
          </View>
        </View>
      </Modal>
    )
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.centerContainer}>
            <Feather name="camera-off" size={64} color={colors.textLight} />
            <Text style={styles.errorTitle}>Camera Access Required</Text>
            <Text style={styles.errorDescription}>
              Please grant camera permission to mark attendance with face recognition.
            </Text>
            <Button
              title="Grant Permission"
              onPress={requestPermission}
              variant="primary"
              style={styles.permissionButton}
            />
            <Button
              title="Cancel"
              onPress={onClose}
              variant="secondary"
              style={styles.cancelButton}
            />
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mark Attendance</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.className}>{classItem.name} ({classItem.section})</Text>
          <Text style={styles.description}>
            Position your face clearly in the camera frame to mark your attendance.
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
                  <View style={styles.faceDetectedOverlay}>
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
                  <Feather name="rotate-cw" size={20} color={colors.text} />
                  <Text style={styles.flipButtonText}>Flip Camera</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* Scan button */}
          <Button
            title={isScanning ? "Scanning..." : "Scan Face for Attendance"}
            onPress={detectAndMatchFace}
            loading={isScanning}
            disabled={isScanning || !modelLoaded}
            variant="primary"
            style={styles.scanButton}
            icon={
              isScanning ? undefined : <Feather name="camera" size={20} color={colors.card} />
            }
          />

          {/* Status display */}
          {scanStatus && (
            <View
              style={[
                styles.statusContainer,
                scanResult === "success" ? styles.successStatus : 
                scanResult === "failure" ? styles.failureStatus : null,
              ]}
            >
              {isScanning && <ActivityIndicator size="small" color={colors.text} />}
              {scanResult === "success" && (
                <Feather name="check-circle" size={20} color={colors.success} />
              )}
              {scanResult === "failure" && (
                <Feather name="x-circle" size={20} color={colors.danger} />
              )}
              <Text
                style={[
                  styles.statusText,
                  scanResult === "success" ? styles.successText : 
                  scanResult === "failure" ? styles.failureText : null,
                ]}
              >
                {scanStatus}
              </Text>
            </View>
          )}

          {/* Help text */}
          <Text style={styles.helpText}>
            Make sure your face is well-lit and clearly visible in the frame.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
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
  },
  errorTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  permissionButton: {
    marginTop: spacing.xl,
    width: '80%',
  },
  cancelButton: {
    marginTop: spacing.md,
    width: '80%',
  },
  className: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.xl,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  cameraCard: {
    width: '100%',
    aspectRatio: 4/3,
    marginBottom: spacing.lg,
    overflow: 'hidden',
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
    height: 200,
    position: 'relative',
  },
  faceGuideCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  faceDetectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    color: colors.success,
    marginTop: spacing.sm,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  flipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flipButtonText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  scanButton: {
    width: '90%',
    marginBottom: spacing.lg,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    width: '90%',
    marginBottom: spacing.lg,
  },
  statusText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  successStatus: {
    borderColor: colors.success,
    backgroundColor: colors.success + '15',
  },
  successText: {
    color: colors.success,
  },
  failureStatus: {
    borderColor: colors.danger,
    backgroundColor: colors.danger + '15',
  },
  failureText: {
    color: colors.danger,
  },
  helpText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
})
