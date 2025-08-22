"use client"

import { Feather } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native"
import { colors } from "../constants/Colors"
import { fonts } from "../constants/fonts"
import { spacing } from "../constants/spacing"
import type { User } from "../types"
import { Button } from "./Button"
import { Input } from "./Input"

interface UserFormModalProps {
  isVisible: boolean
  onClose: () => void
  onSave: (userData: Omit<User, "id">) => void
  initialData?: User | null
}

export const UserFormModal = ({ isVisible, onClose, onSave, initialData }: UserFormModalProps) => {
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
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{initialData ? "Edit User" : "Add New User"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={colors.textLight} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formContent}>
            <Input
              label="Name"
              placeholder="Enter user's name"
              value={name}
              onChangeText={setName}
              error={errors.name}
            />
            <Input
              label="Email"
              placeholder="Enter user's email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Input
              label="Password"
              placeholder={initialData ? "Leave blank to keep current" : "Enter password"}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            <Text style={styles.label}>Role</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.roleScrollContainer}
              style={styles.roleScrollView}
            >
              <TouchableOpacity
                style={[styles.roleOption, role === "teacher" && styles.selectedRole]}
                onPress={() => setRole("teacher")}
              >
                <Text style={[styles.roleText, role === "teacher" && styles.selectedRoleText]}>Teacher</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, role === "student" && styles.selectedRole]}
                onPress={() => setRole("student")}
              >
                <Text style={[styles.roleText, role === "student" && styles.selectedRoleText]}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, role === "admin" && styles.selectedRole]}
                onPress={() => setRole("admin")}
              >
                <Text style={[styles.roleText, role === "admin" && styles.selectedRoleText]}>Administrator</Text>
              </TouchableOpacity>
            </ScrollView>
          </ScrollView>
          <View style={styles.modalFooter}>
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
    backgroundColor: colors.card,
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
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    color: colors.text,
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
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  roleScrollView: {
    backgroundColor: colors.borderLight,
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
    color: colors.text,
  },
  selectedRoleText: {
    color: colors.card,
    fontWeight: fonts.weights.semibold,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
})
