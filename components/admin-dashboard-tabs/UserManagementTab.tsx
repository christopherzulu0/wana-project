// UserManagementTab.tsx
"use client"

import { Feather } from "@expo/vector-icons"
import { usePathname, useRouter } from "expo-router"
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
    Pressable,
    RefreshControl,
    ScrollView,
    Platform,
} from "react-native"
import { FlashList } from "@shopify/flash-list"
import Animated, {
    useSharedValue,
    withSpring,
    useAnimatedStyle,
    FadeIn,
    withTiming,
    withRepeat,
} from "react-native-reanimated"
import { colors } from "../../constants/Colors"
import { spacing } from "../../constants/spacing"
import { useClasses } from "../../hooks/useClasses"
import { useUsers } from "../../hooks/useUsers"
import type { Class, User } from "../../types"
import { mockClasses, updateMockClass } from "../../utils/mockData"
import { Avatar } from "../Avatar"
import { UserFormModal } from "../UserFormModal"

// ── ZAMBIAN DARK THEME ──
const theme = {
    bg: "#0B0E15",
    card: "#141820",
    surface: "#1C212A",
    text: "#FEFEFE",
    textLight: "#9CA3AF",
    textMuted: "#6B7280",
    border: "#2D3748",
    primary: colors.primary,
    success: colors.success,
    danger: colors.danger,
}

type Role = "teacher" | "admin" | "student"
type RoleFilter = "all" | Role
type SortKey = "name" | "email" | "role"
type SortDir = "asc" | "desc"

// ── useClassSearch Hook ──
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

// ── RESPONSIVE HOOK (WITH isTiny) ──
function useResponsive() {
    const { width } = useWindowDimensions()
    const isTablet = width >= 768
    const isLarge = width >= 1024
    const isTiny = width < 360
    const cols = isLarge ? 3 : isTablet ? 2 : 1
    const padding = isLarge ? spacing.xxl : isTablet ? spacing.xl : spacing.lg
    const fontScale = Math.min(width / 380, 1.3)
    return { width, isTablet, isLarge, isTiny, cols, padding, fontScale }
}

// ── Inline Input ──
const Input = ({ leftIcon, style, placeholder, value, onChangeText, placeholderTextColor }: any) => (
    <View style={[styles.inputContainer, style]}>
        {leftIcon}
        <TextInput
            style={styles.input}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            placeholderTextColor={placeholderTextColor}
        />
        {value ? (
            <TouchableOpacity onPress={() => onChangeText("")} style={styles.clearBtn}>
                <Feather name="x-circle" size={20} color={theme.primary} />
            </TouchableOpacity>
        ) : null}
    </View>
)

// ── Inline Button ──
const Button = ({ title, onPress, variant = "primary", size = "medium", style }: any) => {
    const bg = variant === "primary" ? theme.primary : variant === "outline" ? "transparent" : theme.surface
    const color = variant === "outline" ? theme.primary : "#FFF"
    const border = variant === "outline" ? `1.5px solid ${theme.primary}` : "none"
    const paddingVertical = size === "small" ? 8 : 12
    const fontSize = size === "small" ? 14 : 15

    return (
        <Pressable onPress={onPress} style={[styles.button, { backgroundColor: bg, borderWidth: border ? 1.5 : 0, borderColor: theme.primary, paddingVertical }, style]}>
            <Text style={{ color, fontSize, fontWeight: "600" }}>{title}</Text>
        </Pressable>
    )
}

// ── Inline Card ──
const Card = ({ children, style }: any) => (
    <View style={[styles.card, style]}>{children}</View>
)

// ── Inline EmptyState ──
const EmptyState = ({ icon, title, message, actionLabel, onAction }: any) => (
    <View style={styles.empty}>
        <Feather name={icon} size={56} color={theme.textMuted} />
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyMessage}>{message}</Text>
        <Button title={actionLabel} onPress={onAction} size="small" />
    </View>
)

