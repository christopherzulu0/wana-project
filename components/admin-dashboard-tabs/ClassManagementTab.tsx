

import { useMemo, useState } from "react"
import { Alert, FlatList, StyleSheet, Text, TextInput, View, Animated, Platform } from "react-native"
import { colors } from "../../constants/Colors"
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
import { Search, Plus, BookOpen, Filter } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"

const darkColors = {
  background: "#08090A",
  backgroundGradientStart: "#08090A",
  backgroundGradientEnd: "#0D0F12",
  surface: "#0F1115",
  card: "#13151A",
  cardHover: "#16181E",
  text: "#FAFBFC",
  textSecondary: "#9CA3B0",
  textTertiary: "#6B7280",
  border: "#1A1D24",
  borderLight: "#242830",
  accent: "#5B8EF4",
  accentLight: "#7AA7FF",
  accentDark: "#4A7DD9",
  success: "#22C55E",
  danger: "#F87171",
  warning: "#FBBF24",
  searchBg: "#0D0F13",
  overlay: "rgba(0, 0, 0, 0.7)",
  cardBorder: "#1E2128",
  divider: "#1A1D24",
}

const lightColors = {
  background: "#F7F8FA",
  backgroundGradientStart: "#F7F8FA",
  backgroundGradientEnd: "#FFFFFF",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  cardHover: "#F9FAFB",
  text: "#0F1419",
  textSecondary: "#5F6B7A",
  textTertiary: "#8B95A5",
  border: "#E1E4E8",
  borderLight: "#EAECEF",
  accent: "#3B82F6",
  accentLight: "#60A5FA",
  accentDark: "#2563EB",
  success: "#22C55E",
  danger: "#F87171",
  warning: "#FBBF24",
  searchBg: "#F3F4F6",
  overlay: "rgba(0, 0, 0, 0.3)",
  cardBorder: "#EAECF0",
  divider: "#E5E7EB",
}

