"use client"

import { Feather } from "@expo/vector-icons"
import { useEffect, useMemo, useState } from "react"
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native"
import { colors } from "../constants/Colors"
import { fonts } from "../constants/fonts"
import { spacing } from "../constants/spacing"
import { useColorScheme } from "../hooks/useColorScheme"
import type { User } from "../types"
import { Button } from "./Button"
import { Input } from "./Input"

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

interface UserFormModalProps {
  isVisible: boolean
  onClose: () => void
  onSave: (userData: Omit<User, "id">) => void
  initialData?: User | null
}

export const UserFormModal = ({ isVisible, onClose, onSave, initialData }: UserFormModalProps) => {
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
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"teacher" | "admin" | "student">("teacher")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setEmail(initialData.email)
      setPassword("") // Password is not pre-filled for security
      setRole(initialData.role)
    } else {
      setName("")
      setEmail("")
      setPassword("")
      setRole("teacher")
    }
    setErrors({}) // Clear errors on modal open/initialData change
  }, [initialData, isVisible])

  const validate = () => {
    const newErrors: { [key: string]: string } = {}
    if (!name.trim()) newErrors.name = "Name is required"
    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid"
    }
    if (!initialData && !password.trim()) newErrors.password = "Password is required for new users"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) {
      const userData: Omit<User, "id"> = {
        name,
        email,
        password: password || "default_password", // Use existing or a placeholder if not changed
        role,
        avatar:
          initialData?.avatar ||
          `https://ui-avatars.com/api/?name=${name.replace(/\s/g, "+")}&background=random&color=fff`,
      }
      onSave(userData)
    }
  }

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: themeColors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: themeColors.borderLight }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>{initialData ? "Edit User" : "Add New User"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={themeColors.textLight} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formContent}>
            <Input
              label="Name"
              placeholder="Enter user's name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              themeColors={themeColors}
            />
            <Input
              label="Email"
              placeholder="Enter user's email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              themeColors={themeColors}
            />
            <Input
              label="Password"
              placeholder={initialData ? "Leave blank to keep current" : "Enter password"}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
              themeColors={themeColors}
            />

            <Text style={[styles.label, { color: themeColors.text }]}>Role</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.roleScrollContainer}
              style={[styles.roleScrollView, { backgroundColor: themeColors.borderLight }]}
            >
              <TouchableOpacity
                style={[styles.roleOption, role === "teacher" && { backgroundColor: colors.primary }]}
                onPress={() => setRole("teacher")}
              >
                <Text style={[styles.roleText, { color: role === "teacher" ? themeColors.card : themeColors.text }, role === "teacher" && styles.selectedRoleText]}>Teacher</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, role === "student" && { backgroundColor: colors.primary }]}
                onPress={() => setRole("student")}
              >
                <Text style={[styles.roleText, { color: role === "student" ? themeColors.card : themeColors.text }, role === "student" && styles.selectedRoleText]}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, role === "admin" && { backgroundColor: colors.primary }]}
                onPress={() => setRole("admin")}
              >
                <Text style={[styles.roleText, { color: role === "admin" ? themeColors.card : themeColors.text }, role === "admin" && styles.selectedRoleText]}>Administrator</Text>
              </TouchableOpacity>
            </ScrollView>
          </ScrollView>
          <View style={[styles.modalFooter, { borderTopColor: themeColors.borderLight }]}>
            <Button title="Cancel" onPress={onClose} variant="outline" style={styles.footerButton} />
            <Button title="Save" onPress={handleSubmit} variant="primary" style={styles.footerButton} />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: spacing.lg,
    borderRadius: spacing.md,
    padding: spacing.lg,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  formContent: {
    paddingBottom: spacing.md,
  },
  label: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  roleScrollView: {
    borderRadius: spacing.sm,
    marginBottom: spacing.md,
  },
  roleScrollContainer: {
    flexDirection: "row",
  },
  roleOption: {
    minWidth: 100,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedRole: {
    backgroundColor: colors.primary,
  },
  roleText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
  },
  selectedRoleText: {
    fontWeight: fonts.weights.semibold,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
})
