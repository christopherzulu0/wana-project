"use client"

import { StyleSheet, View, FlatList, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native"
import { colors } from "../../constants/Colors"
import { spacing } from "../../constants/spacing"
import { ClassCard } from "../ClassCard"
import { fonts } from "../../constants/fonts"
import { useAuth } from "../../hooks/useAuth"
import { useStudentEnrollment } from "../../hooks/useStudentEnrollment"
import { EmptyState } from "../EmptyState"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState, useEffect, useCallback, useMemo } from "react"
import { ClassFaceScanModal } from "../ClassFaceScanModal"
import { useColorScheme } from "../../hooks/useColorScheme"

const API_BASE_URL = 'https://attendance-records-wana.vercel.app'

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

export function StudentClassesTab() {
  const { user } = useAuth()
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'

  const [activeTab, setActiveTab] = useState<'enrolled' | 'available'>('enrolled')
  const [showFaceScanModal, setShowFaceScanModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [attendanceStatusMap, setAttendanceStatusMap] = useState<Record<string, boolean>>({})
  const [checkingAttendance, setCheckingAttendance] = useState(false)
  const [requestStatusMap, setRequestStatusMap] = useState<Record<string, { status: string; requestId?: string }>>({})
  const [requestingPermission, setRequestingPermission] = useState<string | null>(null)
  const {
    enrolledClasses,
    availableClasses,
    loading,
    error,
    enrollInClass,
    unenrollFromClass,
    isEnrolledInClass,
    getAvailableForEnrollment,
    fetchEnrolledClasses,
  } = useStudentEnrollment()

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

  // Fetch student ID
  useEffect(() => {
    const fetchStudentId = async () => {
      if (!user?.id || user.role !== 'student') return

      try {
        const response = await fetch(`${API_BASE_URL}/api/students/by-user/${user.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.student?.id) {
            setStudentId(data.student.id.toString())
          }
        }
      } catch (err) {
        console.error('Error fetching student ID:', err)
      }
    }

    fetchStudentId()
  }, [user?.id, user?.role])

  // Check attendance status for today for all enrolled classes
  const checkAttendanceForToday = useCallback(async () => {
    if (!studentId || enrolledClasses.length === 0) return

    setCheckingAttendance(true)
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const statusMap: Record<string, boolean> = {}

    try {
      // Fetch today's attendance for the student
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      const response = await fetch(
        `${API_BASE_URL}/api/students/${studentId}/attendance?month=${currentMonth}&year=${currentYear}`
      )

      if (response.ok) {
        const data = await response.json()
        const todayAttendance = data.attendance || []

        // Check for each enrolled class if attendance is marked for today
        enrolledClasses.forEach((classItem) => {
          const hasAttendance = todayAttendance.some(
            (record: any) => record.date === today &&
              (record.classId === classItem.id || record.className === classItem.name)
          )
          statusMap[classItem.id] = hasAttendance
        })
      }

      setAttendanceStatusMap(statusMap)
    } catch (err) {
      console.error('Error checking attendance status:', err)
    } finally {
      setCheckingAttendance(false)
    }
  }, [studentId, enrolledClasses])

  // Check attendance status when student ID or enrolled classes change
  useEffect(() => {
    if (studentId && enrolledClasses.length > 0) {
      checkAttendanceForToday()
      checkRequestStatus()
    }
  }, [studentId, enrolledClasses, checkAttendanceForToday])

  // Check attendance request status for all enrolled classes
  const checkRequestStatus = useCallback(async () => {
    if (!studentId || enrolledClasses.length === 0) return

    const statusMap: Record<string, { status: string; requestId?: string }> = {}

    try {
      // Check permission for each enrolled class
      for (const classItem of enrolledClasses) {
        const response = await fetch(
          `${API_BASE_URL}/api/attendance-requests/check/${studentId}/${classItem.id}`
        )

        if (response.ok) {
          const data = await response.json()
          if (data.hasPermission) {
            statusMap[classItem.id] = { status: 'approved', requestId: data.request?.id }
          } else if (data.status === 'pending') {
            statusMap[classItem.id] = { status: 'pending', requestId: data.request?.id }
          } else {
            statusMap[classItem.id] = { status: 'none' }
          }
        }
      }

      setRequestStatusMap(statusMap)
    } catch (err) {
      console.error('Error checking request status:', err)
    }
  }, [studentId, enrolledClasses])

  // Request attendance permission
  const requestAttendancePermission = async (classItem: any) => {
    if (!studentId) return

    setRequestingPermission(classItem.id)

    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: studentId,
          classId: classItem.id,
          reason: `Request to mark attendance for ${classItem.name}`,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        Alert.alert(
          'Request Submitted',
          `Your attendance request for ${classItem.name} has been submitted. Please wait for teacher approval.`,
          [{ text: 'OK' }]
        )
        // Update request status
        setRequestStatusMap(prev => ({
          ...prev,
          [classItem.id]: { status: 'pending', requestId: data.request.id }
        }))
      } else {
        const errorData = await response.json()
        Alert.alert('Error', errorData.error || 'Failed to submit request')
      }
    } catch (err) {
      console.error('Error requesting permission:', err)
      Alert.alert('Error', 'Network error occurred while submitting request')
    } finally {
      setRequestingPermission(null)
    }
  }

  const handleEnroll = async (classId: string, className: string) => {
    Alert.alert(
      'Enroll in Class',
      `Are you sure you want to enroll in ${className}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enroll',
          onPress: async () => {
            const success = await enrollInClass(classId)
            if (success) {
              Alert.alert('Success', 'You have been enrolled in the class!')
            } else {
              Alert.alert('Error', error || 'Failed to enroll in class')
            }
          },
        },
      ]
    )
  }

  const handleUnenroll = async (classId: string, className: string) => {
    Alert.alert(
      'Unenroll from Class',
      `Are you sure you want to unenroll from ${className}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unenroll',
          style: 'destructive',
          onPress: async () => {
            const success = await unenrollFromClass(classId)
            if (success) {
              Alert.alert('Success', 'You have been unenrolled from the class!')
            } else {
              Alert.alert('Error', error || 'Failed to unenroll from class')
            }
          },
        },
      ]
    )
  }

  const handleMarkAttendance = (classItem: any) => {
    // Check if attendance is already marked for today
    if (attendanceStatusMap[classItem.id]) {
      Alert.alert(
        'Attendance Already Marked',
        `You have already marked your attendance for ${classItem.name} today.`,
        [{ text: 'OK' }]
      )
      return
    }

    // Check request status
    const requestStatus = requestStatusMap[classItem.id]

    if (!requestStatus || requestStatus.status === 'none') {
      // No request exists - prompt to request permission
      Alert.alert(
        'Permission Required',
        `You need to request permission from your teacher before marking attendance for ${classItem.name}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Request Permission',
            onPress: () => requestAttendancePermission(classItem)
          }
        ]
      )
      return
    }

    if (requestStatus.status === 'pending') {
      Alert.alert(
        'Request Pending',
        `Your attendance request for ${classItem.name} is pending teacher approval. Please wait for approval before marking attendance.`,
        [{ text: 'OK' }]
      )
      return
    }

    if (requestStatus.status === 'approved') {
      // Permission granted - proceed to face scan
      setSelectedClass(classItem)
      setShowFaceScanModal(true)
    } else {
      // Rejected or other status
      Alert.alert(
        'Permission Required',
        `Your previous request was not approved. Would you like to request permission again?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Request Again',
            onPress: () => requestAttendancePermission(classItem)
          }
        ]
      )
    }
  }

  const handleFaceScanSuccess = () => {
    Alert.alert('Success', `Attendance marked successfully for ${selectedClass?.name}!`)
    // Update attendance status for this class
    if (selectedClass) {
      setAttendanceStatusMap(prev => ({
        ...prev,
        [selectedClass.id]: true
      }))
    }
  }

  const handleFaceScanClose = () => {
    setShowFaceScanModal(false)
    setSelectedClass(null)
  }

  const renderEnrolledClassItem = ({ item }: { item: any }) => {
    const isAttendanceMarked = attendanceStatusMap[item.id] || false
    const requestStatus = requestStatusMap[item.id]
    const isRequestPending = requestStatus?.status === 'pending'
    const hasPermission = requestStatus?.status === 'approved'
    const needsRequest = !requestStatus || requestStatus.status === 'none'

    return (
      <View style={styles.classItemWrapper}>
        <View style={[styles.classCardWrapper, dynamicStyles.classCardWrapper]}>
          <ClassCard classItem={item} />
          {isAttendanceMarked && (
            <View style={[styles.attendanceStatusBanner, dynamicStyles.attendanceStatusBanner]}>
              <Feather name="check-circle" size={14} color={colors.success} />
              <Text style={[styles.attendanceStatusText, dynamicStyles.attendanceStatusText]}>
                Attendance Marked Today
              </Text>
            </View>
          )}
          {!isAttendanceMarked && isRequestPending && (
            <View style={[styles.requestStatusBanner, dynamicStyles.requestStatusBanner]}>
              <Feather name="clock" size={14} color={colors.warning} />
              <Text style={[styles.requestStatusText, dynamicStyles.requestStatusText]}>
                Request Pending Approval
              </Text>
            </View>
          )}
          {!isAttendanceMarked && hasPermission && (
            <View style={[styles.permissionBanner, dynamicStyles.permissionBanner]}>
              <Feather name="shield" size={14} color={colors.primary} />
              <Text style={[styles.permissionText, dynamicStyles.permissionText]}>
                Permission Granted
              </Text>
            </View>
          )}
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.markAttendanceButton,
              isAttendanceMarked && styles.markAttendanceButtonDisabled,
              isRequestPending && styles.markAttendanceButtonPending,
              needsRequest && styles.markAttendanceButtonRequest,
              dynamicStyles.markAttendanceButton
            ]}
            onPress={() => handleMarkAttendance(item)}
            disabled={isAttendanceMarked || checkingAttendance || requestingPermission === item.id}
            activeOpacity={0.8}
          >
            <View style={[
              styles.buttonIconWrapper,
              isAttendanceMarked && styles.buttonIconWrapperSuccess,
              isRequestPending && styles.buttonIconWrapperWarning
            ]}>
              <Feather
                name={
                  isAttendanceMarked ? "check-circle" :
                    isRequestPending ? "clock" :
                      needsRequest ? "send" :
                        "camera"
                }
                size={16}
                color={
                  isAttendanceMarked ? colors.success :
                    isRequestPending ? colors.warning :
                      needsRequest ? colors.primary :
                        colors.card
                }
              />
            </View>
            <Text style={[
              styles.markAttendanceButtonText,
              isAttendanceMarked && styles.markAttendanceButtonTextDisabled
            ] as any}>
              {isAttendanceMarked ? "Already Marked" :
                isRequestPending ? "Pending Approval" :
                  needsRequest ? "Request Permission" :
                    "Mark Attendance"}
            </Text>
            {isAttendanceMarked && (
              <View style={styles.successBadge}>
                <Feather name="check" size={8} color={colors.success} />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unenrollButton, dynamicStyles.unenrollButton]}
            onPress={() => handleUnenroll(item.id, item.name)}
            activeOpacity={0.8}
          >
            <View style={[styles.buttonIconWrapper, styles.buttonIconWrapperDanger]}>
              <Feather name="user-minus" size={16} color={colors.danger} />
            </View>
            <Text style={[styles.unenrollButtonText, dynamicStyles.unenrollButtonText]}>Unenroll</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderAvailableClassItem = ({ item }: { item: any }) => (
    <View style={styles.classItemWrapper}>
      <View style={[styles.classCardWrapper, dynamicStyles.classCardWrapper]}>
        <ClassCard classItem={item} />
        <View style={[styles.newClassBadge, dynamicStyles.newClassBadge]}>
          <Feather name="star" size={12} color={colors.success} />
          <Text style={[styles.newClassBadgeText, dynamicStyles.newClassBadgeText]}>New</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.enrollButton, dynamicStyles.enrollButton]}
        onPress={() => handleEnroll(item.id, item.name)}
        activeOpacity={0.8}
      >
        <View style={[styles.buttonIconWrapper, styles.buttonIconWrapperSuccess]}>
          <Feather name="user-plus" size={16} color={colors.card} />
        </View>
        <Text style={styles.enrollButtonText as any}>Enroll Now</Text>
        <View style={styles.enrollArrowContainer}>
          <Feather name="arrow-right" size={14} color={colors.card} />
        </View>
      </TouchableOpacity>
    </View>
  )

  const renderEmptyEnrolled = () => (
    <EmptyState
      title="No Enrolled Classes"
      message="You are not currently enrolled in any classes. Check the Available tab to enroll in classes."
      icon="book"
    />
  )

  const renderEmptyAvailable = () => (
    <EmptyState
      title="No Available Classes"
      message="There are no classes available for enrollment at the moment."
      icon="search"
    />
  )

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    headerSection: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.borderLight,
    },
    headerIconContainer: {
      backgroundColor: isDark ? `${colors.primary}20` : `${colors.primary}15`,
      borderColor: isDark ? `${colors.primary}40` : `${colors.primary}30`,
    },
    headerTitle: {
      fontSize: fonts.sizes.xxl,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.bold as any,
      color: themeColors.text,
      marginBottom: spacing.xs / 2,
    },
    headerSubtitle: {
      fontSize: fonts.sizes.sm,
      fontFamily: fonts.regular,
      color: themeColors.textLight,
    },
    headerBadge: {
      backgroundColor: isDark ? `${colors.success}20` : `${colors.success}15`,
      borderColor: isDark ? `${colors.success}40` : `${colors.success}30`,
    },
    headerBadgeText: {
      color: colors.success,
    },
    classCardWrapper: {
      borderWidth: 1,
      borderColor: themeColors.borderLight,
      borderRadius: spacing.lg,
      overflow: 'hidden' as const,
    },
    attendanceStatusBanner: {
      backgroundColor: isDark ? `${colors.success}20` : `${colors.success}15`,
      borderTopColor: isDark ? `${colors.success}40` : `${colors.success}30`,
    },
    attendanceStatusText: {
      color: colors.success,
    },
    newClassBadge: {
      backgroundColor: isDark ? `${colors.success}20` : `${colors.success}15`,
      borderColor: isDark ? `${colors.success}40` : `${colors.success}30`,
    },
    newClassBadgeText: {
      color: colors.success,
    },
    requestStatusBanner: {
      backgroundColor: isDark ? `${colors.warning}20` : `${colors.warning}15`,
      borderTopColor: isDark ? `${colors.warning}40` : `${colors.warning}30`,
    },
    requestStatusText: {
      color: colors.warning,
    },
    permissionBanner: {
      backgroundColor: isDark ? `${colors.primary}20` : `${colors.primary}15`,
      borderTopColor: isDark ? `${colors.primary}40` : `${colors.primary}30`,
    },
    permissionText: {
      color: colors.primary,
    },
    loadingText: {
      fontSize: fonts.sizes.md,
      fontFamily: fonts.regular,
      color: themeColors.textLight,
      marginTop: spacing.md,
    },
    tabContainer: {
      backgroundColor: themeColors.card,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
      shadowColor: isDark ? "#000" : "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
    tabText: {
      fontSize: fonts.sizes.md,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.medium as any,
      color: themeColors.textLight,
    },
    activeTabText: {
      color: colors.card,
      fontWeight: fonts.weights.semibold as any,
    },
    errorContainer: {
      backgroundColor: colors.danger + '15',
      borderLeftWidth: 4,
      borderLeftColor: colors.danger,
    },
    errorText: {
      color: colors.danger,
      fontSize: fonts.sizes.sm,
      fontFamily: fonts.regular,
      flex: 1,
    },
    unenrollButton: {
      backgroundColor: themeColors.card,
      borderColor: colors.danger,
    },
    unenrollButtonText: {
      color: colors.danger,
    },
    markAttendanceButton: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    enrollButton: {
      shadowColor: colors.success,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
  }), [themeColors, isDark])

  if (loading) {
    return (
      <View style={[dynamicStyles.container, styles.centered]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={dynamicStyles.loadingText}>Loading classes...</Text>
        </View>
      </View>
    )
  }

  const currentData = activeTab === 'enrolled' ? enrolledClasses : getAvailableForEnrollment()
  const renderItem = activeTab === 'enrolled' ? renderEnrolledClassItem : renderAvailableClassItem
  const emptyComponent = activeTab === 'enrolled' ? renderEmptyEnrolled : renderEmptyAvailable

  return (
    <View style={dynamicStyles.container}>
      {/* Header Section */}
      <View style={[dynamicStyles.headerSection, styles.headerSection]}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIconContainer, dynamicStyles.headerIconContainer]}>
            <Feather name="book-open" size={24} color={colors.primary} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={dynamicStyles.headerTitle}>My Classes</Text>
            <Text style={dynamicStyles.headerSubtitle}>
              {activeTab === 'enrolled'
                ? `Manage your ${enrolledClasses.length} enrolled ${enrolledClasses.length === 1 ? 'class' : 'classes'}`
                : `Discover ${getAvailableForEnrollment().length} available ${getAvailableForEnrollment().length === 1 ? 'class' : 'classes'}`
              }
            </Text>
          </View>
        </View>
        {activeTab === 'enrolled' && enrolledClasses.length > 0 && (
          <View style={[styles.headerBadge, dynamicStyles.headerBadge]}>
            <Feather name="check-circle" size={14} color={colors.success} />
            <Text style={[styles.headerBadgeText, dynamicStyles.headerBadgeText]}>
              {Object.values(attendanceStatusMap).filter(Boolean).length}/{enrolledClasses.length} Marked
            </Text>
          </View>
        )}
      </View>

      {/* Tab Selector */}
      <View style={[styles.tabContainer, dynamicStyles.tabContainer]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'enrolled' && styles.activeTab]}
          onPress={() => setActiveTab('enrolled')}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            <Feather
              name="book-open"
              size={16}
              color={activeTab === 'enrolled' ? colors.card : themeColors.textLight}
              style={styles.tabIcon}
            />
            <Text style={[dynamicStyles.tabText, activeTab === 'enrolled' && dynamicStyles.activeTabText]}>
              Enrolled
            </Text>
            {enrolledClasses.length > 0 && (
              <View style={[styles.tabBadge, activeTab === 'enrolled' && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === 'enrolled' && styles.tabBadgeTextActive]}>
                  {enrolledClasses.length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            <Feather
              name="plus-circle"
              size={16}
              color={activeTab === 'available' ? colors.card : themeColors.textLight}
              style={styles.tabIcon}
            />
            <Text style={[dynamicStyles.tabText, activeTab === 'available' && dynamicStyles.activeTabText]}>
              Available
            </Text>
            {getAvailableForEnrollment().length > 0 && (
              <View style={[styles.tabBadge, activeTab === 'available' && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === 'available' && styles.tabBadgeTextActive]}>
                  {getAvailableForEnrollment().length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error && (
        <View style={[styles.errorContainer, dynamicStyles.errorContainer]}>
          <View style={styles.errorIconContainer}>
            <Feather name="alert-circle" size={20} color={colors.danger} />
          </View>
          <Text style={dynamicStyles.errorText}>{error}</Text>
        </View>
      )}

      {/* Class List */}
      <FlatList
        data={currentData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={emptyComponent}
      />

      {/* Face Scan Modal */}
      {selectedClass && (
        <ClassFaceScanModal
          visible={showFaceScanModal}
          classItem={selectedClass}
          onClose={handleFaceScanClose}
          onSuccess={handleFaceScanSuccess}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  headerBadgeText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold as any,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: spacing.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.xs / 2,
    flexWrap: 'wrap',
  },
  tab: {
    flex: 1,
    minWidth: 140,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    marginRight: spacing.xs,
  },
  tabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    marginLeft: spacing.xs,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabBadgeText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold as any,
    color: colors.textLight,
  },
  tabBadgeTextActive: {
    color: colors.card,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  errorIconContainer: {
    marginRight: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  classItemWrapper: {
    marginBottom: spacing.xl,
  },
  classCardWrapper: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  attendanceStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.xs,
  },
  attendanceStatusText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold as any,
    marginLeft: spacing.xs / 2,
  },
  requestStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.xs,
  },
  requestStatusText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold as any,
    marginLeft: spacing.xs / 2,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.xs,
  },
  permissionText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold as any,
    marginLeft: spacing.xs / 2,
  },
  newClassBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: spacing.md,
    borderWidth: 1,
    gap: spacing.xs / 2,
    zIndex: 10,
  },
  newClassBadgeText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold as any,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  markAttendanceButton: {
    flex: 1,
    minWidth: 140,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    position: 'relative',
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
  },
  markAttendanceButtonText: {
    color: colors.card,
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold as any,
  },
  markAttendanceButtonDisabled: {
    backgroundColor: colors.success,
    borderColor: `${colors.success}40`,
  },
  markAttendanceButtonTextDisabled: {
    color: colors.card,
  },
  markAttendanceButtonPending: {
    backgroundColor: colors.warning,
    borderColor: `${colors.warning}40`,
  },
  markAttendanceButtonRequest: {
    backgroundColor: colors.primary,
    borderColor: `${colors.primary}40`,
  },
  buttonIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  buttonIconWrapperSuccess: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonIconWrapperWarning: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  buttonIconWrapperDanger: {
    backgroundColor: `${colors.danger}15`,
  },
  successBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  enrollArrowContainer: {
    marginLeft: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unenrollButton: {
    flex: 1,
    minWidth: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderColor: colors.danger,
    borderWidth: 1.5,
    borderRadius: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  unenrollButtonText: {
    color: colors.danger,
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold as any,
  },
  enrollButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
    borderRadius: spacing.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    minWidth: 120,
    borderWidth: 1,
    borderColor: `${colors.success}40`,
  },
  enrollButtonText: {
    color: colors.card,
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold as any,
  },
})
