"use client"

import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from "react-native"
import { colors } from "../../constants/Colors"
import { fonts } from "../../constants/fonts"
import { spacing } from "../../constants/spacing"
import { useAuth } from "../../hooks/useAuth"
import { Avatar } from "../Avatar"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"

export function StudentProfileTab() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout()
            router.replace('/student-login')
          },
        },
      ]
    )
  }

  const profileItems = [
    {
      icon: 'user' as const,
      label: 'Full Name',
      value: user?.name || 'N/A',
    },
    {
      icon: 'mail' as const,
      label: 'Email',
      value: user?.email || 'N/A',
    },
    {
      icon: 'phone' as const,
      label: 'Phone',
      value: user?.phone || 'Not provided',
    },
    {
      icon: 'calendar' as const,
      label: 'Student ID',
      value: user?.id || 'N/A',
    },
  ]

  const actionItems = [
    {
      icon: 'edit' as const,
      label: 'Edit Profile',
      onPress: () => {
        Alert.alert('Coming Soon', 'Profile editing feature will be available soon!')
      },
      color: colors.primary,
    },
    {
      icon: 'settings' as const,
      label: 'Settings',
      onPress: () => {
        Alert.alert('Coming Soon', 'Settings feature will be available soon!')
      },
      color: colors.secondary,
    },
    {
      icon: 'help-circle' as const,
      label: 'Help & Support',
      onPress: () => {
        Alert.alert('Help & Support', 'For assistance, please contact your administrator or teacher.')
      },
      color: colors.info,
    },
  ]

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Avatar 
          source={user?.avatar} 
          name={user?.name} 
          size={80} 
        />
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userRole}>Student</Text>
      </View>

      {/* Profile Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        {profileItems.map((item, index) => (
          <View key={index} style={styles.profileItem}>
            <View style={styles.profileItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name={item.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.profileItemContent}>
                <Text style={styles.profileItemLabel}>{item.label}</Text>
                <Text style={styles.profileItemValue}>{item.value}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        {actionItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.actionItem} onPress={item.onPress}>
            <View style={styles.actionItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                <Feather name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.actionItemLabel}>{item.label}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textLight} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={20} color={colors.card} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  userName: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  userRole: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.textLight,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  profileItem: {
    backgroundColor: colors.card,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  profileItemContent: {
    flex: 1,
  },
  profileItemLabel: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.xs / 2,
  },
  profileItemValue: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.medium,
    color: colors.text,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  actionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionItemLabel: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.medium,
    color: colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    borderRadius: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: colors.card,
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    marginLeft: spacing.sm,
  },
})