"use client"

import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useMemo, useState, useRef } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient" 
import { Button } from "../components/Button"
import { Input } from "../components/Input"
import { StatusBar } from "../components/StatusBar"
import { colors } from "../constants/Colors"
import { fonts } from "../constants/fonts"
import { spacing } from "../constants/spacing"
import { useAuth } from "../hooks/useAuth"
import { useColorScheme } from "../hooks/useColorScheme"

// Dark mode color palette
const darkColors = {
  background: "#0A0E27",
  backgroundGradientStart: "#0A0E27",
  backgroundGradientEnd: "#1A1F3A",
  card: "#1A1F3A",
  cardSecondary: "#252D4A",
  text: "#F8FAFC",
  textLight: "#CBD5E1",
  textExtraLight: "#94A3B8",
  border: "#3B4563",
  borderLight: "#1E293B",
  accent: "#00D9FF",
  accentAlt: "#7C3AED",
  success: "#10B981",
}

export default function LoginScreen() {
  const router = useRouter()
  const { login, user, loading } = useAuth()
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  
  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : colors.background,
    backgroundGradientStart: isDark ? darkColors.backgroundGradientStart : "#F5F7FA",
    backgroundGradientEnd: isDark ? darkColors.backgroundGradientEnd : "#FFFFFF",
    card: isDark ? darkColors.card : colors.card,
    cardSecondary: isDark ? darkColors.cardSecondary : "#F0F4F8",
    text: isDark ? darkColors.text : colors.text,
    textLight: isDark ? darkColors.textLight : colors.textLight,
    textExtraLight: isDark ? darkColors.textExtraLight : "#64748B",
    border: isDark ? darkColors.border : colors.border,
    borderLight: isDark ? darkColors.borderLight : colors.borderLight,
    accent: isDark ? darkColors.accent : colors.primary,
    accentAlt: isDark ? darkColors.accentAlt : "#7C3AED",
    success: isDark ? darkColors.success : "#059669",
  }), [isDark])
  
  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start()
    
    // Rotating background accent
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start()
  }, [])
  
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })
  
  const gradientColors = isDark 
    ? [themeColors.backgroundGradientStart, themeColors.backgroundGradientEnd, themeColors.card] as const
    : [themeColors.backgroundGradientStart, themeColors.backgroundGradientEnd, "#FFFFFF"] as const



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
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar />

      <LinearGradient 
        colors={gradientColors} 
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated background accent */}
      <Animated.View
        style={[
          styles.backgroundAccent,
          {
            transform: [{ rotate: rotateInterpolate }],
            opacity: isDark ? 0.1 : 0.05,
          },
        ]}
      >
        <LinearGradient
          colors={[themeColors.accent, themeColors.accentAlt]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <Animated.View
          style={[
            styles.contentWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
            {/* Top Bar */}
            <View style={styles.topBar}>
          <TouchableOpacity
                style={[styles.backButton, { backgroundColor: themeColors.card + "E6" }]}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
                <Feather name="arrow-left" size={20} color={themeColors.textLight} />
              </TouchableOpacity>
              <View style={styles.topBarRight}>
                <TouchableOpacity 
                  style={styles.topBarLink}
                  onPress={() => router.push("/student-login")}
                  activeOpacity={0.7}
                >
                  <Feather name="user" size={16} color={themeColors.textLight} />
                  <Text style={[styles.topBarLinkText, { color: themeColors.textLight }]}>Student</Text>
          </TouchableOpacity>
              </View>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
              {/* Header Section */}
              <View style={styles.header}>
                <Animated.View 
                  style={[
                    styles.logoContainer,
                    { transform: [{ scale: scaleAnim }] }
                  ]}
                >
                  <LinearGradient
                    colors={isDark ? [themeColors.success, "#059669"] : ["#059669", themeColors.success]}
                    style={styles.logoGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.logoIcon}>
                      <Feather name="log-in" size={24} color="#FFFFFF" />
                    </View>
                  </LinearGradient>
                </Animated.View>
                <Text style={[styles.title, { color: themeColors.text }]}>
                  Welcome Back
                </Text>
                <Text style={[styles.subtitle, { color: themeColors.textLight }]}>
                  Sign in to access your account
                </Text>
          </View>

              {/* Form Card */}
              <View style={styles.formCardContainer}>
                <View style={[styles.formCard, { 
                  backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                  borderColor: isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(226, 232, 240, 0.8)",
                  shadowColor: isDark ? "#000000" : "#10B981",
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: isDark ? 0.3 : 0.15,
                  shadowRadius: 24,
                  elevation: 12,
                }]}>
              {error ? (
                    <Animated.View 
                      style={[
                        styles.errorContainer, 
                        { 
                          backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2",
                          borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#fecaca"
                        },
                        { opacity: fadeAnim }
                      ]}
                    >
                      <Feather name="alert-circle" size={16} color="#EF4444" />
                      <Text style={[styles.errorText, { color: "#EF4444" }]}>{error}</Text>
                    </Animated.View>
              ) : null}

                  <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                        themeColors={themeColors}
                        leftIcon={<Feather name="mail" size={18} color={themeColors.textLight} />}
                />
              </View>

              <View style={styles.inputContainer}>
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                        themeColors={themeColors}
                        leftIcon={<Feather name="lock" size={18} color={themeColors.textLight} />}
                />
              </View>

                    <TouchableOpacity 
                      style={styles.forgotPassword}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.forgotPasswordText, { color: themeColors.success }]}>
                        Forgot Password?
                      </Text>
              </TouchableOpacity>

                    <Button 
                      title="Sign In" 
                      onPress={handleLogin} 
                      loading={isLoading} 
                      style={styles.button} 
                    />
                  </View>
            </View>
          </View>

              {/* Signup Section */}
              <View style={styles.signupSection}>
                <Text style={[styles.signupPrompt, { color: themeColors.textLight }]}>
                  Don't have an account?
              </Text>
                <TouchableOpacity 
                  style={styles.signupButton}
                  activeOpacity={0.7}
                  onPress={() => router.replace("/signup")}
                >
                  <Text style={[styles.signupButtonText, { color: themeColors.accent }]}>
                    Create Account
              </Text>
                  <Feather name="arrow-right" size={16} color={themeColors.accent} />
            </TouchableOpacity>
              </View>

              {/* Footer Links */}
              <View style={styles.footerLinks}>
                <TouchableOpacity style={styles.footerLink} activeOpacity={0.7}>
                  <Feather name="shield" size={14} color={themeColors.textExtraLight} />
                  <Text style={[styles.footerLinkText, { color: themeColors.textExtraLight }]}>Privacy</Text>
              </TouchableOpacity>
                <View style={[styles.footerDivider, { backgroundColor: themeColors.border }]} />
                <TouchableOpacity style={styles.footerLink} activeOpacity={0.7}>
                  <Feather name="help-circle" size={14} color={themeColors.textExtraLight} />
                  <Text style={[styles.footerLinkText, { color: themeColors.textExtraLight }]}>Support</Text>
              </TouchableOpacity>
            </View>
          </View>
          </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backgroundAccent: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    top: -80,
    right: -80,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  topBarLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  topBarLinkText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: "500" as const,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  logoContainer: {
    marginBottom: spacing.md,
  },
  logoGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: fonts.sizes.xl * 1.2,
    fontFamily: fonts.regular,
    fontWeight: "800" as const,
    marginBottom: spacing.xs / 2,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    textAlign: "center",
    opacity: 0.8,
  },
  formCardContainer: {
    marginBottom: spacing.md,
  },
  formCard: {
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1.5,
  },
  form: {
    gap: spacing.md,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    flex: 1,
    fontWeight: "500" as const,
  },
  inputContainer: {
    marginBottom: 0,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    minHeight: 0,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: -spacing.sm,
    marginBottom: spacing.xs,
    paddingVertical: spacing.xs,
  },
  forgotPasswordText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: "600" as const,
  },
  button: {
    width: "100%",
    borderRadius: 14,
    paddingVertical: spacing.md,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginTop: spacing.xs,
  },
  signupSection: {
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  signupPrompt: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
  },
  signupButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  signupButtonText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: "600" as const,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  footerLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  footerDivider: {
    width: 1,
    height: 14,
  },
  footerLinkText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    fontWeight: "500" as const,
  },
})
