import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/Colors";
import { fonts } from "../constants/fonts";
import { spacing } from "../constants/spacing";
import { Class } from "../types";
import { Card } from "./Card";
import { useColorScheme } from "../hooks/useColorScheme";

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

interface ClassCardProps {
  classItem: Class;
}

export const ClassCard = ({ classItem }: ClassCardProps) => {
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
    router.push(`/class/${classItem.id}`);
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.subjectContainer}>
            <View style={styles.iconContainer}>
              <Feather name="book" size={24} color={colors.card} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.name, { color: themeColors.text }]}>{classItem.name}</Text>
              <Text style={[styles.subject, { color: themeColors.textLight }]}>{classItem.subject}</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={24} color={themeColors.textLight} />
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
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subjectContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: fonts.weights.bold as any,
    marginBottom: spacing.xs / 2,
  },
  subject: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
  },
  footer: {
    flexDirection: "row",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.lg,
  },
  infoText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    marginLeft: spacing.xs,
  },
});