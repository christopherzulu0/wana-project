import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { colors } from "../constants/Colors";
import { fonts } from "../constants/fonts";
import { spacing } from "../constants/spacing";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "text";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) => {
  const getButtonStyle = () => {
    let buttonStyle: ViewStyle = {};
    
    // Variant styles
    switch (variant) {
      case "primary":
        buttonStyle = styles.primaryButton;
        break;
      case "secondary":
        buttonStyle = styles.secondaryButton;
        break;
      case "outline":
        buttonStyle = styles.outlineButton;
        break;
      case "text":
        buttonStyle = styles.textButton;
        break;
    }
    
    // Size styles
    switch (size) {
      case "small":
        buttonStyle = { ...buttonStyle, ...styles.smallButton };
        break;
      case "medium":
        buttonStyle = { ...buttonStyle, ...styles.mediumButton };
        break;
      case "large":
        buttonStyle = { ...buttonStyle, ...styles.largeButton };
        break;
    }
    
    // Disabled style
    if (disabled || loading) {
      buttonStyle = { ...buttonStyle, ...styles.disabledButton };
    }
    
    return buttonStyle;
  };
  
  const getTextStyle = () => {
    let textStyleVar: TextStyle = {};
    
    // Variant text styles
    switch (variant) {
      case "primary":
        textStyleVar = styles.primaryText;
        break;
      case "secondary":
        textStyleVar = styles.primaryText;
        break;
      case "outline":
        textStyleVar = styles.outlineText;
        break;
      case "text":
        textStyleVar = styles.textButtonText;
        break;
    }
    
    // Size text styles
    switch (size) {
      case "small":
        textStyleVar = { ...textStyleVar, ...styles.smallText };
        break;
      case "medium":
        textStyleVar = { ...textStyleVar, ...styles.mediumText };
        break;
      case "large":
        textStyleVar = { ...textStyleVar, ...styles.largeText };
        break;
    }
    
    // Disabled text style
    if (disabled || loading) {
      textStyleVar = { ...textStyleVar, ...styles.disabledText };
    }
    
    return textStyleVar;
  };
  
  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === "outline" || variant === "text" ? colors.primary : colors.card} 
        />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Variant styles
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: spacing.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    borderRadius: spacing.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  textButton: {
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Size styles
  smallButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  mediumButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  largeButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  
  // Text styles
  primaryText: {
    color: colors.card,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    textAlign: "center",
  },
  outlineText: {
    color: colors.primary,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    textAlign: "center",
  },
  textButtonText: {
    color: colors.primary,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    textAlign: "center",
  },
  
  // Text size styles
  smallText: {
    fontSize: fonts.sizes.sm,
  },
  mediumText: {
    fontSize: fonts.sizes.md,
  },
  largeText: {
    fontSize: fonts.sizes.lg,
  },
  
  // Disabled styles
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.8,
  },
});