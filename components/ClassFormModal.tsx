"use client"

import { Feather } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native"
import { colors } from "../constants/Colors"
import { fonts } from "../constants/fonts"
import { spacing } from "../constants/spacing"
import type { Class, User } from "../types"
import { Button } from "./Button"
import { Input } from "./Input"

interface ClassFormModalProps {
  isVisible: boolean
  onClose: () => void
  onSave: (classData: Omit<Class, "id" | "totalStudents" | "teacherName">) => void
  initialData?: Class | null
  teachers: User[]
}

export const ClassFormModal = ({ isVisible, onClose, onSave, initialData, teachers }: ClassFormModalProps) => {
  const [name, setName] = useState("")
  const [section, setSection] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [schedule, setSchedule] = useState("")
  const [room, setRoom] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setSection(initialData.section)
      setSubject(initialData.subject)
      setDescription(initialData.description || "")
      setSchedule(initialData.schedule || "")
      setRoom(initialData.room || "")
      setTeacherId(initialData.teacherId)
    } else {
      setName("")
      setSection("")
      setSubject("")
      setDescription("")
      setSchedule("")
      setRoom("")
      setTeacherId("")
    }
    setErrors({}) // Clear errors on modal open/initialData change
  }, [initialData, isVisible])

  const validate = () => {
    const newErrors: { [key: string]: string } = {}
    if (!name.trim()) newErrors.name = "Class name is required"
    if (!section.trim()) newErrors.section = "Section is required"
    if (!subject.trim()) newErrors.subject = "Subject is required"
     if (!room.trim()) newErrors.room = "room is required"
    if (!teacherId) newErrors.teacherId = "Please select a teacher"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) {
      const classData: Omit<Class, "id" | "totalStudents" | "teacherName"> = {
        name,
        section,
        subject,
        description,
        schedule,
        room,
        teacherId,
      }
      console.log('ClassFormModal - Submitting class data:', classData)
      console.log('ClassFormModal - Room value being submitted:', room)
      console.log('ClassFormModal - Is editing mode:', !!initialData)
      onSave(classData)
    }
  }

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{initialData ? "Edit Class" : "Add New Class"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={colors.textLight} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formContent}>
            <Input
              label="Class Name"
              placeholder="e.g., Computer Science"
              value={name}
              onChangeText={setName}
              error={errors.name}
            />
            <Input
              label="Section"
              placeholder="e.g., A, B, C"
              value={section}
              onChangeText={setSection}
              error={errors.section}
            />
            <Input
              label="Subject"
              placeholder="e.g., Programming, Mathematics"
              value={subject}
              onChangeText={setSubject}
              error={errors.subject}
            />
            <Input
              label="Description (Optional)"
              placeholder="Brief description of the class"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
            <Input
              label="Schedule (Optional)"
              placeholder="e.g., Mon, Wed, Fri - 9:00 AM"
              value={schedule}
              onChangeText={setSchedule}
            />
            <Input 
              label="Room (Optional)" 
              placeholder="e.g., Room 101, Lab 205" 
              value={room} 
              onChangeText={setRoom}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Assign Teacher</Text>
            {errors.teacherId && <Text style={styles.errorText}>{errors.teacherId}</Text>}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.teacherChips}>
              {teachers.map((teacher) => (
                <TouchableOpacity
                  key={teacher.id}
                  style={[styles.teacherChip, teacherId === String(teacher.id) && styles.selectedTeacher]}
                  onPress={() => setTeacherId(String(teacher.id))}
                >
                  <Text style={[styles.teacherText, teacherId === String(teacher.id) && styles.selectedTeacherText]}>
                    {teacher.name}
                  </Text>
                </TouchableOpacity>
              ))}
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
  errorText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  teacherChips: {
    paddingRight: spacing.lg,
    marginBottom: spacing.md,
  },
  teacherChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedTeacher: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  teacherText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.text,
    fontWeight: fonts.weights.medium,
  },
  selectedTeacherText: {
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
