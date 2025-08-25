"use client"

import { useState } from "react"
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from "react-native"
import { router } from "expo-router"
import { spacing } from "../constants/spacing"
import { Card } from "../components/Card"
import { Button } from "../components/Button"
import { Input } from "../components/Input"
import { useAuth } from "../hooks/useAuth"

const { width } = Dimensions.get("window")

export default function StudentLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.backgroundDecoration} />
        <View style={styles.backgroundDecoration2} />

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>🎓</Text>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to access your attendance records and academic progress</Text>
          </View>

          <Card style={styles.formCard}>
            <View style={styles.form}>
              <Input
                label="Email Address"
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                placeholder="student@school.edu"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />

              <Input
                label="Password"
                value={formData.password}
                onChangeText={(value) => handleInputChange("password", value)}
                placeholder="Enter your password"
                secureTextEntry
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
            <View style={styles.helpSection}>
              <Text style={styles.helpTitle}>Need Help?</Text>
              <Text style={styles.footerText}>
                Don't have an account? Contact your teacher or school administrator for assistance.
              </Text>
            </View>

            <Button
              title="← Back to Main Login"
              variant="outline"
              onPress={() => router.back()}
              style={styles.backButton}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
    backgroundColor: "#3b82f6",
    opacity: 0.1,
  },
  backgroundDecoration2: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#8b5cf6",
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
    backgroundColor: "#3b82f6",
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
    color: "#1e293b",
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: spacing.md,
    maxWidth: width * 0.8,
  },
  formCard: {
    marginBottom: spacing.xl,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
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
    backgroundColor: "#f8fafc",
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: spacing.sm,
  },
  footerText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: width * 0.8,
  },
  backButton: {
    width: "100%",
    borderColor: "#d1d5db",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: spacing.md,
    backgroundColor: "transparent",
  },
})
