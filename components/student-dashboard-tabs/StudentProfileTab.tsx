"use client"

import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal } from "react-native"
import { useState, useMemo } from "react"
import { colors } from "../../constants/Colors"
import { fonts } from "../../constants/fonts"
import { spacing } from "../../constants/spacing"
import { useAuth } from "../../hooks/useAuth"
import { useFaceEnrollment } from "../../hooks/useFaceEnrollment"
import { Avatar } from "../Avatar"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { FaceEnrollment } from "../FaceEnrollment"
import { Card } from "../Card"
import { mockStudents } from "../../utils/mockData"
import { useColorScheme } from "../../hooks/useColorScheme"

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

export function StudentProfileTab() {
  const { user, logout } = useAuth()
  const { enrollFace, getFaceStatus, loading: faceLoading } = useFaceEnrollment()
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'
  
  const [showFaceEnrollment, setShowFaceEnrollment] = useState(false)
  const [faceEnrolled, setFaceEnrolled] = useState(false)
  
  // Find the logged-in student
  const student = mockStudents.find((s) => s.id === user?.id) || mockStudents[0]

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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout()
            router.replace('/student-login')
          },
        },
      ]
    )
  }

  const handleFaceEnrollmentComplete = async (base64Image: string) => {
    try {
      // base64Image is now the actual image, not an encoding
      // Send it to backend which will use Python for real face recognition
      const success = await enrollFace(student.id, base64Image)
      if (success) {
        setFaceEnrolled(true)
        setShowFaceEnrollment(false)
      }
    } catch (error) {
      console.error('Error saving face encoding:', error)
      Alert.alert('Error', 'Failed to save face enrollment. Please try again.')
    }
  }

  const handleFaceEnrollmentCancel = () => {
    setShowFaceEnrollment(false)
  }

  const profileItems = [
    {
      icon: 'user' as const,
      label: 'Full Name',
      value: user?.name || 'N/A',
    },
    {
      icon: 'mail' as const,
      label: 'Email',
      value: user?.email || 'N/A',
    },
    {
      icon: 'phone' as const,
      label: 'Phone',
      value: (user as any)?.phone || 'Not provided',
    },
    {
      icon: 'calendar' as const,
      label: 'Student ID',
      value: user?.id || 'N/A',
    },
  ]

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    userName: {
      fontSize: fonts.sizes.xl,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.bold as any,
      color: themeColors.text,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    userRole: {
      fontSize: fonts.sizes.md,
      fontFamily: fonts.regular,
      color: themeColors.text,
      backgroundColor: `${colors.primary}20`,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: spacing.lg,
    },
    sectionTitle: {
      fontSize: fonts.sizes.lg,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.semibold as any,
      color: themeColors.text,
      marginBottom: spacing.md,
    },
    profileItem: {
      backgroundColor: themeColors.card,
      borderRadius: spacing.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    profileItemLabel: {
      fontSize: fonts.sizes.sm,
      fontFamily: fonts.regular,
      color: themeColors.textLight,
      marginBottom: spacing.xs / 2,
    },
    profileItemValue: {
      fontSize: fonts.sizes.md,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.medium as any,
      color: themeColors.text,
    },
    actionItem: {
      backgroundColor: themeColors.card,
      borderRadius: spacing.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    actionItemLabel: {
      fontSize: fonts.sizes.md,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.medium as any,
      color: themeColors.text,
    },
  }), [themeColors])

  const actionItems = [
    {
      icon: faceEnrolled ? 'check-circle' as const : 'camera' as const,
      label: faceEnrolled ? 'Face Enrolled' : 'Enroll Face for Attendance',
      onPress: () => {
        if (faceEnrolled) {
          Alert.alert(
            'Face Already Enrolled',
            'You have already enrolled your face for attendance recognition. Would you like to re-enroll?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Re-enroll', onPress: () => setShowFaceEnrollment(true) }
            ]
          )
        } else {
          setShowFaceEnrollment(true)
        }
      },
      color: faceEnrolled ? colors.success : colors.primary,
    },
    {
      icon: 'edit' as const,
      label: 'Edit Profile',
      onPress: () => {
        Alert.alert('Coming Soon', 'Profile editing feature will be available soon!')
      },
      color: colors.primary,
    },
    {
      icon: 'settings' as const,
      label: 'Settings',
      onPress: () => {
        Alert.alert('Coming Soon', 'Settings feature will be available soon!')
      },
      color: colors.secondary,
    },
    {
      icon: 'help-circle' as const,
      label: 'Help & Support',
      onPress: () => {
        Alert.alert('Help & Support', 'For assistance, please contact your administrator or teacher.')
      },
      color: colors.primary,
    },
  ]

  return (
    <ScrollView style={dynamicStyles.container as any} contentContainerStyle={dynamicStyles.scrollContent as any}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Avatar 
          source={user?.avatar} 
          name={user?.name} 
          size={80} 
        />
        <Text style={dynamicStyles.userName as any}>{user?.name}</Text>
        <Text style={dynamicStyles.userRole as any}>Student</Text>
      </View>

      {/* Profile Information */}
      <View style={styles.section}>
        <Text style={dynamicStyles.sectionTitle as any}>Profile Information</Text>
        {profileItems.map((item, index) => (
          <View key={index} style={[styles.profileItemBase, dynamicStyles.profileItem] as any}>
            <View style={styles.profileItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name={item.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.profileItemContent}>
                <Text style={dynamicStyles.profileItemLabel as any}>{item.label}</Text>
                <Text style={dynamicStyles.profileItemValue as any}>{item.value}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={dynamicStyles.sectionTitle as any}>Actions</Text>
        {actionItems.map((item, index) => (
          <TouchableOpacity key={index} style={[styles.actionItemBase, dynamicStyles.actionItem] as any} onPress={item.onPress}>
            <View style={styles.actionItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                <Feather name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={dynamicStyles.actionItemLabel as any}>{item.label}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={themeColors.textLight} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={20} color={colors.card} />
          <Text style={styles.logoutButtonText as any}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Face Enrollment Modal */}
      <Modal
        visible={showFaceEnrollment}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <FaceEnrollment
          onComplete={handleFaceEnrollmentComplete}
          onCancel={handleFaceEnrollmentCancel}
        />
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  profileItemBase: {
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  profileItemContent: {
    flex: 1,
  },
  actionItemBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  actionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    borderRadius: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: colors.card,
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold as any,
    marginLeft: spacing.sm,
  },
})