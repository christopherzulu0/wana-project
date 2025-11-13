import React, { useMemo } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../constants/Colors";
import { spacing } from "../constants/spacing";
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

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "outlined" | "elevated";
}

export const Card = ({ children, style, variant = "default" }: CardProps) => {
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'

  // Theme-aware colors
  const themeColors = useMemo(() => ({
    card: isDark ? darkColors.card : colors.card,
    border: isDark ? darkColors.border : colors.border,
    text: isDark ? darkColors.text : colors.text,
  }), [isDark])

  const getCardStyle = () => {
    const baseStyle = { backgroundColor: themeColors.card }
    
    switch (variant) {
      case "default":
        return baseStyle;
      case "outlined":
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: themeColors.border,
        };
      case "elevated":
        return {
          ...baseStyle,
          shadowColor: themeColors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 4,
          elevation: 3,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <View style={[styles.card, getCardStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: spacing.md,
    padding: spacing.md,
  },
});