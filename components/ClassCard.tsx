import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/Colors";
import { fonts } from "../constants/fonts";
import { spacing } from "../constants/spacing";
import { Class } from "../types";
import { useColorScheme } from "../hooks/useColorScheme";

// Dark mode color palette
const darkColors = {
  background: "#0F1115",
  card: "#1A1D24",
  text: "#ECEDEE",
  textLight: "#9BA1A6",
  textExtraLight: "#6C757D",
  border: "#2A2D2E",
  borderLight: "#252829",
}

interface ClassCardProps {
  classItem: Class;
  requestCount?: number;
  onPress?: () => void;
}

export const ClassCard = ({ classItem, requestCount, onPress }: ClassCardProps) => {
  const router = useRouter();
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

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/class/${classItem.id}`);
    }
  };

  // Enhanced background colors
  const cardBg = isDark ? '#1E2228' : '#FFFFFF'
  const borderColor = isDark ? '#2D3139' : '#E5E7EB'
  const shadowColor = isDark ? '#000000' : '#1F2937'

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={styles.touchable}>
      <View style={[
        styles.cardContainer,
        {
          backgroundColor: cardBg,
          borderColor,
          shadowColor,
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: isDark ? 12 : 8,
          elevation: isDark ? 6 : 4,
        }
      ]}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.subjectContainer}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="book" size={24} color={colors.primary} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.name, { color: themeColors.text }]}>{classItem.name}</Text>
                <Text style={[styles.subject, { color: themeColors.textLight }]}>{classItem.subject}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              {requestCount !== undefined && requestCount > 0 && (
                <View style={[styles.requestBadge, { backgroundColor: colors.warning }]}>
                  <Text style={styles.requestBadgeText}>{requestCount}</Text>
                </View>
              )}
              <Feather name="chevron-right" size={20} color={themeColors.textLight} />
            </View>
          </View>

          <View style={[styles.footer, { borderTopColor: themeColors.borderLight }]}>
            <View style={styles.infoItem}>
              <Feather name="users" size={16} color={themeColors.textLight} />
              <Text style={[styles.infoText, { color: themeColors.textLight }]}>{classItem.totalStudents} Students</Text>
            </View>

            <View style={styles.infoItem}>
              <Feather name="layers" size={16} color={themeColors.textLight} />
              <Text style={[styles.infoText, { color: themeColors.textLight }]}>Section {classItem.section}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    marginBottom: spacing.md,
  },
  cardContainer: {
    borderRadius: spacing.lg,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
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
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: "600" as const,
    marginBottom: spacing.xs / 2,
  },
  subject: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: "400" as const,
  },
  footer: {
    flexDirection: "row",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    marginLeft: spacing.xs,
    fontWeight: "400" as const,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  requestBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: spacing.xs / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestBadgeText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold as any,
    color: colors.card,
  },
});