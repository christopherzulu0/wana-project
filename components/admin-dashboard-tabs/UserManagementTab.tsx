"use client"

import { Feather } from "@expo/vector-icons"
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
import type { Class, User } from "../../types"
import { mockClasses, updateMockClass } from "../../utils/mockData"
import { Avatar } from "../Avatar"
import { Button } from "../Button"
import { Card } from "../Card"
import { EmptyState } from "../EmptyState"
import { Input } from "../Input"
import { UserFormModal } from "../UserFormModal"

type Role = "teacher" | "admin" | "student"
type RoleFilter = "all" | Role
type SortKey = "name" | "email" | "role"
type SortDir = "asc" | "desc"

export function UserManagementTab() {
    const { width } = useWindowDimensions()
    const { users, loading, error, addUser, updateUser, deleteUser, refetch } = useUsers()
    const { getAllClasses } = useClasses()
    const classes = getAllClasses()
    const classSearchHelper = useClassSearch()

    // UI state
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
    const [search, setSearch] = useState("")
    const [q, setQ] = useState("") // debounced search
    const [sortKey, setSortKey] = useState<SortKey>("name")
    const [sortDir, setSortDir] = useState<SortDir>("asc")

    // Selection and detail state
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [selectedTeacherClassIds, setSelectedTeacherClassIds] = useState<string[]>([])
    const [selectedStudentClassIdByUser, setSelectedStudentClassIdByUser] = useState<Record<string, string | null>>({})

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
        setSelectedUser(user)
        setSelectedRole(user.role as Role)
        const teacherClassIds =
            classes.filter((cls) => cls.teacherId === user.id).map((cls) => cls.id) || []
        setSelectedTeacherClassIds(teacherClassIds)
        setSelectedStudentClassIdByUser((prev) => ({
            ...prev,
            [user.id]: prev[user.id] ?? null,
        }))
    }

    const toggleTeacherClass = (classId: string) => {
        setSelectedTeacherClassIds((prev) =>
            prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId],
        )
    }

    const assignStudentClass = (classId: string) => {
        if (!selectedUser) return
        setSelectedStudentClassIdByUser((prev) => ({
            ...prev,
            [selectedUser.id]: classId,
        }))
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

    const applyChanges = async () => {
        if (!selectedUser || !selectedRole) return

        try {
            const updatedUser: User = { ...selectedUser, role: selectedRole }
            await updateUser(updatedUser)

            if (selectedRole === "teacher") {
                clearTeacherAssignmentsFor(selectedUser.id)
                selectedTeacherClassIds.forEach((classId) => {
                    const cls = classes.find((c) => c.id === classId)
                    if (cls) {
                        const updated: Class = {
                            ...cls,
                            teacherId: selectedUser.id,
                            teacherName: selectedUser.name,
                        }
                        updateMockClass(updated)
                    }
                })
                Alert.alert("Success", "Role and class assignments updated for the teacher.")
            } else if (selectedRole === "student") {
                const sel = selectedStudentClassIdByUser[selectedUser.id]
                if (sel) {
                    Alert.alert("Saved", `Assigned student to class ID: ${sel} (demo state only)`)
                } else {
                    Alert.alert("Saved", "Role updated to Student. No class assigned.")
                }
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update user. Please try again.")
            console.error('Error updating user:', error)
        }
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
                        if (selectedUser?.id === user.id) setSelectedUser(null)
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
        const isFocused = selectedUser?.id === item.id

        return (
            <TouchableOpacity
                style={[styles.userRow, isFocused && styles.userRowSelected]}
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
                        color={isSelected ? colors.primary : colors.textLight}
                    />
                </TouchableOpacity>

                <Avatar source={item.avatar} name={item.name} size={48} />

                <View style={styles.userInfo}>
                    <Text numberOfLines={1} style={styles.userName}>
                        {item.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.userEmail}>
                        {item.email}
                    </Text>
                    <View style={styles.userMeta}>
                        <RoleBadge role={item.role} />
                    </View>
                </View>

                <View style={styles.rowActions}>
                    <TouchableOpacity onPress={() => handleEditUser(item)} style={styles.iconBtn}>
                        <Feather name="edit" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteUser(item)} style={styles.iconBtn}>
                        <Feather name="trash-2" size={18} color={colors.danger} />
                    </TouchableOpacity>
                    <Feather name="chevron-right" size={18} color={colors.textLight} />
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Users</Text>
                <Button title="Add User" onPress={handleAddUser} variant="primary" size="small" />
            </View>

            {/* Stats chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.statsRow, { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }]}
                style={styles.statsScrollView}
                bounces={false}
                decelerationRate="fast"
            >
                <StatChip icon="users" label="All" value={stats.total} active={roleFilter === "all"} onPress={() => setRoleFilter("all")} />
                <StatChip icon="briefcase" label="Teachers" value={stats.teachers} active={roleFilter === "teacher"} onPress={() => setRoleFilter("teacher")} />
                <StatChip icon="user" label="Students" value={stats.students} active={roleFilter === "student"} onPress={() => setRoleFilter("student")} />
                <StatChip icon="shield" label="Admins" value={stats.admins} active={roleFilter === "admin"} onPress={() => setRoleFilter("admin")} />
            </ScrollView>

            {/* Search + Sort */}
            <View style={styles.toolsContainer}>
                <View style={styles.searchContainer}>
                    <Input
                        placeholder="Search by name, email, or role"
                        value={search}
                        onChangeText={setSearch}
                        leftIcon={<Feather name="search" size={18} color={colors.textLight} />}
                        style={styles.searchInput}
                    />
                </View>
                <View style={styles.sortContainer}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={styles.sortRow}
                        style={styles.sortScrollView}
                    >
                        <SortChip
                            label={`Name ${sortKey === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}`}
                            active={sortKey === "name"}
                            onPress={() => toggleSort("name")}
                        />
                        <SortChip
                            label={`Email ${sortKey === "email" ? (sortDir === "asc" ? "↑" : "↓") : ""}`}
                            active={sortKey === "email"}
                            onPress={() => toggleSort("email")}
                        />
                        <SortChip
                            label={`Role ${sortKey === "role" ? (sortDir === "asc" ? "↑" : "↓") : ""}`}
                            active={sortKey === "role"}
                            onPress={() => toggleSort("role")}
                        />
                    </ScrollView>
                </View>
            </View>

            {/* Bulk actions bar */}
            {hasSelection && (
                <Card variant="outlined" style={styles.bulkBar}>
                    <View style={styles.bulkLeft}>
                        <Text style={styles.bulkText}>{selectedIds.size} selected</Text>
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

            {/* Assign Panel (single user) */}
            <Card style={width < 420 ? [styles.assignPanel, styles.assignPanelCompact] : styles.assignPanel}>
                <Text style={styles.panelTitle}>Assign Roles & Classes</Text>
                {!selectedUser ? (
                    <View style={styles.emptyStateWrap}>
                        <EmptyState
                            title="No user selected"
                            message="Select a user from the list to manage their role and class assignments."
                            icon="users"
                        />
                    </View>
                ) : (
                    <View style={[styles.panelContent, width < 420 && styles.panelContentCompact]}>
                        <View style={[styles.personHeader, width < 420 && styles.personHeaderCompact]}>
                            <Avatar source={selectedUser.avatar} name={selectedUser.name} size={width < 420 ? 44 : 56} />
                            <View style={[styles.personInfo, width < 420 && styles.personInfoCompact]}>
                                <Text numberOfLines={2} style={styles.personName}>{selectedUser.name}</Text>
                                <Text numberOfLines={2} style={styles.personEmail}>{selectedUser.email}</Text>
                                <View style={{ marginTop: spacing.xs }}>
                                    <RoleBadge role={selectedUser.role} />
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.clearBtn}>
                                <Feather name="x" size={20} color={colors.textLight} />
                            </TouchableOpacity>
                        </View>

                        {/* Role Selector */}
                        <Text style={styles.sectionLabel}>Role</Text>
                        <View style={[styles.roleRow, width < 420 && styles.wrapRow]}>
                            {(["teacher", "admin", "student"] as Role[]).map((role) => {
                                const active = selectedRole === role
                                return (
                                    <TouchableOpacity
                                        key={role}
                                        style={[styles.roleChip, active && styles.roleChipActive]}
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
                                          
                                            color={active ? colors.card : colors.text}
                                        />
                                        <Text
                                            style={[
                                                styles.roleChipText,
                                                active && styles.roleChipTextActive,
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
                                <Text style={styles.sectionLabel}>Assigned Classes</Text>
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
                                                style={[styles.classChip, active && styles.classChipActive]}
                                                onPress={() => toggleTeacherClass(cls.id)}
                                            >
                                                <Feather
                                                    name="book"
                                                    size={16}
                                                    color={active ? colors.card : colors.text}
                                                />
                                                <Text
                                                    style={[
                                                        styles.classChipText,
                                                        active && styles.classChipTextActive,
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
                                <Text style={styles.sectionLabel}>Assign Class (Single)</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.chipsRow}
                                >
                                    {classes.map((cls) => {
                                        const active =
                                            selectedStudentClassIdByUser[selectedUser.id] === cls.id
                                        return (
                                            <TouchableOpacity
                                                key={cls.id}
                                                style={[styles.classChip, active && styles.classChipActive]}
                                                onPress={() => assignStudentClass(cls.id)}
                                            >
                                                <Feather
                                                    name="book"
                                                    size={16}
                                                    color={active ? colors.card : colors.text}
                                                />
                                                <Text
                                                    style={[
                                                        styles.classChipText,
                                                        active && styles.classChipTextActive,
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {cls.name} ({cls.section})
                                                </Text>
                                            </TouchableOpacity>
                                        )
                                    })}
                                </ScrollView>
                                <Text style={styles.hintText}>
                                    This is a design prototype. Student assignment is stored locally in this screen. In a real app, you’d create/update a Student record.
                                </Text>
                            </>
                        )}

                        {selectedRole === "admin" && (
                            <Text style={styles.hintText}>
                                Admins don’t have class assignments. Changing a teacher to admin will unassign them from their classes.
                            </Text>
                        )}

                        <View style={styles.panelFooter}>
                            <Button title="Apply Changes" onPress={applyChanges} variant="primary" style={{ flex: 1 }} />
                        </View>
                    </View>
                )}
            </Card>

            {/* Users List */}
            <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id}
                renderItem={renderUserItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
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
                    <View style={styles.modalView}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Set Role for {selectedIds.size} user(s)</Text>
                            <TouchableOpacity onPress={() => setIsBulkRoleModalOpen(false)} style={styles.closeButton}>
                                <Feather name="x" size={24} color={colors.textLight} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ gap: spacing.sm }}>
                            {(["teacher", "student", "admin"] as Role[]).map((r) => {
                                const active = bulkRole === r
                                return (
                                    <TouchableOpacity
                                        key={r}
                                        onPress={() => setBulkRole(r)}
                                        style={[styles.bulkRow, active && styles.bulkRowActive]}
                                    >
                                        <Feather
                                            name={r === "teacher" ? "briefcase" : r === "admin" ? "shield" : "user"}
                                            size={18}
                                            color={active ? colors.card : colors.text}
                                        />
                                        <Text style={[styles.bulkRowText, active && styles.bulkRowTextActive]}>
                                            {r.charAt(0).toUpperCase() + r.slice(1)}
                                        </Text>
                                        {active && <Feather name="check" size={18} color={colors.card} />}
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
                    <View style={styles.modalView}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Assign Classes to Teachers</Text>
                            <TouchableOpacity onPress={() => setIsBulkAssignModalOpen(false)} style={styles.closeButton}>
                                <Feather name="x" size={24} color={colors.textLight} />
                            </TouchableOpacity>
                        </View>

                        <Input
                            placeholder="Search classes"
                            value={classSearchHelper.value}
                            onChangeText={classSearchHelper.setValue}
                            leftIcon={<Feather name="search" size={18} color={colors.textLight} />}
                            style={{ marginBottom: spacing.md }}
                        />

                        <ScrollView style={{ maxHeight: 280 }}>
                            {classSearchHelper.filtered(classes).map((cls) => {
                                const active = bulkClassIds.includes(cls.id)
                                return (
                                    <TouchableOpacity
                                        key={cls.id}
                                        style={[styles.bulkRow, active && styles.bulkRowActive]}
                                        onPress={() =>
                                            setBulkClassIds((prev) =>
                                                prev.includes(cls.id)
                                                    ? prev.filter((id) => id !== cls.id)
                                                    : [...prev, cls.id],
                                            )
                                        }
                                    >
                                        <Text style={[styles.bulkRowText, active && styles.bulkRowTextActive]}>
                                            {cls.name} ({cls.section})
                                        </Text>
                                        {active && <Feather name="check" size={18} color={colors.card} />}
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
function StatChip({ icon, label, value, active, onPress }: {
    icon: string
    label: string
    value: number
    active: boolean
    onPress: () => void
}) {
    return (
        <TouchableOpacity
            style={[styles.statChip, active && styles.statChipActive]}
            onPress={onPress}
        >
            <Feather name={icon as any} size={16} color={active ? colors.card : colors.text} />
            <Text style={[styles.statChipLabel, active && styles.statChipLabelActive]}>
                {label}
            </Text>
            <Text style={[styles.statChipValue, active && styles.statChipValueActive]}>
                {value}
            </Text>
        </TouchableOpacity>
    )
}

function SortChip({ label, active, onPress }: {
    label: string
    active: boolean
    onPress: () => void
}) {
    return (
        <TouchableOpacity
            style={[styles.sortChip, active && styles.sortChipActive]}
            onPress={onPress}
        >
            <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
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
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: colors.card,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: 24,
        fontFamily: fonts.bold,
        fontWeight: Number(fonts.weights.bold) as any,
        color: colors.text,
    },
    statsScrollView: {
        flexGrow: 0,
        paddingTop:4,
        paddingBottom: 22,
    },
    statsRow: {
        gap: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        flexGrow: 0,
        flexShrink: 0,
        paddingVertical: spacing.lg,
    },
    statChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        marginVertical:50,
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs,
        minHeight: 44,
        minWidth: 120,
        maxWidth: 150,
        justifyContent: "center",
        flexShrink: 0,
        overflow: 'hidden',
        shadowColor: colors.text,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    statChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    statChipLabel: {
        fontSize: 14,
        fontFamily: fonts.medium,
        fontWeight: Number(fonts.weights.medium) as any,
        color: colors.text,
    },
    statChipLabelActive: {
        color: colors.card,
    },
    statChipValue: {
        fontSize: 14,
        fontFamily: fonts.bold,
        fontWeight: Number(fonts.weights.bold) as any,
        color: colors.text,
    },
    statChipValueActive: {
        color: colors.card,
    },
    toolsContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        gap: spacing.sm,
        minHeight: 60,
        backgroundColor: colors.background,
    },
    searchContainer: {
        width: "100%",
        minHeight: 50,
        justifyContent: "center",
    },
    searchInput: {
        flex: 1,
        minWidth: 0,
    },
    sortContainer: {
        width: "100%",
    },
    sortScrollView: {
        flexGrow: 0,
    },
    sortRow: {
        gap: spacing.xs,
    },
    sortChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sortChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    sortChipText: {
        fontSize: 14,
        fontFamily: fonts.medium,
        fontWeight: Number(fonts.weights.medium) as any,
        color: colors.text,
    },
    sortChipTextActive: {
        color: colors.card,
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
        color: colors.text,
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
        color: colors.text,
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
        color: colors.text,
    },
    personEmail: {
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.textLight,
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
        color: colors.text,
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
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs,
        minHeight: 44,
        minWidth: 100,
        justifyContent: "center",
        flexShrink: 0,
    },
    roleChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    roleChipText: {
        fontSize: 14,
        fontFamily: fonts.medium,
        color: colors.text,
        flexShrink: 1,
        textAlign: "center",
    },
    roleChipTextActive: {
        color: colors.card,
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
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs,
    },
    classChipActive: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    classChipText: {
        fontSize: 14,
        fontFamily: fonts.medium,
        color: colors.text,
    },
    classChipTextActive: {
        color: colors.card,
    },
    hintText: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: colors.textLight,
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
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.card,
        borderRadius: 12,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    userRowSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + "10",
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
        color: colors.text,
    },
    userEmail: {
        fontSize: 14,
        fontFamily: fonts.regular,
        color: colors.textLight,
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
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalView: {
        backgroundColor: colors.card,
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
        color: colors.text,
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
        backgroundColor: colors.background,
        borderRadius: 8,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    bulkRowActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    bulkRowText: {
        fontSize: 14,
        fontFamily: fonts.medium,
        color: colors.text,
        flex: 1,
    },
    bulkRowTextActive: {
        color: colors.card,
    },
})
