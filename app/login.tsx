"use client"

import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button } from "../components/Button"
import { Input } from "../components/Input"
import { StatusBar } from "../components/StatusBar"
import { fonts } from "../constants/fonts"
import { spacing } from "../constants/spacing"
import { useAuth } from "../hooks/useAuth"

export default function LoginScreen() {
  const router = useRouter()
  const { login, user, loading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")



  useEffect(() => {
    if (!loading && user) {
      // If user is already logged in, redirect based on role
      if (user.role === "admin") {
        router.replace("/admin-dashboard")
      } else if (user.role === "student") {
        router.replace("/student-dashboard")
      } else {
        router.replace("/(tabs)")
      }
    }
  }, [user, loading, router])

  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      setError("Email and password are required")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await login(email, password)

      if (result.success) {
        // Redirect based on role
        if (result.user.role === "admin") {
          router.replace("/admin-dashboard")
        } else if (result.user.role === "student") {
          router.replace("/student-dashboard")
        } else {
          router.replace("/(tabs)")
        }
      } else {
        setError(result.error || "Invalid credentials")
      }
    } catch (error) {
      setError("An error occurred during login")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  // Show demo login info alert
  useEffect(() => {
    Alert.alert(
      "Demo Login",
      "Use these credentials to login:\n\nEmail: john.smith@example.com\nPassword: any password will work",
      [{ text: "OK" }],
    )
  }, [])

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
          <View style={styles.decorativeBackground}>
            <View style={styles.gradientOverlay} />
            <View style={styles.techPattern}>
              <View style={styles.scanLine} />
              <View style={styles.scanLine2} />
            </View>
            <View style={styles.floatingElements}>
              <View style={styles.floatingCircle1} />
              <View style={styles.floatingCircle2} />
              <View style={styles.floatingCircle3} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={24} color="#164e63" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Feather name="log-in" size={40} color="#164e63" />
              </View>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
            <Text style={styles.tagline}>Secure access to your attendance dashboard</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.form}>
              {error ? (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={20} color="#e3342f" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.inputContainer}>
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Feather name="mail" size={20} color="#475569" />}
                />
              </View>

              <View style={styles.inputContainer}>
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  leftIcon={<Feather name="lock" size={20} color="#475569" />}
                />
              </View>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <Button title="Sign In" onPress={handleLogin} loading={isLoading} style={styles.button} />
            </View>
          </View>

          <View style={styles.linksContainer}>
            <TouchableOpacity style={styles.studentLoginLink} onPress={() => router.push("/student-login")}>
              <Text style={styles.studentLoginText}>
                Student? <Text style={styles.linkHighlight}>Login Here</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signupLink} onPress={() => router.replace("/signup")}>
              <Text style={styles.signupLinkText}>
                Don't have an account? <Text style={styles.linkHighlight}>Sign Up</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.securityLinks}>
              <TouchableOpacity style={styles.securityLink}>
                <Feather name="shield" size={16} color="#475569" />
                <Text style={styles.securityLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.securityLink}>
                <Feather name="help-circle" size={16} color="#475569" />
                <Text style={styles.securityLinkText}>Help & Support</Text>
              </TouchableOpacity>
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
    backgroundColor: "#ffffff",
  },
  decorativeBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    zIndex: -1,
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: "#ecfeff",
    opacity: 0.8,
  },
  techPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  scanLine: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#164e63",
    opacity: 0.3,
  },
  scanLine2: {
    position: "absolute",
    top: 120,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#f97316",
    opacity: 0.5,
  },
  floatingElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  floatingCircle1: {
    position: "absolute",
    top: 40,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#164e63",
    opacity: 0.1,
  },
  floatingCircle2: {
    position: "absolute",
    top: 80,
    left: 40,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f97316",
    opacity: 0.15,
  },
  floatingCircle3: {
    position: "absolute",
    top: 140,
    right: 60,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#164e63",
    opacity: 0.2,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.xl,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl * 1.5,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ecfeff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#164e63",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#f97316",
  },
  title: {
    fontSize: fonts.sizes.xl * 1.4,
    fontFamily: fonts.regular,
    fontWeight: "700" as const,
    color: "#164e63",
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: "600" as const,
    color: "#f97316",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: "#475569",
    textAlign: "center",
    opacity: 0.8,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: "#164e63",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#ecfeff",
  },
  form: {},
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: "#e3342f",
    marginLeft: spacing.sm,
    flex: 1,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: spacing.xl,
    paddingVertical: spacing.sm,
  },
  forgotPasswordText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: "#f97316",
    fontWeight: "600" as const,
  },
  button: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: spacing.lg,
    backgroundColor: "#164e63",
    shadowColor: "#164e63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  linksContainer: {
    alignItems: "center",
    paddingTop: spacing.lg,
  },
  studentLoginLink: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  studentLoginText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: "#475569",
    textAlign: "center",
  },
  signupLink: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  signupLinkText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: "#475569",
    textAlign: "center",
  },
  linkHighlight: {
    color: "#f97316",
    fontWeight: "600" as const,
  },
  securityLinks: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#ecfeff",
  },
  securityLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  securityLinkText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    color: "#475569",
    marginLeft: spacing.xs,
  },
})
