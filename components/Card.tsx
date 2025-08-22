import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../constants/Colors";
import { spacing } from "../constants/spacing";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "outlined" | "elevated";
}

export const Card = ({ children, style, variant = "default" }: CardProps) => {
  const getCardStyle = () => {
    switch (variant) {
      case "default":
        return styles.defaultCard;
      case "outlined":
        return styles.outlinedCard;
      case "elevated":
        return styles.elevatedCard;
      default:
        return styles.defaultCard;
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
    backgroundColor: colors.card,
  },
  defaultCard: {
    backgroundColor: colors.card,
  },
  outlinedCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevatedCard: {
    backgroundColor: colors.card,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});