// ── StatChip ──
const StatChip = React.memo(({ icon, label, value, active, onPress }: any) => {
    const scale = useSharedValue(1)
    const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
    return (
        <Pressable onPressIn={() => scale.value = withSpring(0.92)} onPressOut={() => scale.value = withSpring(1)} onPress={onPress}>
            <Animated.View style={[styles.statChip, active && styles.statChipActive, anim]}>
                <Feather name={icon} size={16} color={active ? "#FFF" : theme.text} />
                <Text style={[styles.statLabel, active && styles.statLabelActive]}>{label}</Text>
                <Text style={[styles.statValue, active && styles.statValueActive]}>{value}</Text>
            </Animated.View>
        </Pressable>
    )
})

// ── SortChip ──
const SortChip = React.memo(({ label, active, onPress }: any) => {
    const scale = useSharedValue(1)
    const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
    return (
        <Pressable onPressIn={() => scale.value = withSpring(0.92)} onPressOut={() => scale.value = withSpring(1)} onPress={onPress}>
            <Animated.View style={[styles.sortChip, active && styles.sortChipActive, anim]}>
                <Text style={[styles.sortText, active && styles.sortTextActive]}>{label}</Text>
            </Animated.View>
        </Pressable>
    )
})

// ── ROLE BADGE (COMPACT) ──
const RoleBadge = React.memo(({ role, fontScale = 1 }: { role: string; fontScale?: number }) => {
    const badge = {
        teacher: { bg: "#3B82F620", color: theme.primary, icon: "briefcase" },
        admin: { bg: "#EF444420", color: theme.danger, icon: "shield" },
        student: { bg: "#10B98120", color: theme.success, icon: "user" },
    }[role] || { bg: theme.textMuted + "20", color: theme.textMuted, icon: "help-circle" }

    const size = Math.min(11 * fontScale, 12)

    return (
        <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
            <Feather name={badge.icon} size={10} color={badge.color} />
            <Text style={[styles.roleText, { color: badge.color, fontSize: size }]}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
        </View>
    )
})

// ── 100% RESPONSIVE USER CARD (v10.0) ──
const UserRow = React.memo(({ user, isSelected, onPress, onToggle, onEdit, onDelete }: any) => {
    const { width, isTablet, isLarge, isTiny, fontScale } = useResponsive()
    const scale = useSharedValue(1)
    const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

    const avatarSize = isLarge ? 60 : isTablet ? 52 : 44
    const nameSize = Math.min(18 * fontScale, 19)
    const emailSize = Math.min(13 * fontScale, 14)
    const actionSize = isLarge ? 20 : isTablet ? 18 : 16

    return (
        <Pressable
            onPressIn={() => scale.value = withSpring(0.97)}
            onPressOut={() => scale.value = withSpring(1)}
            onPress={() => onPress(user)}
            style={{ paddingHorizontal: 6, paddingVertical: 6 }}
        >
            <Animated.View style={[styles.userCard, anim]}>
                {/* Checkbox */}
                <TouchableOpacity onPress={() => onToggle(user.id)} style={styles.checkbox}>
                    <Feather 
                        name={isSelected ? "check-square" : "square"} 
                        size={22} 
                        color={isSelected ? theme.primary : theme.textMuted} 
                    />
                </TouchableOpacity>

                {/* Avatar */}
                <Avatar source={user.avatar} name={user.name} size={avatarSize} />

                {/* Info - Wraps on small screens */}
                <View style={styles.infoContainer}>
                    <Text style={[styles.name, { fontSize: nameSize }]} numberOfLines={isTiny ? 2 : 1}>
                        {user.name}
                    </Text>
                    <Text style={[styles.email, { fontSize: emailSize }]} numberOfLines={isTiny ? 2 : 1}>
                        {user.email}
                    </Text>
                    <RoleBadge role={user.role} fontScale={fontScale} />
                </View>

                {/* Actions - Stack on tiny screens */}
                <View style={[styles.actions, isTiny && styles.actionsVertical]}>
                    <TouchableOpacity 
                        onPress={(e) => { e.stopPropagation(); onEdit(user) }} 
                        style={styles.actionBtn}
                    >
                        <Feather name="edit-3" size={actionSize} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={(e) => { e.stopPropagation(); onDelete(user) }} 
                        style={styles.actionBtn}
                    >
                        <Feather name="trash-2" size={actionSize} color={theme.danger} />
                    </TouchableOpacity>
                    <Feather name="chevron-right" size={actionSize + 2} color={theme.textMuted} />
                </View>
            </Animated.View>
        </Pressable>
    )
})

