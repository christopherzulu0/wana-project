import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors } from "../constants/Colors";
import { fonts } from "../constants/fonts";

interface AvatarProps {
  source?: string;
  name?: string;
  size?: number;
  style?: ViewStyle;
}

export const Avatar = ({ 
  source, 
  name, 
  size = 40, 
  style 
}: AvatarProps) => {
  const getInitials = (name: string) => {
    if (!name) return "";
    
    const names = name.split(" ");
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return (
      names[0].charAt(0).toUpperCase() + 
      names[names.length - 1].charAt(0).toUpperCase()
    );
  };

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const textSize = {
    fontSize: size * 0.4,
  };

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        style={[styles.avatar, avatarStyle, style]}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View style={[styles.placeholder, avatarStyle, style]}>
      {name && (
        <Text style={[styles.initials, textSize]}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.borderLight,
  },
  placeholder: {
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: colors.card,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
  },
});