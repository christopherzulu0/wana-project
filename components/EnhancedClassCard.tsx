// EnhancedClassCard.tsx
"use client"

import React,{ useMemo, useCallback } from "react"
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { colors } from "../constants/Colors"
import { fonts } from "../constants/fonts"
import { spacing } from "../constants/spacing"
import { useColorScheme } from "../hooks/useColorScheme"
import type { Class } from "../types"
import { Card } from "./Card"
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated"

// ── Theme-aware colors ──
const darkTheme = {
  cardBg: "#0F1115",
  cardBorder: "#1A1D24",
  text: "#FAFBFC",
  textLight: "#9CA3B0",
  textTertiary: "#6B7280",
  teacherRowBg: "#16181E",
}

const lightTheme = {
  cardBg: "#FFFFFF",
  cardBorder: "#E1E4E8",
  text: "#0F1419",
  textLight: "#5F6B7A",
  textTertiary: "#8B95A5",
  teacherRowBg: "#F3F4F6",
}

// ── CORRECTED: subjectColors array (fixed "interpreter:" typo) ──
const subjectColors = [
  { bg: "#FF6B6B20", border: "#FF6B6B", text: "#FF6B6B" },
  { bg: "#4ECDC420", border: "#4ECDC4", text: "#4ECDC4" },
  { bg: "#FFD93D20", border: "#FFD93D", text: "#FFD93D" },
  { bg: "#6BCF7F20", border: "#6BCF7F", text: "#6BCF7F" },
  { bg: "#A78BFA20", border: "#A78BFA", text: "#A78BFA" }, // Fixed!
  { bg: "#F472B620", border: "#F472B6", text: "#F472B6" },
  { bg: "#FB923C20", border: "#FB923C", text: "#FB923C" },
]

interface EnhancedClassCardProps {
  classItem: Class
  onEdit?: (classItem: Class) => void
  onDelete?: (classItem: Class) => void
  onManageEnrollment?: (classItem: Class) => void
  showActions?: boolean
}