export function ClassManagementTab() {
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'

  const themeColors = useMemo(() => (isDark ? darkColors : lightColors), [isDark])

  const { classes, loading, error, addClass, updateClass, deleteClass, refetch } = useClasses()
  const { users } = useUsers()
  const { enrollStudent, unenrollStudent, loading: enrollmentLoading } = useClassEnrollment()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEnrollmentModalVisible, setIsEnrollmentModalVisible] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [selectedClassForEnrollment, setSelectedClassForEnrollment] = useState<Class | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  const teachers = users.filter(user => user.role === 'teacher')

  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return classes
    
    const query = searchQuery.toLowerCase()
    return classes.filter(classItem => 
      classItem.name.toLowerCase().includes(query) ||
      classItem.section.toLowerCase().includes(query) ||
      classItem.teacherName?.toLowerCase().includes(query) ||
      classItem.subject?.toLowerCase().includes(query)
    )
  }, [classes, searchQuery])

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

  const renderClassItem = ({ item, index }: { item: Class; index: number }) => (
    <View style={styles.cardWrapper}>
      <EnhancedClassCard 
        classItem={item} 
        onEdit={handleEditClass} 
        onDelete={handleDeleteClass} 
        onManageEnrollment={handleManageEnrollment}
        showActions={true}
        index={index}
      />
    </View>
  )

  const renderEmptyComponent = () => (
    <EmptyState
      title={searchQuery ? "No Classes Found" : "No Classes Yet"}
      message={searchQuery ? "Try adjusting your search query" : "Create your first class to get started with managing students and schedules"}
      icon="book"
      actionLabel={searchQuery ? undefined : "Add New Class"}
      onAction={searchQuery ? undefined : handleAddClass}
    />
  )

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.errorContainer}>
          <View style={[styles.errorIconContainer, { backgroundColor: themeColors.danger + '15' }]}>
            <BookOpen size={52} color={themeColors.danger} strokeWidth={2} />
          </View>
          <Text style={[styles.errorTitle, { color: themeColors.text }]}>Unable to Load Classes</Text>
          <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>{error}</Text>
          <Button title="Try Again" onPress={refetch} variant="primary" size="small" />
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <LinearGradient
        colors={isDark ? [themeColors.backgroundGradientStart, themeColors.surface] : [themeColors.backgroundGradientStart, themeColors.backgroundGradientEnd]}
        style={styles.headerGradient}
      >
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <View style={styles.titleWithIcon}>
                <View style={[styles.iconCircle, { backgroundColor: themeColors.accent + '20' }]}>
                  <BookOpen size={24} color={themeColors.accent} strokeWidth={2.5} />
                </View>
                <Text style={[styles.mainTitle, { color: themeColors.text }]}>Classes</Text>
              </View>
              <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                {classes.length} {classes.length === 1 ? 'class' : 'classes'} • Manage your curriculum
              </Text>
            </View>
            <View style={[styles.addButtonWrapper, { backgroundColor: themeColors.accent, shadowColor: themeColors.accent }]}>
              <Button 
                title="" 
                onPress={handleAddClass} 
                variant="primary" 
                size="small" 
                disabled={loading}
                icon={<Plus size={20} color="#FFF" strokeWidth={2.5} />}
              />
            </View>
          </View>

          <View style={[styles.searchContainer, { 
            backgroundColor: themeColors.searchBg, 
            borderColor: themeColors.border,
            shadowColor: isDark ? '#000' : themeColors.border
          }]}>
            <Search size={20} color={themeColors.textSecondary} strokeWidth={2} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search by name, teacher, or subject..."
              placeholderTextColor={themeColors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Text 
                style={[styles.clearButton, { color: themeColors.accent }]}
                onPress={() => setSearchQuery("")}
              >
                Clear
              </Text>
            )}
          </View>

          {searchQuery.length > 0 && (
            <View style={[styles.filterResultsRow, { backgroundColor: themeColors.accent + '15', borderColor: themeColors.accent + '30' }]}>
              <Filter size={14} color={themeColors.accent} strokeWidth={2.5} />
              <Text style={[styles.filterResultsText, { color: themeColors.accent }]}>
                {filteredClasses.length} {filteredClasses.length === 1 ? 'match' : 'matches'}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <FlatList
        data={filteredClasses}
        keyExtractor={(item) => item.id}
        renderItem={renderClassItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        numColumns={Platform.OS === 'web' ? 2 : 1}
        key={Platform.OS === 'web' ? 'grid' : 'list'}
        columnWrapperStyle={Platform.OS === 'web' ? styles.columnWrapper : undefined}
        ListEmptyComponent={loading ? () => (
          <View style={styles.loadingContainer}>
            <View style={[styles.loadingIconContainer, { backgroundColor: themeColors.surface }]}>
              <BookOpen size={48} color={themeColors.textSecondary} strokeWidth={2} />
            </View>
            <Text style={[styles.loadingText, { color: themeColors.text }]}>
              Loading classes...
            </Text>
            <Text style={[styles.loadingSubtext, { color: themeColors.textTertiary }]}>
              Please wait a moment
            </Text>
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
  },
  headerGradient: {
    paddingBottom: 8,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 18,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  titleContainer: {
    flex: 1,
    gap: 6,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: "800" as const,
    letterSpacing: -1,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500" as const,
    letterSpacing: 0.2,
    lineHeight: 20,
    marginLeft: 62,
  },
  addButtonWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500" as const,
    letterSpacing: 0.1,
    lineHeight: 22,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as const,
      },
    }),
  },
  clearButton: {
    fontSize: 14,
    fontWeight: "700" as const,
    paddingHorizontal: 10,
    paddingVertical: 6,
    letterSpacing: 0.3,
  },
  filterResultsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterResultsText: {
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 0.4,
    textTransform: "uppercase" as const,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    flexGrow: 1,
  },
  columnWrapper: {
    gap: 16,
    justifyContent: "space-between" as const,
  },
  cardWrapper: {
    flex: Platform.OS === 'web' ? 0.5 : 1,
    width: Platform.OS === 'web' ? '48%' : '100%',
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 20,
  },
  errorIconContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  errorText: {
    fontSize: 15,
    fontWeight: "500" as const,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
    letterSpacing: 0.1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
    gap: 14,
  },
  loadingIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  loadingSubtext: {
    fontSize: 14,
    fontWeight: "500" as const,
    letterSpacing: 0.1,
  },
})
