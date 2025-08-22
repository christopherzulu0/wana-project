import { Feather } from "@expo/vector-icons"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { colors } from "../constants/Colors"
import { fonts } from "../constants/fonts"
import { spacing } from "../constants/spacing"
import type { User } from "../types"
import { Avatar } from "./Avatar"
import { Card } from "./Card"

interface UserCardProps {
  user: User
  onPress?: (user: User) => void
  onEdit?: (user: User) => void
  onDelete?: (user: User) => void
}

export const UserCard = ({ user, onPress, onEdit, onDelete }: UserCardProps) => {
  const handlePress = () => {
    if (onPress) {
      onPress(user)
    }
  }

  return (
    <Card variant="outlined" style={styles.card}>
      <TouchableOpacity
        activeOpacity={onPress ? 0.8 : 1}
        onPress={onPress ? handlePress : undefined}
        style={styles.content}
      >
        <Avatar source={user.avatar} name={user.name} size={50} />
        <View style={styles.details}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.role}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
        </View>
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity onPress={() => onEdit(user)} style={styles.actionButton}>
              <Feather name="edit" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={() => onDelete(user)} style={styles.actionButton}>
              <Feather name="trash-2" size={20} color={colors.danger} />
            </TouchableOpacity>
          )}
          {onPress && !onEdit && !onDelete && <Feather name="chevron-right" size={20} color={colors.textLight} />}
        </View>
      </TouchableOpacity>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Ensure content takes available space
  },
  details: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  email: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.xs / 2,
  },
  role: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.medium,
    color: colors.primary,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: spacing.md,
  },
  actionButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
})
