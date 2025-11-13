"use client"

import { Feather } from "@expo/vector-icons"
import { usePathname, useRouter } from "expo-router"
import React, { useEffect, useMemo, useRef, useState } from "react"
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from "react-native"
import { colors } from "../../constants/Colors"
import { fonts } from "../../constants/fonts"
import { spacing } from "../../constants/spacing"
import { useClasses } from "../../hooks/useClasses"
import { useUsers } from "../../hooks/useUsers"
import { useColorScheme } from "../../hooks/useColorScheme"
import type { Class, User } from "../../types"
import { mockClasses, updateMockClass } from "../../utils/mockData"
import { Avatar } from "../Avatar"
import { Button } from "../Button"
import { Card } from "../Card"
import { EmptyState } from "../EmptyState"
import { Input } from "../Input"
import { UserFormModal } from "../UserFormModal"

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
type RoleFilter = "all" | Role
type SortKey = "name" | "email" | "role"
type SortDir = "asc" | "desc"

export function UserManagementTab() {
    const router = useRouter()
    const pathname = usePathname()
    const { width } = useWindowDimensions()
    const { users, loading, error, addUser, updateUser, deleteUser, refetch } = useUsers()
    const { getAllClasses } = useClasses()
    const classes = getAllClasses()
    const classSearchHelper = useClassSearch()
    const colorScheme = useColorScheme() ?? 'dark'
    const isDark = colorScheme === 'dark'

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

    // UI state
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
    const [search, setSearch] = useState("")
    const [q, setQ] = useState("") // debounced search
    const [sortKey, setSortKey] = useState<SortKey>("name")
    const [sortDir, setSortDir] = useState<SortDir>("asc")

    // Selection state (for bulk operations only)

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const hasSelection = selectedIds.size > 0

    // Modals
    const [isUserFormOpen, setIsUserFormOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)

    const [isBulkRoleModalOpen, setIsBulkRoleModalOpen] = useState(false)
    const [bulkRole, setBulkRole] = useState<Role>("teacher")

    const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false)
    const [bulkClassIds, setBulkClassIds] = useState<string[]>([])

    // Track previous pathname to detect navigation back from assign screen
    const prevPathname = useRef<string | null>(null)
    const lastRefetchTime = useRef<number>(0)

    // Refetch users when returning from assign screen
    // This ensures data is fresh after CRUD operations
    useEffect(() => {
        // Check if we navigated back from /user/[id]/assign to admin dashboard
        const wasOnAssignScreen = prevPathname.current?.includes('/user/') && prevPathname.current?.includes('/assign')
        const isNowOnDashboard = pathname?.includes('admin-dashboard') || pathname === '/admin-dashboard'

        if (wasOnAssignScreen && isNowOnDashboard) {
            // Small delay to ensure navigation is complete
            const now = Date.now()
            if (now - lastRefetchTime.current > 500) {
                lastRefetchTime.current = now
                setTimeout(() => {
                    refetch()
                }, 100)
            }
        }

        // Update previous pathname
        prevPathname.current = pathname || null
    }, [pathname, refetch])

    // Debounce search
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setQ(search.trim().toLowerCase()), 220)
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [search])

    const stats = useMemo(() => {
        let teachers = 0
        let admins = 0
        let students = 0
        users.forEach((u) => {
            if (u.role === "teacher") teachers++
            else if (u.role === "admin") admins++
            else if (u.role === "student") students++
        })
        return { total: users.length, teachers, admins, students }
    }, [users])

    // Filter + search + sort
    const filteredUsers = useMemo(() => {
        let arr = users
        if (roleFilter !== "all") {
            arr = arr.filter((u) => u.role === roleFilter)
        }
        if (q) {
            arr = arr.filter(
                (u) =>
                    u.name.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    u.role.toLowerCase().includes(q),
            )
        }
        arr = [...arr].sort((a, b) => {
            let vA: string
            let vB: string
            switch (sortKey) {
                case "email":
                    vA = a.email.toLowerCase()
                    vB = b.email.toLowerCase()
                    break
                case "role":
                    vA = a.role.toLowerCase()
                    vB = b.role.toLowerCase()
                    break
                case "name":
                default:
                    vA = a.name.toLowerCase()
                    vB = b.name.toLowerCase()
            }
            if (vA < vB) return sortDir === "asc" ? -1 : 1
            if (vA > vB) return sortDir === "asc" ? 1 : -1
            return 0
        })
        return arr
    }, [users, roleFilter, q, sortKey, sortDir])

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"))
        } else {
            setSortKey(key)
            setSortDir("asc")
        }
    }

    const handleSelectUser = (user: User) => {
        if (!user) return
        // Navigate to assign roles and classes screen
        router.push({
            pathname: "/user/[id]/assign",
            params: { id: user.id }
        } as any)
    }

    const clearTeacherAssignmentsFor = (userId: string) => {
        const affected = mockClasses.filter((c) => c.teacherId === userId)
        affected.forEach((cls) => {
            const updated: Class = {
                ...cls,
                teacherId: "",
                teacherName: "Unassigned",
            }
            updateMockClass(updated)
        })
    }

    const handleAddUser = () => {
        setEditingUser(null)
        setIsUserFormOpen(true)
    }

    const handleEditUser = (user: User) => {
        setEditingUser(user)
        setIsUserFormOpen(true)
    }

    const handleDeleteUser = (user: User) => {
        Alert.alert("Delete User", `Are you sure you want to delete ${user.name}?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteUser(user.id)
                        setSelectedIds((prev) => {
                            const n = new Set(prev)
                            n.delete(user.id)
                            return n
                        })
                        Alert.alert("Deleted", `${user.name} has been removed.`)
                    } catch (error) {
                        Alert.alert("Error", "Failed to delete user. Please try again.")
                        console.error('Error deleting user:', error)
                    }
                },
            },
        ])
    }

    // Bulk selection
    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const n = new Set(prev)
            if (n.has(id)) n.delete(id)
            else n.add(id)
            return n
        })
    }
    const selectAll = () => {
        setSelectedIds(new Set(filteredUsers.map((u) => u.id)))
    }
    const clearSelection = () => setSelectedIds(new Set())

    // Bulk actions
    const applyBulkRole = () => {
        const ids = Array.from(selectedIds)
        ids.forEach((id) => {
            const u = users.find((x) => x.id === id)
            if (!u) return
            // If changing away from teacher, clear their classes
            if (u.role === "teacher" && bulkRole !== "teacher") {
                clearTeacherAssignmentsFor(u.id)
            }
            updateUser({ ...u, role: bulkRole })
        })
        setIsBulkRoleModalOpen(false)
        Alert.alert("Updated", `Set role to ${bulkRole} for ${ids.length} user(s).`)
    }

    const applyBulkUnassignTeacherClasses = () => {
        const ids = Array.from(selectedIds)
        let affected = 0
        ids.forEach((id) => {
            const u = users.find((x) => x.id === id)
            if (!u || u.role !== "teacher") return
            clearTeacherAssignmentsFor(id)
            affected++
        })
        Alert.alert("Unassigned", `Cleared class assignments for ${affected} teacher(s).`)
    }

    const applyBulkAssignClasses = () => {
        const ids = Array.from(selectedIds)
        let affected = 0
        ids.forEach((id) => {
            const u = users.find((x) => x.id === id)
            if (!u || u.role !== "teacher") return
            // Replace existing assignments for simplicity
            clearTeacherAssignmentsFor(id)
            bulkClassIds.forEach((classId) => {
                const cls = classes.find((c) => c.id === classId)
                if (cls) {
                    updateMockClass({
                        ...cls,
                        teacherId: id,
                        teacherName: u.name,
                    })
                }
            })
            affected++
        })
        setIsBulkAssignModalOpen(false)
        Alert.alert("Assigned", `Assigned ${bulkClassIds.length} class(es) to ${affected} teacher(s).`)
    }

    const bulkDelete = () => {
        const ids = Array.from(selectedIds)
        if (ids.length === 0) return
        Alert.alert("Delete Users", `Delete ${ids.length} selected user(s)?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        for (const id of ids) {
                            const u = users.find((x) => x.id === id)
                            if (u?.role === "teacher") clearTeacherAssignmentsFor(id)
                            await deleteUser(id)
                        }
                        clearSelection()
                        Alert.alert("Deleted", `${ids.length} user(s) have been removed.`)
                    } catch (error) {
                        Alert.alert("Error", "Failed to delete some users. Please try again.")
                        console.error('Error deleting users:', error)
                    }
                },
            },
        ])
    }

    const renderUserItem = ({ item }: { item: User }) => {
        const isSelected = selectedIds.has(item.id)

        return (
            <TouchableOpacity
                style={[
                    styles.userRow,
                    {
                        backgroundColor: themeColors.card,
                        borderColor: themeColors.border,
                    }
                ]}
                activeOpacity={0.85}
                onPress={() => handleSelectUser(item)}
            >
                <TouchableOpacity
                    onPress={() => toggleSelect(item.id)}
                    style={styles.checkbox}
                    accessibilityLabel={isSelected ? "Deselect user" : "Select user"}
                    hitSlop={{ top: 5, bottom: 1, left: 8, right: 8 }}
                >
                    <Feather
                        name={isSelected ? "check-square" : "square"}
                        size={20}
                        color={isSelected ? colors.primary : themeColors.textLight}
                    />
                </TouchableOpacity>

                <Avatar source={item.avatar} name={item.name} size={48} />

                <View style={styles.userInfo}>
                    <Text numberOfLines={1} style={[styles.userName, { color: themeColors.text }]}>
                        {item.name}
                    </Text>
                    <Text numberOfLines={1} style={[styles.userEmail, { color: themeColors.textLight }]}>
                        {item.email}
                    </Text>
                    <View style={styles.userMeta}>
                        <RoleBadge role={item.role} />
                    </View>
                </View>

                <View style={styles.rowActions}>
                    <TouchableOpacity 
                        onPress={(e) => {
                            e.stopPropagation()
                            handleEditUser(item)
                        }} 
                        style={styles.iconBtn}
                    >
                        <Feather name="edit" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={(e) => {
                            e.stopPropagation()
                            handleDeleteUser(item)
                        }} 
                        style={styles.iconBtn}
                    >
                        <Feather name="trash-2" size={18} color={colors.danger} />
                    </TouchableOpacity>
                    <Feather name="chevron-right" size={18} color={themeColors.textLight} />
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border, paddingTop: spacing.lg }]}>
                <Text style={[styles.title, { color: themeColors.text }]}>Users</Text>
                <Button title="Add User" onPress={handleAddUser} variant="primary" size="small" />
            </View>
            
            <View style={styles.scrollableContent}>
                {/* Stats chips */}
                <View style={[styles.statsContainer, { backgroundColor: themeColors.background }]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.statsRow}
                        style={styles.statsScrollView}
                        bounces={false}
                        decelerationRate="fast"
                    >
                        <StatChip icon="users" label="All" value={stats.total} active={roleFilter === "all"} onPress={() => setRoleFilter("all")} themeColors={themeColors} />
                        <StatChip icon="briefcase" label="Teachers" value={stats.teachers} active={roleFilter === "teacher"} onPress={() => setRoleFilter("teacher")} themeColors={themeColors} />
                        <StatChip icon="user" label="Students" value={stats.students} active={roleFilter === "student"} onPress={() => setRoleFilter("student")} themeColors={themeColors} />
                        <StatChip icon="shield" label="Admins" value={stats.admins} active={roleFilter === "admin"} onPress={() => setRoleFilter("admin")} themeColors={themeColors} />
                    </ScrollView>
                </View>

                {/* Search + Sort */}
                <View style={[styles.toolsContainer, { backgroundColor: themeColors.background }]}>
                    <View style={styles.searchContainer}>
                        <Input
                            placeholder="Search by name, email, or role"
                            value={search}
                            onChangeText={setSearch}
                            leftIcon={<Feather name="search" size={18} color={themeColors.textLight} />}
                            style={styles.searchInput}
                            themeColors={themeColors}
                        />
                    </View>
                    <View style={styles.sortContainer}>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={styles.sortRow}
                            style={styles.sortScrollView}
                            bounces={false}
                        >
                            <SortChip
                                label={`Name ${sortKey === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}`}
                                active={sortKey === "name"}
                                onPress={() => toggleSort("name")}
                                themeColors={themeColors}
                            />
                            <SortChip
                                label={`Email ${sortKey === "email" ? (sortDir === "asc" ? "↑" : "↓") : ""}`}
                                active={sortKey === "email"}
                                onPress={() => toggleSort("email")}
                                themeColors={themeColors}
                            />
                            <SortChip
                                label={`Role ${sortKey === "role" ? (sortDir === "asc" ? "↑" : "↓") : ""}`}
                                active={sortKey === "role"}
                                onPress={() => toggleSort("role")}
                                themeColors={themeColors}
                            />
                        </ScrollView>
                    </View>
                </View>

                {/* Bulk actions bar */}
                {hasSelection && (
                    <Card variant="outlined" style={styles.bulkBar}>
                        <View style={styles.bulkLeft}>
                            <Text style={[styles.bulkText, { color: themeColors.text }]}>{selectedIds.size} selected</Text>
                            <TouchableOpacity onPress={selectAll} style={styles.bulkLink}>
                                <Text style={styles.bulkLinkText}>Select all</Text>
                            </TouchableOpacity>
                            <Text style={styles.bulkDivider}>•</Text>
                            <TouchableOpacity onPress={clearSelection} style={styles.bulkLink}>
                                <Text style={styles.bulkLinkText}>Clear</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bulkActions}>
                            <Button title="Set Role" onPress={() => setIsBulkRoleModalOpen(true)}  size="small" />
                            <Button title="Assign Classes" onPress={() => setIsBulkAssignModalOpen(true)} variant="secondary" size="small" />
                            <Button title="Unassign" onPress={applyBulkUnassignTeacherClasses} variant="secondary" size="small" />
                            <Button title="Delete" onPress={bulkDelete} variant="outline" size="small" />
                        </ScrollView>
                    </Card>
                )}

                {/* Users List */}
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item.id}
                    renderItem={renderUserItem}
                    contentContainerStyle={styles.listContent}
                    style={styles.list}
                    showsVerticalScrollIndicator={true}
                    ListEmptyComponent={
                        <EmptyState
                            title="No Users Found"
                            message="Try adjusting your search or add a new user."
                            icon="users"
                            actionLabel="Add New User"
                            onAction={handleAddUser}
                        />
                    }
                />
            </View>

            {/* Add/Edit User Modal */}
            <UserFormModal
                isVisible={isUserFormOpen}
                onClose={() => setIsUserFormOpen(false)}
                initialData={editingUser}
                onSave={async (userData) => {
                    try {
                        if (editingUser) {
                            await updateUser({ ...editingUser, ...userData })
                            Alert.alert("Updated", "User details have been updated.")
                        } else {
                            await addUser(userData as Omit<User, "id">)
                            Alert.alert("Created", "New user has been added.")
                        }
                        setIsUserFormOpen(false)
                    } catch (error) {
                        Alert.alert("Error", "Failed to save user. Please try again.")
                    }
                }}
            />

            {/* Bulk Set Role Modal */}
            <Modal
                animationType="slide"
                transparent
                visible={isBulkRoleModalOpen}
                onRequestClose={() => setIsBulkRoleModalOpen(false)}
            >
                <View style={styles.centeredView}>
                    <View style={[styles.modalView, { backgroundColor: themeColors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Set Role for {selectedIds.size} user(s)</Text>
                            <TouchableOpacity onPress={() => setIsBulkRoleModalOpen(false)} style={styles.closeButton}>
                                <Feather name="x" size={24} color={themeColors.textLight} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ gap: spacing.sm }}>
                            {(["teacher", "student", "admin"] as Role[]).map((r) => {
                                const active = bulkRole === r
                                return (
                                    <TouchableOpacity
                                        key={r}
                                        onPress={() => setBulkRole(r)}
                                        style={[
                                            styles.bulkRow,
                                            {
                                                backgroundColor: active ? colors.primary : themeColors.background,
                                                borderColor: active ? colors.primary : themeColors.border,
                                            }
                                        ]}
                                    >
                                        <Feather
                                            name={r === "teacher" ? "briefcase" : r === "admin" ? "shield" : "user"}
                                            size={18}
                                            color={active ? themeColors.card : themeColors.text}
                                        />
                                        <Text style={[
                                            styles.bulkRowText,
                                            { color: active ? themeColors.card : themeColors.text }
                                        ]}>
                                            {r.charAt(0).toUpperCase() + r.slice(1)}
                                        </Text>
                                        {active && <Feather name="check" size={18} color={themeColors.card} />}
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                        <View style={styles.modalFooter}>
                            <Button title="Cancel" onPress={() => setIsBulkRoleModalOpen(false)} variant="outline" style={styles.footerButton} />
                            <Button title="Apply" onPress={applyBulkRole} variant="primary" style={styles.footerButton} />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Bulk Assign Classes Modal */}
            <Modal
                animationType="slide"
                transparent
                visible={isBulkAssignModalOpen}
                onRequestClose={() => setIsBulkAssignModalOpen(false)}
            >
                <View style={styles.centeredView}>
                    <View style={[styles.modalView, { backgroundColor: themeColors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Assign Classes to Teachers</Text>
                            <TouchableOpacity onPress={() => setIsBulkAssignModalOpen(false)} style={styles.closeButton}>
                                <Feather name="x" size={24} color={themeColors.textLight} />
                            </TouchableOpacity>
                        </View>

                        <Input
                            placeholder="Search classes"
                            value={classSearchHelper.value}
                            onChangeText={classSearchHelper.setValue}
                            leftIcon={<Feather name="search" size={18} color={themeColors.textLight} />}
                            style={{ marginBottom: spacing.md }}
                            themeColors={themeColors}
                        />

                        <ScrollView style={{ maxHeight: 280 }}>
                            {classSearchHelper.filtered(classes).map((cls) => {
                                const active = bulkClassIds.includes(cls.id)
                                return (
                                    <TouchableOpacity
                                        key={cls.id}
                                        style={[
                                            styles.bulkRow,
                                            {
                                                backgroundColor: active ? colors.primary : themeColors.background,
                                                borderColor: active ? colors.primary : themeColors.border,
                                            }
                                        ]}
                                        onPress={() =>
                                            setBulkClassIds((prev) =>
                                                prev.includes(cls.id)
                                                    ? prev.filter((id) => id !== cls.id)
                                                    : [...prev, cls.id],
                                            )
                                        }
                                    >
                                        <Text style={[
                                            styles.bulkRowText,
                                            { color: active ? themeColors.card : themeColors.text }
                                        ]}>
                                            {cls.name} ({cls.section})
                                        </Text>
                                        {active && <Feather name="check" size={18} color={themeColors.card} />}
                                    </TouchableOpacity>
                                )
                            })}
                        </ScrollView>
                        <View style={styles.modalFooter}>
                            <Button title="Cancel" onPress={() => setIsBulkAssignModalOpen(false)} variant="outline" style={styles.footerButton} />
                            <Button title="Assign" onPress={applyBulkAssignClasses} variant="primary" style={styles.footerButton} />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

// Helper hook for class search
function useClassSearch() {
    const [value, setValue] = useState("")
    const filtered = (classes: Class[]) => {
        if (!value.trim()) return classes
        const q = value.toLowerCase()
        return classes.filter(cls => 
            cls.name.toLowerCase().includes(q) || 
            cls.section.toLowerCase().includes(q)
        )
    }
    return { value, setValue, filtered }
}

// Helper components
function StatChip({ icon, label, value, active, onPress, themeColors }: {
    icon: string
    label: string
    value: number
    active: boolean
    onPress: () => void
    themeColors: any
}) {
    return (
        <TouchableOpacity
            style={[
                styles.statChip,
                {
                    backgroundColor: active ? colors.primary : themeColors.card,
                    borderColor: active ? colors.primary : themeColors.border,
                }
            ]}
            onPress={onPress}
        >
            <Feather name={icon as any} size={16} color={active ? themeColors.card : themeColors.text} />
            <Text style={[
                styles.statChipLabel,
                { color: active ? themeColors.card : themeColors.text }
            ]}>
                {label}
            </Text>
            <Text style={[
                styles.statChipValue,
                { color: active ? themeColors.card : themeColors.text }
            ]}>
                {value}
            </Text>
        </TouchableOpacity>
    )
}

function SortChip({ label, active, onPress, themeColors }: {
    label: string
    active: boolean
    onPress: () => void
    themeColors: any
}) {
    return (
        <TouchableOpacity
            style={[
                styles.sortChip,
                {
                    backgroundColor: active ? colors.primary : themeColors.card,
                    borderColor: active ? colors.primary : themeColors.border,
                }
            ]}
            onPress={onPress}
        >
            <Text style={[
                styles.sortChipText,
                { color: active ? themeColors.card : themeColors.text }
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
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

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollableContent: {
        flex: 1,
        minHeight: 0,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 24,
        fontFamily: fonts.bold,
        fontWeight: Number(fonts.weights.bold) as any,
    },
    statsContainer: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    statsScrollView: {
        flexGrow: 0,
    },
    statsRow: {
        gap: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: spacing.lg,
    },
    statChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
        borderWidth: 1,
        gap: spacing.xs,
        minHeight: 44,
        minWidth: 100,
        maxWidth: 140,
        justifyContent: "center",
        flexShrink: 0,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    statChipLabel: {
        fontSize: 14,
        fontFamily: fonts.medium,
        fontWeight: Number(fonts.weights.medium) as any,
    },
    statChipValue: {
        fontSize: 14,
        fontFamily: fonts.bold,
        fontWeight: Number(fonts.weights.bold) as any,
    },
    toolsContainer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        gap: spacing.md,
    },
    searchContainer: {
        width: "100%",
    },
    searchInput: {
        width: "100%",
    },
    sortContainer: {
        width: "100%",
    },
    sortScrollView: {
        flexGrow: 0,
    },
    sortRow: {
        gap: spacing.xs,
        paddingRight: spacing.lg,
    },
    sortChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 16,
        borderWidth: 1,
        minHeight: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    sortChipText: {
        fontSize: 14,
        fontFamily: fonts.medium,
        fontWeight: Number(fonts.weights.medium) as any,
    },
    bulkBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
    },
    bulkLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    bulkText: {
        fontSize: 14,
        fontFamily: fonts.medium,
        fontWeight: Number(fonts.weights.medium) as any,
    },
    bulkLink: {
        paddingVertical: spacing.xs,
    },
    bulkLinkText: {
        fontSize: 14,
        fontFamily: fonts.medium,
        color: colors.primary,
    },
    bulkDivider: {
        fontSize: 14,
        color: colors.textLight,
    },
    bulkActions: {
        gap: spacing.sm,
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
    panelTitle: {
        fontSize: 18,
        fontFamily: fonts.bold,
        marginBottom: spacing.lg,
    },
    emptyStateWrap: {
        paddingTop: spacing.sm,
    },
    panelContent: {
        gap: spacing.lg,
    },
    panelContentCompact: {
        gap: spacing.md,
    },
    personHeader: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        minHeight: 60,
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
    clearBtn: {
        padding: spacing.sm,
        minWidth: 44,
        minHeight: 44,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 22,
    },
    sectionLabel: {
        fontSize: 16,
        fontFamily: fonts.semibold,
        marginBottom: spacing.sm,
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
    },
    panelFooter: {
        flexDirection: "row",
        gap: spacing.sm,
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 50,
    },
    list: {
        flex: 1,
        minHeight: 0,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: 12,
        marginBottom: spacing.sm,
        borderWidth: 1,
        minHeight: 80,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    checkbox: {
        marginRight: spacing.md,
    },
    userInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    userName: {
        fontSize: 16,
        fontFamily: fonts.semibold,
    },
    userEmail: {
        fontSize: 14,
        fontFamily: fonts.regular,
        marginTop: spacing.xs,
    },
    userMeta: {
        marginTop: spacing.xs,
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
    rowActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    iconBtn: {
        padding: spacing.sm,
    },
    selectButton: {
        padding: spacing.sm,
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalView: {
        borderRadius: 20,
        padding: spacing.lg,
        width: "90%",
        maxWidth: 400,
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: fonts.bold,
        flex: 1,
    },
    closeButton: {
        padding: spacing.sm,
    },
    modalFooter: {
        flexDirection: "row",
        gap: spacing.sm,
        marginTop: spacing.lg,
    },
    footerButton: {
        flex: 1,
    },
    bulkRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: 8,
        marginBottom: spacing.sm,
        borderWidth: 1,
    },
    bulkRowText: {
        fontSize: 14,
        fontFamily: fonts.medium,
        flex: 1,
    },
})
