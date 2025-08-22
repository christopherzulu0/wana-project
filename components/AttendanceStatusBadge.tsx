import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/Colors";
import { fonts } from "../constants/fonts";
import { spacing } from "../constants/spacing";

interface AttendanceStatusBadgeProps {
  status: "present" | "absent" | "late";
  size?: "small" | "medium" | "large";
}

export const AttendanceStatusBadge = ({ 
  status, 
  size = "medium" 
}: AttendanceStatusBadgeProps) => {
  const getStatusColor = () => {
    switch (status) {
      case "present":
        return colors.statusPresent;
      case "absent":
        return colors.statusAbsent;
      case "late":
        return colors.statusLate;
      default:
        return colors.textLight;
    }
  };

  const getStatusText = () => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getBadgeStyle = () => {
    const baseStyle = {
      backgroundColor: getStatusColor(),
    };

    switch (size) {
      case "small":
        return { ...baseStyle, ...styles.smallBadge };
      case "medium":
        return { ...baseStyle, ...styles.mediumBadge };
      case "large":
        return { ...baseStyle, ...styles.largeBadge };
      default:
        return { ...baseStyle, ...styles.mediumBadge };
    }
  };

  const getTextStyle = () => {
    switch (size) {
      case "small":
        return styles.smallText;
      case "medium":
        return styles.mediumText;
      case "large":
        return styles.largeText;
      default:
        return styles.mediumText;
    }
  };

  return (
    <View style={[styles.badge, getBadgeStyle()]}>
      <Text style={[styles.text, getTextStyle()]}>{getStatusText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  smallBadge: {
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
  },
  mediumBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  largeBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  text: {
    color: colors.card,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.medium,
  },
  smallText: {
    fontSize: fonts.sizes.xs,
  },
  mediumText: {
    fontSize: fonts.sizes.sm,
  },
  largeText: {
    fontSize: fonts.sizes.md,
  },
});