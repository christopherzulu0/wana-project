"use client"

import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import type { CameraType } from 'expo-camera'
import { Feather } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Header } from './Header'
import { Button } from './Button'
import { Card } from './Card'
import { colors } from '../constants/Colors'
import { fonts } from '../constants/fonts'
import { spacing } from '../constants/spacing'
// Face recognition utilities will be simulated for now

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

interface FaceEnrollmentProps {
  onComplete: (base64Image: string) => void
  onCancel: () => void
}

export function FaceEnrollment({ onComplete, onCancel }: FaceEnrollmentProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const [cameraType, setCameraType] = useState<CameraType>('front')
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureCount, setCaptureCount] = useState(0)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [faceDetected, setFaceDetected] = useState(false)
  
  const cameraRef = useRef<CameraView>(null)
  const capturedImages = useRef<string[]>([])

  const steps = [
    {
      title: "Position Your Face",
      description: "Look directly at the camera and position your face in the center of the frame",
      instruction: "Keep your face well-lit and avoid shadows"
    },
    {
      title: "Turn Slightly Left",
      description: "Turn your head about 15 degrees to the left while keeping your eyes on the camera",
      instruction: "This helps capture your profile from multiple angles"
    },
    {
      title: "Turn Slightly Right", 
      description: "Now turn your head about 15 degrees to the right",
      instruction: "Hold this position for a moment"
    },
    {
      title: "Look Straight Ahead",
      description: "Return to looking straight at the camera for the final capture",
      instruction: "Make sure your entire face is visible"
    }
  ]

  useEffect(() => {
    // No model loading needed - using Python backend for face recognition
    setModelLoaded(true)
  }, [])

  const allFaceEncodings = useRef<number[][]>([])

  const detectFaceInImage = async (imageUri: string): Promise<{ success: boolean; faceVisible: boolean; confidence?: number; encoding?: number[] }> => {
    try {
      // Simulate face detection with realistic behavior
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 85% chance of detecting a face
      const faceDetected = Math.random() > 0.15
      
      if (!faceDetected) {
        return { success: false, faceVisible: false }
      }
      
      // 90% chance that the detected face is clearly visible (not covered)
      const faceVisible = Math.random() > 0.1
      
      if (!faceVisible) {
        return { success: true, faceVisible: false }
      }
      
      // Generate a simulated face encoding (128 dimensions)
      const encoding = Array.from({ length: 128 }, () => Math.random() * 2 - 1)
      
      return {
        success: true,
        faceVisible: true,
        confidence: 0.88 + Math.random() * 0.1,
        encoding: encoding
      }
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

  const capturePhoto = async () => {
    if (!cameraRef.current || isCapturing) return

    setIsCapturing(true)
    setFaceDetected(false)

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      })

      if (!photo || !photo.base64) {
        Alert.alert('Error', 'Failed to capture image')
        setIsCapturing(false)
        return
      }

      // Show success feedback
      setFaceDetected(true)
      setCaptureCount(prev => prev + 1)
      
      // Store base64 image
      const base64Image = `data:image/jpeg;base64,${photo.base64}`
      capturedImages.current.push(base64Image)
      
      if (currentStep < steps.length - 1) {
        // Move to next step
        setTimeout(() => {
          setCurrentStep(prev => prev + 1)
          setFaceDetected(false)
        }, 1500)
      } else {
        // All captures complete - use the first capture (best quality, front-facing)
        // Backend Python service will handle face detection and encoding
        onComplete(capturedImages.current[0])
      }
    } catch (error) {
      console.error('Photo capture error:', error)
      Alert.alert('Error', 'Failed to capture photo')
    } finally {
      setIsCapturing(false)
    }
  }

  const averageFaceEncodings = (encodings: number[][]): number[] => {
    if (encodings.length === 0) return []
    if (encodings.length === 1) return encodings[0]
    
    const avgEncoding: number[] = []
    const length = encodings[0].length
    
    for (let i = 0; i < length; i++) {
      let sum = 0
      for (const encoding of encodings) {
        sum += encoding[i]
      }
      avgEncoding.push(sum / encodings.length)
    }
    
    return avgEncoding
  }

  const toggleCameraType = () => {
    setCameraType(current => 
      current === 'back' ? 'front' : 'back'
    )
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Face Enrollment" showBackButton />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Face Enrollment" showBackButton />
        <View style={styles.centerContainer}>
          <Feather name="camera-off" size={64} color={colors.textLight} />
          <Text style={styles.errorTitle}>Camera Access Required</Text>
          <Text style={styles.errorDescription}>
            Please grant camera permission to enroll your face for attendance.
          </Text>
          <Button
            title="Grant Permission"
            onPress={requestPermission}
            variant="primary"
            style={styles.permissionButton}
          />
        </View>
      </SafeAreaView>
    )
  }

  if (!modelLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Face Enrollment" showBackButton />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading face detection model...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Face Enrollment" showBackButton />
      
      <View style={styles.content}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {steps.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentStep + 1) / steps.length) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {/* Current step instructions */}
        {steps[currentStep] && (
          <Card variant="elevated" style={styles.instructionCard}>
            <Text style={styles.stepTitle}>{steps[currentStep].title}</Text>
            <Text style={styles.stepDescription}>{steps[currentStep].description}</Text>
            <Text style={styles.stepInstruction}>{steps[currentStep].instruction}</Text>
          </Card>
        )}

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
                  <Text style={styles.successText}>Face Captured!</Text>
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

        {/* Capture button */}
        <Button
          title={isCapturing ? "Capturing..." : "Capture Photo"}
          onPress={capturePhoto}
          loading={isCapturing}
          disabled={isCapturing}
          variant="primary"
          style={styles.captureButton}
          icon={
            isCapturing ? undefined : 
            <Feather name="camera" size={20} color={colors.card} style={styles.buttonIcon} />
          }
        />

        {/* Status text */}
        <Text style={styles.statusText}>
          Captured: {captureCount}/{steps.length} photos
        </Text>
      </View>
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
    padding: spacing.lg,
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
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  instructionCard: {
    marginBottom: spacing.lg,
  },
  stepTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  stepDescription: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  stepInstruction: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  cameraCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
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
  captureButton: {
    marginBottom: spacing.md,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
  },
})
