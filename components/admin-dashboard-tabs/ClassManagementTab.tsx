"use client"

import { useMemo, useState } from "react"
import { Alert, FlatList, StyleSheet, Text, View } from "react-native"
import { colors } from "../../constants/Colors"
import { fonts } from "../../constants/fonts"
import { spacing } from "../../constants/spacing"
import { useColorScheme } from "../../hooks/useColorScheme"
import type { Class } from "../../types"
import { Button } from "../Button"
import { EmptyState } from "../EmptyState"
import { ClassFormModal } from "../ClassFormModal"
import { ClassEnrollmentModal } from "../ClassEnrollmentModal"
import { EnhancedClassCard } from "../EnhancedClassCard"
import { useClasses } from "../../hooks/useClasses"
import { useUsers } from "../../hooks/useUsers"
import { useClassEnrollment } from "../../hooks/useClassEnrollment"

// Dark mode color palette
const darkColors = {
  background: "#151718",
  card: "#1F2324",
  text: "#ECEDEE",
  textLight: "#9BA1A6",
  border: "#2A2D2E",
  borderLight: "#252829",
}

export function ClassManagementTab() {
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'

  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : colors.background,
    text: isDark ? darkColors.text : colors.text,
  }), [isDark])
  const { classes, loading, error, addClass, updateClass, deleteClass, refetch } = useClasses()
  const { users } = useUsers()
  const { enrollStudent, unenrollStudent, loading: enrollmentLoading } = useClassEnrollment()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEnrollmentModalVisible, setIsEnrollmentModalVisible] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [selectedClassForEnrollment, setSelectedClassForEnrollment] = useState<Class | null>(null)
  
  // Filter users to get only teachers
  const teachers = users.filter(user => user.role === 'teacher')

  const handleAddClass = () => {
    setEditingClass(null)
    setIsModalVisible(true)
  }

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem)
    setIsModalVisible(true)
  }

  const handleDeleteClass = (classItem: Class) => {
    Alert.alert(
      "Delete Class",
      `Are you sure you want to delete ${classItem.name} (${classItem.section})? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await deleteClass(classItem.id)
              if (result.success) {
                Alert.alert("Success", `${classItem.name} has been deleted.`)
              } else {
                Alert.alert("Error", result.error || "Failed to delete class")
              }
            } catch (error) {
              Alert.alert("Error", "An unexpected error occurred")
              console.error('Delete class error:', error)
            }
          },
        },
      ],
    )
  }

  const handleManageEnrollment = (classItem: Class) => {
    setSelectedClassForEnrollment(classItem)
    setIsEnrollmentModalVisible(true)
  }

  const handleEnrollStudent = async (classId: string, studentId: string): Promise<boolean> => {
    return await enrollStudent(classId, studentId)
  }

  const handleUnenrollStudent = async (classId: string, studentId: string): Promise<boolean> => {
    return await unenrollStudent(classId, studentId)
  }

  const handleSaveClass = async (classData: Omit<Class, "id" | "totalStudents" | "teacherName">) => {
    try {
      if (editingClass) {
        const updatedClassData = { ...editingClass, ...classData }
        console.log('Frontend - Updating class with data:', updatedClassData)
        console.log('Frontend - Room value:', updatedClassData.room)
        const result = await updateClass(updatedClassData)
        if (result.success) {
          Alert.alert("Success", `${classData.name} has been updated.`)
          setIsModalVisible(false)
          setEditingClass(null)
        } else {
          Alert.alert("Error", result.error || "Failed to update class")
        }
      } else {
        const result = await addClass(classData)
        if (result.success) {
          Alert.alert("Success", `${classData.name} has been added.`)
          setIsModalVisible(false)
          setEditingClass(null)
        } else {
          Alert.alert("Error", result.error || "Failed to add class")
        }
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred")
      console.error('Save class error:', error)
    }
  }

  const renderClassItem = ({ item }: { item: Class }) => (
    <EnhancedClassCard 
      classItem={item} 
      onEdit={handleEditClass} 
      onDelete={handleDeleteClass} 
      onManageEnrollment={handleManageEnrollment}
      showActions={true} 
    />
  )

  const renderEmptyComponent = () => (
    <EmptyState
      title="No Classes Found"
      message="There are no classes in the system yet. Add a new class to get started."
      icon="book"
      actionLabel="Add New Class"
      onAction={handleAddClass}
    />
  )

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.danger }]}>Error loading classes: {error}</Text>
          <Button title="Retry" onPress={refetch} variant="primary" size="small" />
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>All Classes ({classes.length})</Text>
        <Button 
          title={loading ? "Loading..." : "Add New Class"} 
          onPress={handleAddClass} 
          variant="primary" 
          size="small" 
          disabled={loading}
        />
      </View>

      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        renderItem={renderClassItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loading ? () => (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: themeColors.text }]}>Loading classes...</Text>
          </View>
        ) : renderEmptyComponent}
        refreshing={loading}
        onRefresh={refetch}
      />

      <ClassFormModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSaveClass}
        initialData={editingClass}
        teachers={teachers}
      />

      <ClassEnrollmentModal
        visible={isEnrollmentModalVisible}
        classItem={selectedClassForEnrollment}
        onClose={() => {
          setIsEnrollmentModalVisible(false)
          setSelectedClassForEnrollment(null)
        }}
        onEnrollStudent={handleEnrollStudent}
        onUnenrollStudent={handleUnenrollStudent}
        loading={enrollmentLoading}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fonts.sizes.md,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: fonts.sizes.md,
    textAlign: "center",
  },
})
