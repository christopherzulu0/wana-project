"use client"

import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { colors } from "../constants/Colors"
import { fonts } from "../constants/fonts"
import { spacing } from "../constants/spacing"
import type { Class } from "../types"
import { Card } from "./Card"

interface EnhancedClassCardProps {
  classItem: Class
  onEdit?: (classItem: Class) => void
  onDelete?: (classItem: Class) => void
  showActions?: boolean
}

export const EnhancedClassCard = ({ classItem, onEdit, onDelete, showActions = false }: EnhancedClassCardProps) => {
  const router = useRouter()

  const handlePress = () => {
    if (!showActions) {
      router.push(`/class/${classItem.id}`)
    }
  }

  return (
    <TouchableOpacity activeOpacity={showActions ? 1 : 0.8} onPress={handlePress}>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.subjectContainer}>
            <View style={styles.iconContainer}>
              <Feather name="book" size={24} color={colors.card} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.name}>{classItem.name}</Text>
              <Text style={styles.subject}>{classItem.subject}</Text>
              <Text style={styles.teacher}>Teacher: {classItem.teacherName}</Text>
            </View>
          </View>
          {showActions ? (
            <View style={styles.actions}>
              {onEdit && (
                <TouchableOpacity onPress={() => onEdit(classItem)} style={styles.actionButton}>
                  <Feather name="edit" size={20} color={colors.primary} />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity onPress={() => onDelete(classItem)} style={styles.actionButton}>
                  <Feather name="trash-2" size={20} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Feather name="chevron-right" size={24} color={colors.textLight} />
          )}
        </View>

        {classItem.description && (
          <Text style={styles.description} numberOfLines={2}>
            {classItem.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.infoItem}>
            <Feather name="users" size={16} color={colors.textLight} />
            <Text style={styles.infoText}>{classItem.totalStudents} Students</Text>
          </View>

          <View style={styles.infoItem}>
            <Feather name="layers" size={16} color={colors.textLight} />
            <Text style={styles.infoText}>Section {classItem.section}</Text>
          </View>

          {classItem.schedule && (
            <View style={styles.infoItem}>
              <Feather name="clock" size={16} color={colors.textLight} />
              <Text style={styles.infoText}>{classItem.schedule}</Text>
            </View>
          )}

          {classItem.room && (
            <View style={styles.infoItem}>
              <Feather name="map-pin" size={16} color={colors.textLight} />
              <Text style={styles.infoText}>{classItem.room}</Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  subjectContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  subject: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.xs / 2,
  },
  teacher: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    color: colors.primary,
    fontWeight: fonts.weights.medium,
  },
  description: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.lg,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginLeft: spacing.xs,
  },
})
