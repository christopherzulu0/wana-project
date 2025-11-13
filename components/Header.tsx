import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/Colors";
import { fonts } from "../constants/fonts";
import { spacing } from "../constants/spacing";
import { StatusBar } from "./StatusBar";
import { useColorScheme } from "../hooks/useColorScheme";

// Dark mode color palette
const darkColors = {
  background: "#151718",
  card: "#1F2324",
  text: "#ECEDEE",
  textLight: "#9BA1A6",
  border: "#2A2D2E",
  borderLight: "#252829",
}

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
}

export const Header = ({ 
  title, 
  showBackButton = false, 
  rightComponent 
}: HeaderProps) => {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'

  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : colors.background,
    text: isDark ? darkColors.text : colors.text,
    borderLight: isDark ? darkColors.borderLight : colors.borderLight,
  }), [isDark])

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar />
      <View style={[styles.header, { borderBottomColor: themeColors.borderLight }]}>
        <View style={styles.leftContainer}>
          {showBackButton && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={24} color={themeColors.text} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>{title}</Text>
        </View>
        
        {rightComponent && (
          <View style={styles.rightContainer}>
            {rightComponent}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // backgroundColor will be set dynamically
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    // borderBottomColor will be set dynamically
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    // color will be set dynamically
    flex: 1,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});