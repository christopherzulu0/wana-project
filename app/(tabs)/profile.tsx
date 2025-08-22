import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
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

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  
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
    <View style={styles.profileItem}>
      <View style={styles.profileItemIcon}>
        <Feather name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.profileItemContent}>
        <Text style={styles.profileItemLabel}>{label}</Text>
        <Text style={styles.profileItemValue}>{value}</Text>
      </View>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
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
          
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>{user?.role === "teacher" ? "Teacher" : "Administrator"}</Text>
        </View>
        
        <Card style={styles.infoCard}>
          {renderProfileItem("mail", "Email", user?.email || "")}
          {renderProfileItem("briefcase", "Role", user?.role === "teacher" ? "Teacher" : "Administrator")}
          {renderProfileItem("hash", "ID", user?.id || "")}
        </Card>
        
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <Card style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <Feather name="bell" size={20} color={colors.text} />
              <Text style={styles.menuItemText}>Notifications</Text>
              <Feather name="chevron-right" size={20} color={colors.textLight} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <Feather name="lock" size={20} color={colors.text} />
              <Text style={styles.menuItemText}>Privacy & Security</Text>
              <Feather name="chevron-right" size={20} color={colors.textLight} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <Feather name="help-circle" size={20} color={colors.text} />
              <Text style={styles.menuItemText}>Help & Support</Text>
              <Feather name="chevron-right" size={20} color={colors.textLight} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <Feather name="info" size={20} color={colors.text} />
              <Text style={styles.menuItemText}>About</Text>
              <Feather name="chevron-right" size={20} color={colors.textLight} />
            </TouchableOpacity>
          </Card>
        </View>
        
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
    backgroundColor: colors.background,
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
    fontWeight: '700', // changed from fonts.weights.bold
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs / 2,
  },
  role: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },
  infoCard: {
    marginBottom: spacing.xl,
  },
  profileItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
    color: colors.textLight,
    marginBottom: spacing.xs / 2,
  },
  profileItemValue: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  menuSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: '600', // changed from fonts.weights.semibold
    color: colors.text,
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
    borderBottomColor: colors.borderLight,
  },
  menuItemText: {
    flex: 1,
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.text,
    marginLeft: spacing.md,
  },
  logoutButton: {
    marginTop: spacing.md,
  },
});