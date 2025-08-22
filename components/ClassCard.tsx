import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/Colors";
import { fonts } from "../constants/fonts";
import { spacing } from "../constants/spacing";
import { Class } from "../types";
import { Card } from "./Card";

interface ClassCardProps {
  classItem: Class;
}

export const ClassCard = ({ classItem }: ClassCardProps) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/class/${classItem.id}`);
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.subjectContainer}>
            <View style={styles.iconContainer}>
              <Feather name="book" size={24} color={colors.card} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.name}>{classItem.name}</Text>
              <Text style={styles.subject}>{classItem.subject}</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={24} color={colors.textLight} />
        </View>
        
        <View style={styles.footer}>
          <View style={styles.infoItem}>
            <Feather name="users" size={16} color={colors.textLight} />
            <Text style={styles.infoText}>{classItem.totalStudents} Students</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Feather name="layers" size={16} color={colors.textLight} />
            <Text style={styles.infoText}>Section {classItem.section}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subjectContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  subject: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },
  footer: {
    flexDirection: "row",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.lg,
  },
  infoText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginLeft: spacing.xs,
  },
});