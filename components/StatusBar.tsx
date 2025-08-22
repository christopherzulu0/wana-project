import React from "react";
import { StatusBar as ExpoStatusBar, Platform } from "react-native";
import { colors } from "../constants/Colors";

export const StatusBar = () => {
  // Hide StatusBar on web and Android, show on iOS
  if (Platform.OS === "web" || Platform.OS === "android") {
    return null;
  }
  
  return (
    <ExpoStatusBar 
      backgroundColor={colors.background}
      barStyle="dark-content"
    />
  );
};