// ── Bulk Role Modal ──
const BulkRoleModal = React.memo(({ visible, onClose, count, role, setRole, onApply }: any) => {
    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <Animated.View entering={FadeIn} style={styles.modal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Set Role ({count})</Text>
                        <TouchableOpacity onPress={onClose}><Feather name="x" size={24} color={theme.textMuted} /></TouchableOpacity>
                    </View>
                    {(["teacher", "student", "admin"] as Role[]).map(r => (
                        <TouchableOpacity key={r} onPress={() => setRole(r)} style={[styles.bulkRow, role === r && styles.bulkRowActive]}>
                            <Feather name={r === "teacher" ? "briefcase" : r === "admin" ? "shield" : "user"} size={18} color={role === r ? "#FFF" : theme.text} />
                            <Text style={[styles.bulkText, role === r && styles.bulkTextActive]}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
                            {role === r && <Feather name="check" size={18} color="#FFF" />}
                        </TouchableOpacity>
                    ))}
                    <View style={styles.modalFooter}>
                        <Button title="Cancel" onPress={onClose} variant="outline" style={styles.footerBtn} />
                        <Button title="Apply" onPress={onApply} style={styles.footerBtn} />
                    </View>
                </Animated.View>
            </View>
        </Modal>
    )
})

// ── Bulk Assign Modal ──
const BulkAssignModal = React.memo(({ visible, onClose, classes, searchHelper, selected, setSelected, onApply }: any) => {
    const filtered = searchHelper.filtered(classes)
    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <Animated.View entering={FadeIn} style={styles.modal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Assign Classes</Text>
                        <TouchableOpacity onPress={onClose}><Feather name="x" size={24} color={theme.textMuted} /></TouchableOpacity>
                    </View>
                    <Input
                        leftIcon={<Feather name="search" size={18} color={theme.textMuted} />}
                        placeholder="Search classes"
                        value={searchHelper.value}
                        onChangeText={searchHelper.setValue}
                        placeholderTextColor={theme.textMuted}
                        style={{ marginBottom: spacing.md }}
                    />
                    <ScrollView style={{ maxHeight: 300 }}>
                        {filtered.map((cls: Class) => {
                            const active = selected.includes(cls.id)
                            return (
                                <TouchableOpacity
                                    key={cls.id}
                                    style={[styles.bulkRow, active && styles.bulkRowActive]}
                                    onPress={() => setSelected(prev => prev.includes(cls.id) ? prev.filter(id => id !== cls.id) : [...prev, cls.id])}
                                >
                                    <Text style={[styles.bulkText, active && styles.bulkTextActive]}>{cls.name} ({cls.section})</Text>
                                    {active && <Feather name="check" size={18} color="#FFF" />}
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                    <View style={styles.modalFooter}>
                        <Button title="Cancel" onPress={onClose} variant="outline" style={styles.footerBtn} />
                        <Button title="Assign" onPress={onApply} style={styles.footerBtn} />
                    </View>
                </Animated.View>
            </View>
        </Modal>
    )
})

// ── Shimmer Skeleton ──
const ShimmerSkeleton = () => {
    const translateX = useSharedValue(-300)
    useEffect(() => {
        translateX.value = withRepeat(withTiming(300, { duration: 1200 }), -1)
    }, [])
    const anim = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }))
    return (
        <View style={styles.skeleton}>
            {[...Array(6)].map((_, i) => (
                <View key={i} style={styles.skeletonRow}>
                    <View style={styles.skeletonAvatar} />
                    <View style={styles.skeletonInfo}>
                        <View style={[styles.skeletonLine, { width: 140 }]} />
                        <View style={[styles.skeletonLine, { width: 90 }]} />
                    </View>
                    <Animated.View style={[styles.shimmer, anim]} />
                </View>
            ))}
        </View>
    )
}

// ── Error State ──
const ErrorState = ({ error, onRetry }: any) => (
    <View style={styles.error}>
        <Feather name="alert-circle" size={56} color={theme.danger} />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Retry" onPress={onRetry} />
    </View>
)

// ── MAIN COMPONENT ──
export function UserManagementTab() {
    const router = useRouter()
    const pathname = usePathname()
    const { isTablet, isLarge, isTiny, cols, padding, fontScale } = useResponsive()
    const { users, loading, error, addUser, updateUser, deleteUser, refetch } = useUsers()
    const { getAllClasses } = useClasses()
    const classes = getAllClasses()
    const classSearchHelper = useClassSearch()

    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
    const [search, setSearch] = useState("")
    const [q, setQ] = useState("")
    const [sortKey, setSortKey] = useState<SortKey>("name")
    const [sortDir, setSortDir] = useState<SortDir>("asc")
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isUserFormOpen, setIsUserFormOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [isBulkRoleModalOpen, setIsBulkRoleModalOpen] = useState(false)
    const [bulkRole, setBulkRole] = useState<Role>("teacher")
    const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false)
    const [bulkClassIds, setBulkClassIds] = useState<string[]>([])

    const prevPathname = useRef<string | null>(null)
    const lastRefetchTime = useRef<number>(0)

    useEffect(() => {
        const wasOnAssignScreen = prevPathname.current?.includes('/user/') && prevPathname.current?.includes('/assign')
        const isNowOnDashboard = pathname?.includes('admin-dashboard') || pathname === '/admin-dashboard'
        if (wasOnAssignScreen && isNowOnDashboard) {
            const now = Date.now()
            if (now - lastRefetchTime.current > 500) {
                lastRefetchTime.current = now
                setTimeout(() => refetch(), 100)
            }
        }
        prevPathname.current = pathname || null
    }, [pathname, refetch])

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setQ(search.trim().toLowerCase()), 220)
        return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }, [search])

    const stats = useMemo(() => {
        let teachers = 0, admins = 0, students = 0
        users.forEach(u => {
            if (u.role === "teacher") teachers++
            else if (u.role === "admin") admins++
            else if (u.role === "student") students++
        })
        return { total: users.length, teachers, admins, students }
    }, [users])

    const filteredUsers = useMemo(() => {
        let arr = users
        if (roleFilter !== "all") arr = arr.filter(u => u.role === roleFilter)
        if (q) arr = arr.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q))
        arr = [...arr].sort((a, b) => {
            let vA: string, vB: string
            switch (sortKey) {
                case "email": vA = a.email.toLowerCase(); vB = b.email.toLowerCase(); break
                case "role": vA = a.role.toLowerCase(); vB = b.role.toLowerCase(); break
                case "name": default: vA = a.name.toLowerCase(); vB = b.name.toLowerCase()
            }
            return (vA < vB ? -1 : vA > vB ? 1 : 0) * (sortDir === "asc" ? 1 : -1)
        })
        return arr
    }, [users, roleFilter, q, sortKey, sortDir])

    const toggleSort = useCallback((key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
        else { setSortKey(key); setSortDir("asc") }
    }, [sortKey])

    const handleSelectUser = useCallback((user: User) => {
        router.push({ pathname: "/user/[id]/assign", params: { id: user.id } } as any)
    }, [router])

    const clearTeacherAssignmentsFor = useCallback((userId: string) => {
        mockClasses.filter(c => c.teacherId === userId).forEach(cls => {
            updateMockClass({ ...cls, teacherId: "", teacherName: "Unassigned" })
        })
    }, [])

    const handleAddUser = () => { setEditingUser(null); setIsUserFormOpen(true) }
    const handleEditUser = (user: User) => { setEditingUser(user); setIsUserFormOpen(true) }

    const handleDeleteUser = (user: User) => {
        Alert.alert("Delete User", `Delete ${user.name}?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                try {
                    await deleteUser(user.id)
                    setSelectedIds(prev => { const n = new Set(prev); n.delete(user.id); return n })
                    Alert.alert("Deleted", `${user.name} removed.`)
                } catch { Alert.alert("Error", "Failed to delete.") }
            }}
        ])
    }

    const toggleSelect = (id: string) => setSelectedIds(prev => {
        const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
    })
    const selectAll = () => setSelectedIds(new Set(filteredUsers.map(u => u.id)))
    const clearSelection = () => setSelectedIds(new Set())

    const applyBulkRole = () => {
        Array.from(selectedIds).forEach(id => {
            const u = users.find(x => x.id === id)
            if (!u) return
            if (u.role === "teacher" && bulkRole !== "teacher") clearTeacherAssignmentsFor(u.id)
            updateUser({ ...u, role: bulkRole })
        })
        setIsBulkRoleModalOpen(false)
        Alert.alert("Updated", `Role set to ${bulkRole}.`)
    }

    const applyBulkUnassignTeacherClasses = () => {
        let affected = 0
        Array.from(selectedIds).forEach(id => {
            const u = users.find(x => x.id === id)
            if (u?.role === "teacher") { clearTeacherAssignmentsFor(id); affected++ }
        })
        Alert.alert("Unassigned", `Cleared ${affected} teacher(s).`)
    }

    const applyBulkAssignClasses = () => {
        let affected = 0
        Array.from(selectedIds).forEach(id => {
            const u = users.find(x => x.id === id)
            if (u?.role !== "teacher") return
            clearTeacherAssignmentsFor(id)
            bulkClassIds.forEach(classId => {
                const cls = classes.find(c => c.id === classId)
                if (cls) updateMockClass({ ...cls, teacherId: id, teacherName: u.name })
            })
            affected++
        })
        setIsBulkAssignModalOpen(false)
        Alert.alert("Assigned", `Assigned to ${affected} teacher(s).`)
    }

    const bulkDelete = () => {
        const ids = Array.from(selectedIds)
        if (!ids.length) return
        Alert.alert("Delete Users", `Delete ${ids.length} user(s)?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                try {
                    for (const id of ids) {
                        const u = users.find(x => x.id === id)
                        if (u?.role === "teacher") clearTeacherAssignmentsFor(id)
                        await deleteUser(id)
                    }
                    clearSelection()
                    Alert.alert("Deleted", `${ids.length} removed.`)
                } catch { Alert.alert("Error", "Failed.") }
            }}
        ])
    }

    const renderUserItem = useCallback(({ item }: { item: User }) => {
        const isSelected = selectedIds.has(item.id)
        return <UserRow user={item} isSelected={isSelected} onPress={handleSelectUser} onToggle={toggleSelect} onEdit={handleEditUser} onDelete={handleDeleteUser} />
    }, [selectedIds, handleSelectUser, toggleSelect, handleEditUser, handleDeleteUser])

    if (loading && !users.length) return <ShimmerSkeleton />
    if (error) return <ErrorState error={error} onRetry={refetch} />

    return (
        <View style={[styles.container, { paddingHorizontal: padding }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { fontSize: 28 * fontScale }]}>Users</Text>
                <Button title="Add User" onPress={handleAddUser} size="small" />
            </View>

            {/* Stats */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
                <View style={styles.statsContainer}>
                    <StatChip icon="users" label="All" value={stats.total} active={roleFilter === "all"} onPress={() => setRoleFilter("all")} />
                    <StatChip icon="briefcase" label="Teachers" value={stats.teachers} active={roleFilter === "teacher"} onPress={() => setRoleFilter("teacher")} />
                    <StatChip icon="user" label="Students" value={stats.students} active={roleFilter === "student"} onPress={() => setRoleFilter("student")} />
                    <StatChip icon="shield" label="Admins" value={stats.admins} active={roleFilter === "admin"} onPress={() => setRoleFilter("admin")} />
                </View>
            </ScrollView>

            {/* Toolbar */}
            <View style={[styles.toolbar, (isTablet || isLarge) && styles.toolbarTablet]}>
                <Input
                    leftIcon={<Feather name="search" size={18} color={theme.textMuted} />}
                    placeholder="Name, email, role..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor={theme.textMuted}
                    style={styles.searchBox}
                />
                <View style={[styles.sortChips, (isTablet || isLarge) && styles.sortChipsTablet]}>
                    <SortChip label={`Name ${sortKey === "name" ? (sortDir === "asc" ? "up" : "down") : ""}`} active={sortKey === "name"} onPress={() => toggleSort("name")} />
                    <SortChip label={`Email ${sortKey === "email" ? (sortDir === "asc" ? "up" : "down") : ""}`} active={sortKey === "email"} onPress={() => toggleSort("email")} />
                    <SortChip label={`Role ${sortKey === "role" ? (sortDir === "asc" ? "up" : "down") : ""}`} active={sortKey === "role"} onPress={() => toggleSort("role")} />
                </View>
            </View>

            {/* Bulk Bar */}
            {selectedIds.size > 0 && (
                <Card style={styles.bulkBar}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.bulkActionsFull}>
                            <Text style={styles.bulkText}>{selectedIds.size} selected</Text>
                            <TouchableOpacity onPress={selectAll}><Text style={styles.bulkLink}>All</Text></TouchableOpacity>
                            <Text style={styles.bulkDivider}>•</Text>
                            <TouchableOpacity onPress={clearSelection}><Text style={styles.bulkLink}>Clear</Text></TouchableOpacity>
                            <View style={styles.bulkButtons}>
                                <Button title="Role" onPress={() => setIsBulkRoleModalOpen(true)} size="small" />
                                <Button title="Classes" onPress={() => setIsBulkAssignModalOpen(true)} variant="secondary" size="small" />
                                <Button title="Unassign" onPress={applyBulkUnassignTeacherClasses} variant="secondary" size="small" />
                                <Button title="Delete" onPress={bulkDelete} variant="outline" size="small" />
                            </View>
                        </View>
                    </ScrollView>
                </Card>
            )}

            {/* List */}
            <FlashList
                data={filteredUsers}
                numColumns={cols}
                estimatedItemSize={86}
                keyExtractor={item => item.id}
                renderItem={renderUserItem}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={theme.primary} />}
                ListEmptyComponent={
                    <EmptyState
                        icon="users"
                        title={search ? "No matches" : "No users"}
                        message={search ? "Try another search" : "Add your first user"}
                        actionLabel="Add User"
                        onAction={handleAddUser}
                    />
                }
                contentContainerStyle={{ paddingBottom: spacing.xl }}
            />

            {/* Modals */}
            <UserFormModal
                isVisible={isUserFormOpen}
                onClose={() => setIsUserFormOpen(false)}
                initialData={editingUser}
                onSave={async (data) => {
                    try {
                        editingUser ? await updateUser({ ...editingUser, ...data }) : await addUser(data as any)
                        setIsUserFormOpen(false)
                        Alert.alert("Success", editingUser ? "Updated" : "Created")
                    } catch { Alert.alert("Error", "Failed") }
                }}
            />

            <BulkRoleModal
                visible={isBulkRoleModalOpen}
                onClose={() => setIsBulkRoleModalOpen(false)}
                count={selectedIds.size}
                role={bulkRole}
                setRole={setBulkRole}
                onApply={applyBulkRole}
            />

            <BulkAssignModal
                visible={isBulkAssignModalOpen}
                onClose={() => setIsBulkAssignModalOpen(false)}
                classes={classes}
                searchHelper={classSearchHelper}
                selected={bulkClassIds}
                setSelected={setBulkClassIds}
                onApply={applyBulkAssignClasses}
            />
        </View>
    )
}