export const EnhancedClassCard = React.memo(
  ({
    classItem,
    onEdit,
    onDelete,
    onManageEnrollment,
    showActions = false,
  }: EnhancedClassCardProps) => {
    const router = useRouter()
    const colorScheme = useColorScheme() ?? 'dark'
    const isDark = colorScheme === 'dark'
    const theme = isDark ? darkTheme : lightTheme

    // ── Subject color based on name hash ──
    const subjectColorIndex = useMemo(() => {
      const hash = classItem.name
        .split("")
        .reduce((a, c) => a + c.charCodeAt(0), 0)
      return hash % subjectColors.length
    }, [classItem.name])
    const subj = subjectColors[subjectColorIndex]

    // ── Press animation ──
    const scale = useSharedValue(1)
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }))

    const onPressIn = useCallback(() => {
      scale.value = withSpring(0.98)
    }, [])
    const onPressOut = useCallback(() => {
      scale.value = withSpring(1)
    }, [])

    const handlePress = useCallback(() => {
      if (!showActions) {
        router.push(`/class/${classItem.id}`)
      }
    }, [showActions, classItem.id, router])

    return (
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={handlePress}
        style={styles.pressable}
      >
        <Animated.View style={[styles.cardContainer, animatedStyle]}>
          <Card
            variant="elevated"
            style={[styles.card, { borderColor: theme.cardBorder }]}
          >
            {/* ── Theme-aware Background ── */}
            <View style={StyleSheet.absoluteFillObject}>
              <View style={{ flex: 1, backgroundColor: theme.cardBg }} />
            </View>

            {/* ── Top Bar ── */}
            <View
              style={[
                styles.topBar,
                { backgroundColor: subj.bg, borderBottomColor: subj.border },
              ]}
            >
              <View style={styles.topBarContent}>
                <Feather name="book-open" size={18} color={subj.text} />
                {classItem.subject && (
                  <Text
                    style={[styles.topBarText, { color: subj.text }]}
                    numberOfLines={1}
                  >
                    {classItem.subject}
                  </Text>
                )}
              </View>
              <View style={[styles.sectionPill, { backgroundColor: subj.border }]}>
                <Text style={styles.sectionPillText}>{classItem.section}</Text>
              </View>
            </View>

            {/* ── Main Content ── */}
            <View style={styles.content}>
              <Text style={[styles.className, { color: theme.text }]} numberOfLines={2}>
                {classItem.name}
              </Text>

              {classItem.description && (
                <Text style={[styles.description, { color: theme.textLight }]} numberOfLines={2}>
                  {classItem.description}
                </Text>
              )}

              {/* ── Stats Row ── */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <View
                    style={[
                      styles.statIcon,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Feather name="users" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {classItem.totalStudents ?? 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textLight }]}>Students</Text>
                </View>

                {classItem.room && (
                  <View style={styles.stat}>
                    <View
                      style={[
                        styles.statIcon,
                        { backgroundColor: colors.success + "15" },
                      ]}
                    >
                      <Feather name="map-pin" size={18} color={colors.success} />
                    </View>
                    <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>
                      {classItem.room}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textLight }]}>Room</Text>
                  </View>
                )}

                {classItem.schedule && (
                  <View style={styles.stat}>
                    <View
                      style={[
                        styles.statIcon,
                        { backgroundColor: colors.warning + "15" },
                      ]}
                    >
                      <Feather name="clock" size={18} color={colors.warning} />
                    </View>
                    <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>
                      {classItem.schedule}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textLight }]}>Time</Text>
                  </View>
                )}
              </View>

              {/* ── Teacher Row ── */}
              {classItem.teacherName && (
                <View style={[styles.teacherRow, { backgroundColor: theme.teacherRowBg }]}>
                  <View
                    style={[
                      styles.teacherAvatar,
                      { backgroundColor: subj.bg, borderColor: subj.border },
                    ]}
                  >
                    <Text style={[styles.teacherInitial, { color: subj.text }]}>
                      {classItem.teacherName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.teacherInfo}>
                    <Text style={[styles.teacherLabel, { color: theme.textLight }]}>Instructor</Text>
                    <Text style={[styles.teacherName, { color: theme.text }]} numberOfLines={1}>
                      {classItem.teacherName}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* ── Actions or Chevron ── */}
            {showActions ? (
              <View style={[styles.actionsRow, { borderTopColor: theme.cardBorder }]}>
                {onManageEnrollment && (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { 
                        backgroundColor: colors.primary + "10",
                        borderRightColor: theme.cardBorder,
                      },
                    ]}
                    onPress={() => onManageEnrollment(classItem)}
                  >
                    <Feather name="users" size={20} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>
                      Enroll
                    </Text>
                  </TouchableOpacity>
                )}
                {onEdit && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderRightColor: theme.cardBorder }]}
                    onPress={() => onEdit(classItem)}
                  >
                    <Feather name="edit" size={20} color={theme.textLight} />
                    <Text style={[styles.actionText, { color: theme.textLight }]}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                )}
                {onDelete && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => onDelete(classItem)}
                  >
                    <Feather name="trash-2" size={20} color={colors.danger} />
                    <Text style={[styles.actionText, { color: colors.danger }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.chevron}>
                <Feather name="chevron-right" size={24} color={theme.textLight} />
              </View>
            )}
          </Card>
        </Animated.View>
      </Pressable>
    )
  }
)

// ── Styles ──
const styles = StyleSheet.create({
  pressable: {
    borderRadius: 24,
    marginBottom: spacing.md,
  },
  cardContainer: {
    borderRadius: 24,
    overflow: "hidden",
  },
  card: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1.5,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 2,
  },
  topBarContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  topBarText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  sectionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sectionPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  className: {
    fontSize: 22,
    fontFamily: fonts.regular,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 28,
  },
  description: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  stat: {
    flex: 1,
    minWidth: 80,
    alignItems: "center",
    gap: 6,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  teacherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
  },
  teacherAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  teacherInitial: {
    fontSize: 17,
    fontWeight: "800",
    color: "inherit",
  },
  teacherInfo: {
    flex: 1,
    gap: 2,
  },
  teacherLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  teacherName: {
    fontSize: 15,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    borderTopWidth: 1.5,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRightWidth: 1.5,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  chevron: {
    position: "absolute",
    right: 16,
    top: 16,
  },
})