"use client"

import { useMemo, useState } from "react"
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "../components/StatusBar"
import { spacing } from "../constants/spacing"
import { colors } from "../constants/Colors"
import { Card } from "../components/Card"
import { Button } from "../components/Button"
import { Input } from "../components/Input"
import { useAuth } from "../hooks/useAuth"
import { useColorScheme } from "../hooks/useColorScheme"

// Dark mode color palette
const darkColors = {
  background: "#151718",
  card: "#1F2324",
  text: "#ECEDEE",
  textLight: "#9BA1A6",
  border: "#2A2D2E",
  borderLight: "#252829",
}

const { width } = Dimensions.get("window")

export default function StudentLogin() {
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  
  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : colors.background,
    card: isDark ? darkColors.card : colors.card,
    text: isDark ? darkColors.text : colors.text,
    textLight: isDark ? darkColors.textLight : colors.textLight,
    border: isDark ? darkColors.border : colors.border,
    borderLight: isDark ? darkColors.borderLight : colors.borderLight,
  }), [isDark])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const success = await login(formData.email, formData.password)
      if (success) {
        router.replace("/student-dashboard")
      } else {
        Alert.alert("Error", "Invalid email or password")
      }
    } catch (error) {
      Alert.alert("Error", "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar />
      <KeyboardAvoidingView style={styles.keyboardAvoidingView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.backgroundDecoration, { backgroundColor: isDark ? "#3b82f6" : "#3b82f6" }]} />
          <View style={[styles.backgroundDecoration2, { backgroundColor: isDark ? "#8b5cf6" : "#8b5cf6" }]} />

          <View style={styles.content}>
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: isDark ? "#3b82f6" : "#3b82f6" }]}>
                <Text style={styles.iconText}>🎓</Text>
              </View>
              <Text style={[styles.title, { color: themeColors.text }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { color: themeColors.textLight }]}>Sign in to access your attendance records and academic progress</Text>
            </View>

            <Card style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }]}>
              <View style={styles.form}>
                <Input
                  label="Email Address"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange("email", value)}
                  placeholder="student@school.edu"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  themeColors={themeColors}
                  style={styles.input}
                />

                <Input
                  label="Password"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange("password", value)}
                  placeholder="Enter your password"
                  secureTextEntry
                  themeColors={themeColors}
                  style={styles.input}
                />

                <Button
                  title={loading ? "Signing In..." : "Sign In"}
                  onPress={handleLogin}
                  loading={loading}
                  style={styles.loginButton}
                />
              </View>
            </Card>

            <View style={styles.footer}>
              <View style={[styles.helpSection, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }]}>
                <Text style={[styles.helpTitle, { color: themeColors.text }]}>Need Help?</Text>
                <Text style={[styles.footerText, { color: themeColors.textLight }]}>
                  Don't have an account? Contact your teacher or school administrator for assistance.
                </Text>
              </View>

              <Button
                title="← Back to Main Login"
                variant="outline"
                onPress={() => router.back()}
                style={[styles.backButton, { borderColor: themeColors.borderLight }]}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: Dimensions.get("window").height,
  },
  backgroundDecoration: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.1,
  },
  backgroundDecoration2: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.08,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl * 1.5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: spacing.md,
    maxWidth: width * 0.8,
  },
  formCard: {
    marginBottom: spacing.xl,
    borderRadius: 20,
    padding: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
  },
  form: {
    gap: spacing.lg,
  },
  input: {
    marginBottom: spacing.sm,
  },
  loginButton: {
    marginTop: spacing.lg,
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: spacing.md + 2,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  footer: {
    alignItems: "center",
    gap: spacing.xl,
  },
  helpSection: {
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  footerText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: width * 0.8,
  },
  backButton: {
    width: "100%",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: spacing.md,
    backgroundColor: "transparent",
  },
})
