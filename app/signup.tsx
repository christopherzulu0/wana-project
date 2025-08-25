"use client"

import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button } from "../components/Button"
import { Input } from "../components/Input"
import { StatusBar } from "../components/StatusBar"
import { colors } from "../constants/Colors"
import { spacing } from "../constants/spacing"
import { useAuth } from "../hooks/useAuth"

export default function SignupScreen() {
  const router = useRouter()
  const { signup, user, loading } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError("All fields are required")
      return
    }
    setIsLoading(true)
    setError("")
    try {
      const result = await signup(name, email, password)
      if (result.success) {
        router.replace("/(tabs)")
      } else {
        setError(result.error || "Signup failed")
      }
    } catch (error) {
      setError("An error occurred during signup")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.replace("/login")
  }

  if (loading) {
    return null
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>A</Text>
              </View>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our attendance system</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.form}>
              {error ? (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={20} color={colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                leftIcon={<Feather name="user" size={20} color={colors.textLight} />}
              />
              <Input
                label="Email Address"
                placeholder="Enter your email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Feather name="mail" size={20} color={colors.textLight} />}
              />
              <Input
                label="Password"
                placeholder="Create a secure password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon={<Feather name="lock" size={20} color={colors.textLight} />}
              />

              <Button title="Create Account" onPress={handleSignup} loading={isLoading} style={styles.signupButton} />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.loginLink} onPress={handleBackToLogin}>
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl * 2,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl * 2,
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: spacing.sm,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  formContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  form: {
    gap: spacing.lg,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    fontSize: 14,
    color: "#dc2626",
    marginLeft: spacing.sm,
    flex: 1,
  },
  signupButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: spacing.md,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  footer: {
    alignItems: "center",
    paddingTop: spacing.lg,
  },
  loginLink: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  loginLinkText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  loginLinkHighlight: {
    color: "#3b82f6",
    fontWeight: "600",
  },
})
