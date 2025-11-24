import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../../components/Avatar";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Header } from "../../components/Header";
import { StatusBar } from "../../components/StatusBar";
import { colors } from "../../constants/Colors";
import { fonts } from "../../constants/fonts";
import { spacing } from "../../constants/spacing";
import { useAuth } from "../../hooks/useAuth";
import { useColorScheme } from "../../hooks/useColorScheme";

// Dark mode color palette
const darkColors = {
  background: "#151718",
  card: "#1F2324",
  text: "#ECEDEE",
  textLight: "#9BA1A6",
  border: "#2A2D2E",
  borderLight: "#252829",
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  
  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : colors.background,
    card: isDark ? darkColors.card : colors.card,
    text: isDark ? darkColors.text : colors.text,
    textLight: isDark ? darkColors.textLight : colors.textLight,
    border: isDark ? darkColors.border : colors.border,
    borderLight: isDark ? darkColors.borderLight : colors.borderLight,
  }), [isDark])
  
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            setIsLoggingOut(true);
            await logout();
            setIsLoggingOut(false);
            router.replace("/");
          },
        },
      ]
    );
  };
  
  const renderProfileItem = (
    icon: keyof typeof Feather.glyphMap,
    label: string,
    value: string
  ) => (
    <View style={[styles.profileItem, { borderBottomColor: themeColors.borderLight }]}>
      <View style={styles.profileItemIcon}>
        <Feather name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.profileItemContent}>
        <Text style={[styles.profileItemLabel, { color: themeColors.textLight }]}>{label}</Text>
        <Text style={[styles.profileItemValue, { color: themeColors.text }]}>{value}</Text>
      </View>
    </View>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar />
      <Header title="My Profile" />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <Avatar 
            source={user?.avatar} 
            name={user?.name} 
            size={100} 
          />
          
          <Text style={[styles.name, { color: themeColors.text }]}>{user?.name}</Text>
          <Text style={[styles.role, { color: themeColors.textLight }]}>{user?.role === "teacher" ? "Teacher" : "Administrator"}</Text>
        </View>
        
        <Card style={styles.infoCard}>
          {renderProfileItem("mail", "Email", user?.email || "")}
          {renderProfileItem("briefcase", "Role", user?.role === "teacher" ? "Teacher" : "Administrator")}
          {renderProfileItem("hash", "ID", user?.id || "")}
        </Card>
        
       
        
        <Button
          title="Logout"
          onPress={async () => {
            console.log('Logout button pressed');
            setIsLoggingOut(true);
            await logout();
            setIsLoggingOut(false);
            console.log('Logged out, navigating to /');
            router.replace("/");
          }}
          variant="outline"
          style={styles.logoutButton}
          loading={isLoggingOut}
          disabled={isLoggingOut}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  name: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.regular,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.xs / 2,
  },
  role: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
  },
  infoCard: {
    marginBottom: spacing.xl,
  },
  profileItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  profileItemContent: {
    flex: 1,
  },
  profileItemLabel: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    marginBottom: spacing.xs / 2,
  },
  profileItemValue: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
  },
  menuSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  menuCard: {
    padding: 0,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  menuItemText: {
    flex: 1,
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    marginLeft: spacing.md,
  },
  logoutButton: {
    marginTop: spacing.md,
  },
});