import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { colors } from "../constants/Colors";
import { fonts } from "../constants/fonts";
import { spacing } from "../constants/spacing";
import { Button } from "./Button";
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

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: keyof typeof Feather.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ 
  title, 
  message, 
  icon = "inbox", 
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'
  
  const isCompact = width < 420;
  const circleSize = isCompact ? 64 : 80;
  const iconSize = isCompact ? 36 : 48;
  const containerPadding = isCompact ? spacing.lg : spacing.xl;

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

  return (
    <View style={[styles.container, { padding: containerPadding }]}>
      <View style={[styles.iconContainer, { width: circleSize, height: circleSize, borderRadius: circleSize / 2, backgroundColor: themeColors.borderLight }]}>
        <Feather name={icon} size={iconSize} color={themeColors.textLight} />
      </View>
      
      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: themeColors.textLight }]}>{message}</Text>
      
      {actionLabel && onAction && (
        <Button 
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: Number(fonts.weights.bold) as any,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  button: {
    minWidth: 150,
  },
});