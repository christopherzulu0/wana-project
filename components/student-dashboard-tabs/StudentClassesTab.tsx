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
import { useState } from "react"

export function StudentClassesTab() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'enrolled' | 'available'>('enrolled')
  const {
    enrolledClasses,
    availableClasses,
    loading,
    error,
    enrollInClass,
    unenrollFromClass,
    isEnrolledInClass,
    getAvailableForEnrollment,
  } = useStudentEnrollment()

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

  const renderEnrolledClassItem = ({ item }: { item: any }) => (
    <View>
      <ClassCard classItem={item} />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.markAttendanceButton}
          onPress={() => router.push(`/student-attendance/${item.id}`)}
        >
          <Feather name="camera" size={20} color={colors.card} />
          <Text style={styles.markAttendanceButtonText}>Mark Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity
           style={styles.unenrollButton}
           onPress={() => handleUnenroll(item.id, item.name)}
         >
           <Feather name="user-minus" size={20} color={colors.danger} />
           <Text style={styles.unenrollButtonText}>Unenroll</Text>
         </TouchableOpacity>
      </View>
    </View>
  )

  const renderAvailableClassItem = ({ item }: { item: any }) => (
    <View>
      <ClassCard classItem={item} />
      <TouchableOpacity
        style={styles.enrollButton}
        onPress={() => handleEnroll(item.id, item.name)}
      >
        <Feather name="user-plus" size={20} color={colors.card} />
        <Text style={styles.enrollButtonText}>Enroll</Text>
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading classes...</Text>
      </View>
    )
  }

  const currentData = activeTab === 'enrolled' ? enrolledClasses : getAvailableForEnrollment()
  const renderItem = activeTab === 'enrolled' ? renderEnrolledClassItem : renderAvailableClassItem
  const emptyComponent = activeTab === 'enrolled' ? renderEmptyEnrolled : renderEmptyAvailable

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'enrolled' && styles.activeTab]}
          onPress={() => setActiveTab('enrolled')}
        >
          <Text style={[styles.tabText, activeTab === 'enrolled' && styles.activeTabText]}>
            Enrolled ({enrolledClasses.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Available ({getAvailableForEnrollment().length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.xs,
    flexWrap: 'wrap',
  },
  tab: {
    flex: 1,
    minWidth: 120,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.sm,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.medium,
    color: colors.textLight,
  },
  activeTabText: {
    color: colors.card,
    fontWeight: fonts.weights.semibold,
  },
  errorContainer: {
    backgroundColor: colors.danger + '20',
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -spacing.xsm,
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
    paddingVertical: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  markAttendanceButtonText: {
    color: colors.card,
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    marginLeft: spacing.xs,
  },
  unenrollButton: {
    flex: 1,
    minWidth: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: spacing.md,
    paddingVertical: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unenrollButtonText: {
    color: colors.danger,
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    marginLeft: spacing.xs,
  },
  enrollButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
    borderRadius: spacing.md,
    paddingVertical: spacing.md,
    marginTop: -spacing.xsm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    minWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  enrollButtonText: {
    color: colors.card,
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    marginLeft: spacing.sm,
  },
})
