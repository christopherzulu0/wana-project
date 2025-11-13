"use client"

import { Feather } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import React, { useEffect, useMemo, useState } from "react"
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Avatar } from "../../../components/Avatar"
import { Button } from "../../../components/Button"
import { Card } from "../../../components/Card"
import { EmptyState } from "../../../components/EmptyState"
import { Header } from "../../../components/Header"
import { StatusBar } from "../../../components/StatusBar"
import { colors } from "../../../constants/Colors"
import { fonts } from "../../../constants/fonts"
import { spacing } from "../../../constants/spacing"
import { useClasses } from "../../../hooks/useClasses"
import { useColorScheme } from "../../../hooks/useColorScheme"
import { useUsers } from "../../../hooks/useUsers"
import type { Class, User } from "../../../types"

const API_BASE_URL = 'http://10.156.181.203:3000';

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

type Role = "teacher" | "admin" | "student"

export default function AssignRolesAndClassesScreen() {
    const params = useLocalSearchParams<{ id: string | string[] }>()
    const router = useRouter()
    const { width } = useWindowDimensions()
    const { users, updateUser, loading: usersLoading } = useUsers()
    const { getAllClasses } = useClasses()
    const classes = getAllClasses()
    const colorScheme = useColorScheme() ?? 'dark'
    const isDark = colorScheme === 'dark'

    // Normalize id (expo-router sometimes returns arrays)
    const userId = Array.isArray(params.id) ? params.id[0] : params.id

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

    // Find the user - handle both string and number IDs
    const user = userId ? users.find(u => {
        // Convert both to strings for comparison
        const uId = String(u.id)
        const searchId = String(userId)
        return uId === searchId
    }) : null

    
    // State
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [selectedTeacherClassIds, setSelectedTeacherClassIds] = useState<string[]>([])
    const [selectedStudentClassId, setSelectedStudentClassId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [fetchingAssignments, setFetchingAssignments] = useState(false)
    const [studentId, setStudentId] = useState<string | null>(null)

    // Fetch teacher class assignments from API
    const fetchTeacherAssignments = async (userId: string) => {
        try {
            const teacherClasses = classes.filter((cls) => cls.teacherId === userId)
            setSelectedTeacherClassIds(teacherClasses.map((cls) => cls.id))
        } catch (error) {
            console.error('Error fetching teacher assignments:', error)
        }
    }

    // Fetch student data and class assignments from API
    const fetchStudentAssignments = async (userId: string) => {
        try {
            setFetchingAssignments(true)
            const response = await fetch(`${API_BASE_URL}/api/students/by-user/${userId}`)
            if (response.ok) {
                const data = await response.json()
                if (data.student) {
                    setStudentId(data.student.id)
                    // Fetch classes for this student
                    const studentClassesResponse = await fetch(`${API_BASE_URL}/api/classes`)
                    if (studentClassesResponse.ok) {
                        const classesData = await studentClassesResponse.json()
                        // Find which class this student is enrolled in
                        for (const cls of classesData.classes || []) {
                            const classDetailsResponse = await fetch(`${API_BASE_URL}/api/classes/${cls.id}`)
                            if (classDetailsResponse.ok) {
                                const classDetails = await classDetailsResponse.json()
                                const isEnrolled = classDetails.students?.some(
                                    (s: any) => s.id === data.student.id
                                )
                                if (isEnrolled) {
                                    setSelectedStudentClassId(cls.id)
                                    break
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching student assignments:', error)
        } finally {
            setFetchingAssignments(false)
        }
    }

    // Initialize state from user
    useEffect(() => {
        if (user) {
            const userRole = (user.role as Role) || "student"
            setSelectedRole(userRole)
            
            if (userRole === "teacher") {
                // Fetch teacher class assignments
                fetchTeacherAssignments(user.id)
            } else if (userRole === "student") {
                // Fetch student data and class assignments
                fetchStudentAssignments(user.id)
            } else {
                // Admin - no assignments
                setSelectedTeacherClassIds([])
                setSelectedStudentClassId(null)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, classes])

    const toggleTeacherClass = (classId: string) => {
        setSelectedTeacherClassIds((prev) =>
            prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId],
        )
    }

    const assignStudentClass = (classId: string) => {
        setSelectedStudentClassId(classId)
    }

    const applyChanges = async () => {
        if (!user || !selectedRole) return

        try {
            setLoading(true)

            // Update user role
            const updatedUser: User = { ...user, role: selectedRole }
            await updateUser(updatedUser)

            if (selectedRole === "teacher") {
                // Get current teacher assignments
                const currentTeacherClasses = classes.filter((cls) => cls.teacherId === user.id)
                const currentClassIds = currentTeacherClasses.map((cls) => cls.id)
                
                // Remove teacher from classes that are no longer selected
                const classesToUnassign = currentClassIds.filter((id) => !selectedTeacherClassIds.includes(id))
                for (const classId of classesToUnassign) {
                    try {
                        await fetch(`${API_BASE_URL}/api/classes/${classId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ teacherId: null })
                        })
                    } catch (error) {
                        console.error(`Error unassigning class ${classId}:`, error)
                    }
                }

                // Assign teacher to newly selected classes
                const classesToAssign = selectedTeacherClassIds.filter((id) => !currentClassIds.includes(id))
                for (const classId of classesToAssign) {
                    try {
                        await fetch(`${API_BASE_URL}/api/classes/${classId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ teacherId: user.id })
                        })
                    } catch (error) {
                        console.error(`Error assigning class ${classId}:`, error)
                    }
                }

                Alert.alert("Success", "Role and class assignments updated for the teacher.")
            } else if (selectedRole === "student") {
                // Handle student class assignment
                if (!studentId) {
                    Alert.alert("Error", "Student record not found. Please create a student record first.")
                    setLoading(false)
                    return
                }

                // Get current student enrollment
                let currentEnrolledClassId: string | null = null
                for (const cls of classes) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/api/classes/${cls.id}`)
                        if (response.ok) {
                            const data = await response.json()
                            const isEnrolled = data.students?.some((s: any) => s.id === studentId)
                            if (isEnrolled) {
                                currentEnrolledClassId = cls.id
                                break
                            }
                        }
                    } catch (error) {
                        console.error(`Error checking enrollment for class ${cls.id}:`, error)
                    }
                }

                // Unenroll from current class if different
                if (currentEnrolledClassId && currentEnrolledClassId !== selectedStudentClassId) {
                    try {
                        await fetch(`${API_BASE_URL}/api/classes/${currentEnrolledClassId}/unenroll`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ studentId })
                        })
                    } catch (error) {
                        console.error('Error unenrolling student:', error)
                    }
                }

                // Enroll in new class if selected
                if (selectedStudentClassId && selectedStudentClassId !== currentEnrolledClassId) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/api/classes/${selectedStudentClassId}/enroll`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ studentId })
                        })
                        if (!response.ok) {
                            throw new Error('Failed to enroll student')
                        }
                    } catch (error) {
                        console.error('Error enrolling student:', error)
                        Alert.alert("Error", "Failed to enroll student in class. Please try again.")
                        setLoading(false)
                        return
                    }
                }

                Alert.alert("Success", "Role and class assignment updated for the student.")
            } else {
                // Admin - unassign from all classes if was a teacher
                if (user.role === "teacher") {
                    const currentTeacherClasses = classes.filter((cls) => cls.teacherId === user.id)
                    for (const cls of currentTeacherClasses) {
                        try {
                            await fetch(`${API_BASE_URL}/api/classes/${cls.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ teacherId: null })
                            })
                        } catch (error) {
                            console.error(`Error unassigning class ${cls.id}:`, error)
                        }
                    }
                }
                Alert.alert("Success", "Role updated successfully.")
            }
            
            // Navigate back
            router.back()
        } catch (error) {
            Alert.alert("Error", "Failed to update user. Please try again.")
            console.error('Error updating user:', error)
        } finally {
            setLoading(false)
        }
    }

    // Show loading state while users are being fetched
    if (usersLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
                <StatusBar />
                <Header title="Assign Roles & Classes" showBackButton />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: themeColors.textLight }]}>Loading user...</Text>
                </View>
            </SafeAreaView>
        )
    }

    // Show error if user not found
    if (!user || !userId) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
                <StatusBar />
                <Header title="Assign Roles & Classes" showBackButton />
                <EmptyState
                    title="User Not Found"
                    message={userId ? `The user with ID "${userId}" doesn't exist.` : "No user ID provided."}
                    icon="user-x"
                />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
            <StatusBar />
            <Header title="Assign Roles & Classes" showBackButton />
            
            <ScrollView 
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Card style={width < 420 ? [styles.assignPanel, styles.assignPanelCompact] : styles.assignPanel}>
                    <View style={[styles.personHeader, width < 420 && styles.personHeaderCompact]}>
                        <Avatar source={user.avatar} name={user.name} size={width < 420 ? 44 : 56} />
                        <View style={[styles.personInfo, width < 420 && styles.personInfoCompact]}>
                            <Text numberOfLines={2} style={[styles.personName, { color: themeColors.text }]}>{user.name}</Text>
                            <Text numberOfLines={2} style={[styles.personEmail, { color: themeColors.textLight }]}>{user.email}</Text>
                            <View style={{ marginTop: spacing.xs }}>
                                <RoleBadge role={user.role} />
                            </View>
                        </View>
                    </View>

                    {/* Role Selector */}
                    <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Role</Text>
                    <View style={[styles.roleRow, width < 420 && styles.wrapRow]}>
                        {(["teacher", "admin", "student"] as Role[]).map((role) => {
                            const active = selectedRole === role
                            return (
                                <TouchableOpacity
                                    key={role}
                                    style={[
                                        styles.roleChip,
                                        {
                                            backgroundColor: active ? colors.primary : themeColors.card,
                                            borderColor: active ? colors.primary : themeColors.border,
                                        }
                                    ]}
                                    onPress={() => setSelectedRole(role)}
                                >
                                    <Feather
                                        name={
                                            role === "teacher"
                                                ? "briefcase"
                                                : role === "admin"
                                                    ? "shield"
                                                    : "user"
                                        }
                                        size={18}
                                        color={active ? themeColors.card : themeColors.text}
                                    />
                                    <Text
                                        style={[
                                            styles.roleChipText,
                                            { color: active ? themeColors.card : themeColors.text },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>

                    {/* Class Assignment */}
                    {selectedRole === "teacher" && (
                        <>
                            <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Assigned Classes</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.chipsRow}
                            >
                                {classes.map((cls) => {
                                    const active = selectedTeacherClassIds.includes(cls.id)
                                    return (
                                        <TouchableOpacity
                                            key={cls.id}
                                            style={[
                                                styles.classChip,
                                                {
                                                    backgroundColor: active ? colors.success : themeColors.card,
                                                    borderColor: active ? colors.success : themeColors.border,
                                                }
                                            ]}
                                            onPress={() => toggleTeacherClass(cls.id)}
                                        >
                                            <Feather
                                                name="book"
                                                size={16}
                                                color={active ? themeColors.card : themeColors.text}
                                            />
                                            <Text
                                                style={[
                                                    styles.classChipText,
                                                    { color: active ? themeColors.card : themeColors.text },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {cls.name} ({cls.section})
                                            </Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </ScrollView>
                        </>
                    )}

                    {selectedRole === "student" && (
                        <>
                            <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Assign Class (Single)</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.chipsRow}
                            >
                                {classes.map((cls) => {
                                    const active = selectedStudentClassId === cls.id
                                    return (
                                        <TouchableOpacity
                                            key={cls.id}
                                            style={[
                                                styles.classChip,
                                                {
                                                    backgroundColor: active ? colors.success : themeColors.card,
                                                    borderColor: active ? colors.success : themeColors.border,
                                                }
                                            ]}
                                            onPress={() => assignStudentClass(cls.id)}
                                        >
                                            <Feather
                                                name="book"
                                                size={16}
                                                color={active ? themeColors.card : themeColors.text}
                                            />
                                            <Text
                                                style={[
                                                    styles.classChipText,
                                                    { color: active ? themeColors.card : themeColors.text },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {cls.name} ({cls.section})
                                            </Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </ScrollView>
                            {fetchingAssignments && (
                                <View style={styles.loadingRow}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                    <Text style={[styles.hintText, { color: themeColors.textLight, marginLeft: spacing.sm }]}>
                                        Loading student assignments...
                                    </Text>
                                </View>
                            )}
                        </>
                    )}

                    {selectedRole === "admin" && (
                        <Text style={[styles.hintText, { color: themeColors.textLight }]}>
                            Admins don't have class assignments. Changing a teacher to admin will unassign them from their classes.
                        </Text>
                    )}

                    <View style={styles.panelFooter}>
                        <Button 
                            title="Apply Changes" 
                            onPress={applyChanges} 
                            variant="primary" 
                            style={{ flex: 1 }}
                            loading={loading}
                        />
                    </View>
                </Card>
            </ScrollView>
        </SafeAreaView>
    )
}

function RoleBadge({ role }: { role: string }) {
    const getBadgeStyle = () => {
        switch (role) {
            case "teacher":
                return { backgroundColor: colors.primary + "20", color: colors.primary }
            case "admin":
                return { backgroundColor: colors.danger + "20", color: colors.danger }
            case "student":
                return { backgroundColor: colors.success + "20", color: colors.success }
            default:
                return { backgroundColor: colors.textLight + "20", color: colors.textLight }
        }
    }
    
    const badgeStyle = getBadgeStyle()
    
    return (
        <View style={[styles.roleBadge, { backgroundColor: badgeStyle.backgroundColor }]}>
            <Text style={[styles.roleBadgeText, { color: badgeStyle.color }]}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
        </View>
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
    },
    assignPanel: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        padding: spacing.lg,
        minHeight: 200,
    },
    assignPanelCompact: {
        padding: spacing.md,
    },
    personHeader: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        minHeight: 60,
        marginBottom: spacing.lg,
    },
    personHeaderCompact: {
        alignItems: 'flex-start',
        gap: spacing.sm,
    },
    personInfo: {
        marginLeft: spacing.md,
        flex: 1,
        minWidth: 200,
    },
    personInfoCompact: {
        marginLeft: spacing.sm,
        minWidth: 0,
    },
    personName: {
        fontSize: 16,
        fontFamily: fonts.bold,
    },
    personEmail: {
        fontSize: 14,
        fontFamily: fonts.regular,
        marginTop: spacing.xs,
    },
    sectionLabel: {
        fontSize: 16,
        fontFamily: fonts.semibold,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    roleRow: {
        flexDirection: "row",
        gap: spacing.sm,
        flexWrap: "wrap",
        alignItems: "center",
    },
    wrapRow: {
        flexWrap: 'wrap',
    },
    roleChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
        borderWidth: 1,
        gap: spacing.xs,
        minHeight: 44,
        minWidth: 100,
        justifyContent: "center",
        flexShrink: 0,
    },
    roleChipText: {
        fontSize: 14,
        fontFamily: fonts.medium,
        flexShrink: 1,
        textAlign: "center",
    },
    chipsRow: {
        gap: spacing.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    classChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 16,
        borderWidth: 1,
        gap: spacing.xs,
    },
    classChipText: {
        fontSize: 14,
        fontFamily: fonts.medium,
    },
    hintText: {
        fontSize: 12,
        fontFamily: fonts.regular,
        fontStyle: "italic",
        marginTop: spacing.sm,
    },
    panelFooter: {
        flexDirection: "row",
        gap: spacing.sm,
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 50,
        marginTop: spacing.lg,
    },
    roleBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 12,
    },
    roleBadgeText: {
        fontSize: 12,
        fontFamily: fonts.medium,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.xl,
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: 14,
        fontFamily: fonts.regular,
    },
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: spacing.sm,
    },
})