// ── STYLES (NO OVERFLOW, FULLY RESPONSIVE) ──
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: spacing.xl, marginBottom: spacing.md },
    title: { fontWeight: "800", color: theme.text, letterSpacing: -0.5 },
    statsScroll: { maxHeight: 80 },
    statsContainer: { flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.md },
    statChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: 20, backgroundColor: theme.card, borderWidth: 1.5, borderColor: theme.border, gap: spacing.xs, minWidth: 100, justifyContent: "center" },
    statChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    statLabel: { fontSize: 14, color: theme.textMuted, fontWeight: "500" },
    statLabelActive: { color: "#FFF" },
    statValue: { fontSize: 14, color: theme.text, fontWeight: "700" },
    statValueActive: { color: "#FFF" },
    toolbar: { gap: spacing.md, marginBottom: spacing.md },
    toolbarTablet: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
    inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: theme.card, borderRadius: 16, paddingHorizontal: spacing.lg, height: 56, borderWidth: 1.5, borderColor: theme.border },
    input: { flex: 1, marginLeft: spacing.sm, color: theme.text, fontSize: 16 },
    clearBtn: { padding: spacing.xs },
    sortChips: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
    sortChipsTablet: { flex: 1, justifyContent: "flex-end" },
    sortChip: { paddingHorizontal: spacing.md, paddingVertical: 9, borderRadius: 16, backgroundColor: theme.card, borderWidth: 1.5, borderColor: theme.border },
    sortChipActive: { backgroundColor: theme.primary + "18", borderColor: theme.primary },
    sortText: { fontSize: 13.5, color: theme.textMuted, fontWeight: "500" },
    sortTextActive: { color: theme.primary },
    bulkBar: { marginHorizontal: 0, marginBottom: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1.5, borderColor: theme.border },
    bulkActionsFull: { flexDirection: "row", alignItems: "center", gap: spacing.md, flexWrap: "wrap" },
    bulkText: { fontSize: 14, color: theme.text, fontWeight: "500" },
    bulkLink: { paddingVertical: spacing.xs, color: theme.primary },
    bulkDivider: { fontSize: 14, color: theme.textMuted },
    bulkButtons: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
    button: { paddingHorizontal: spacing.lg, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    card: { backgroundColor: theme.card, borderRadius: 16, padding: spacing.md, borderWidth: 1.5, borderColor: theme.border },
    // ── RESPONSIVE CARD ──
    userCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.card,
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1.5,
        borderColor: theme.border,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        marginBottom: 10,
        minHeight: 76,
    },
    checkbox: { marginRight: 10 },
    infoContainer: { 
        flex: 1, 
        marginLeft: 12, 
        gap: 2,
        flexShrink: 1,
        minWidth: 0,
    },
    name: { 
        fontWeight: "700", 
        color: theme.text, 
        includeFontPadding: false,
        flexShrink: 1,
    },
    email: { 
        fontWeight: "500", 
        color: theme.textLight, 
        includeFontPadding: false,
        flexShrink: 1,
    },
    roleBadge: { 
        flexDirection: "row", 
        alignItems: "center", 
        alignSelf: "flex-start", 
        paddingHorizontal: 8, 
        paddingVertical: 3, 
        borderRadius: 12, 
        gap: 4, 
        marginTop: 2 
    },
    roleText: { fontWeight: "600" },
    actions: { 
        flexDirection: "row", 
        alignItems: "center", 
        gap: 8 
    },
    actionsVertical: { 
        flexDirection: "column", 
        gap: 6 
    },
    actionBtn: { 
        width: 38, 
        height: 38, 
        backgroundColor: theme.surface, 
        borderRadius: 19, 
        justifyContent: "center", 
        alignItems: "center",
        borderWidth: 1.2,
        borderColor: theme.border,
    },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: spacing.lg },
    modal: { backgroundColor: theme.card, borderRadius: 24, padding: spacing.xl, width: "100%", maxWidth: 500, maxHeight: "85%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
    modalTitle: { fontSize: 18, fontWeight: "700", color: theme.text, flex: 1 },
    bulkRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: 12, marginBottom: spacing.sm, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border },
    bulkRowActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    bulkText: { fontSize: 14, color: theme.text, fontWeight: "500", flex: 1 },
    bulkTextActive: { color: "#FFF" },
    modalFooter: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
    footerBtn: { flex: 1 },
    skeleton: { padding: spacing.lg, gap: spacing.lg },
    skeletonRow: { flexDirection: "row", padding: spacing.lg, backgroundColor: theme.card, borderRadius: 16, gap: spacing.lg, overflow: "hidden", position: "relative" },
    skeletonAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.border },
    skeletonInfo: { flex: 1, gap: 10 },
    skeletonLine: { height: 16, borderRadius: 8, backgroundColor: theme.border },
    shimmer: { position: "absolute", top: 0, left: 0, width: 100, height: "100%", backgroundColor: "rgba(255,255,255,0.1)" },
    error: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl, gap: spacing.lg },
    errorTitle: { fontSize: 20, fontWeight: "700", color: theme.text },
    errorText: { color: theme.danger, fontSize: 16, textAlign: "center", marginBottom: spacing.lg },
    empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl, gap: spacing.lg },
    emptyTitle: { fontSize: 20, fontWeight: "700", color: theme.text },
    emptyMessage: { fontSize: 16, color: theme.textLight, textAlign: "center", marginBottom: spacing.lg },
    searchBox: { flex: 1, minWidth: 200 },
})