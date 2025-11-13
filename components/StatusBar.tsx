import React, { useMemo } from "react";
import { StatusBar as ExpoStatusBar, Platform } from "react-native";
import { colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";

// Dark mode color palette
const darkColors = {
  background: "#151718",
}

export const StatusBar = () => {
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'

  // Theme-aware background color
  const backgroundColor = useMemo(() => 
    isDark ? darkColors.background : colors.background,
    [isDark]
  )

  // Hide StatusBar on web and Android, show on iOS
  if (Platform.OS === "web" || Platform.OS === "android") {
    return null;
  }
  
  return (
    <ExpoStatusBar 
      backgroundColor={backgroundColor}
      barStyle={isDark ? "light-content" : "dark-content"}
    />
  );
};