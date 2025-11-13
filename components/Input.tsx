import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { colors } from "../constants/Colors";
import { fonts } from "../constants/fonts";
import { spacing } from "../constants/spacing";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  disabled?: boolean;
  editable?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  numberOfLines?: number;
  themeColors?: {
    background?: string;
    card?: string;
    text?: string;
    textLight?: string;
    textExtraLight?: string;
    border?: string;
    borderLight?: string;
  };
}

export const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  error,
  disabled = false,
  editable = true,
  style,
  inputStyle,
  leftIcon,
  rightIcon,
  autoCapitalize = "none",
  multiline = false,
  numberOfLines = 1,
  themeColors,
}: InputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  
  const inputThemeColors = {
    card: themeColors?.card || colors.card,
    text: themeColors?.text || colors.text,
    textLight: themeColors?.textLight || colors.textLight,
    textExtraLight: themeColors?.textExtraLight || colors.textExtraLight,
    border: themeColors?.border || colors.border,
    borderLight: themeColors?.borderLight || colors.borderLight,
  };
  
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: inputThemeColors.text }]}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: inputThemeColors.card,
          borderColor: error ? colors.danger : inputThemeColors.border,
        },
        error ? styles.inputError : null,
        disabled ? styles.inputDisabled : null,
      ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            { color: inputThemeColors.text },
            leftIcon ? styles.inputWithLeftIcon : null,
            (rightIcon || secureTextEntry) ? styles.inputWithRightIcon : null,
            inputStyle,
          ]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          editable={!disabled && editable}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          placeholderTextColor={inputThemeColors.textExtraLight}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={togglePasswordVisibility}
          >
            <Feather
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={20}
              color={inputThemeColors.textLight}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.md,
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: spacing.xs,
  },
  leftIcon: {
    paddingLeft: spacing.md,
  },
  rightIcon: {
    paddingRight: spacing.md,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputDisabled: {
    backgroundColor: colors.borderLight,
    opacity: 0.7,
  },
  errorText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});