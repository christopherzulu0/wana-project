import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { colors } from "../constants/Colors";
import { fonts } from "../constants/fonts";
import { spacing } from "../constants/spacing";
import { Button } from "./Button";

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
  const isCompact = width < 420;
  const circleSize = isCompact ? 64 : 80;
  const iconSize = isCompact ? 36 : 48;
  const containerPadding = isCompact ? spacing.lg : spacing.xl;

  return (
    <View style={[styles.container, { padding: containerPadding }]}>
      <View style={[styles.iconContainer, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]}>
        <Feather name={icon} size={iconSize} color={colors.textLight} />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
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
    backgroundColor: colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: Number(fonts.weights.bold) as any,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  button: {
    minWidth: 150,
  },
});