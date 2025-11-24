"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Animated } from "react-native"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Feather } from "@expo/vector-icons"
import { StatusBar } from "../components/StatusBar"
import { spacing } from "../constants/spacing"
import { colors } from "../constants/Colors"
import { fonts } from "../constants/fonts"
import { Button } from "../components/Button"
import { Input } from "../components/Input"
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

export default function StudentLogin() {
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()

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

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        })
      ),
    ]).start()
  }, [])

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const gradientColors: [string, string] = [
    themeColors.backgroundGradientStart,
    themeColors.backgroundGradientEnd
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    setError("")
    try {
      const success = await login(formData.email, formData.password)
      if (success) {
        router.replace("/student-dashboard")
      } else {
        setError("Invalid email or password")
      }
    } catch (error) {
      setError("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push("/")
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
            opacity: isDark ? 0.15 : 0.05,
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
                  colors={isDark ? [themeColors.accent, themeColors.accentAlt] : [themeColors.accentAlt, themeColors.accent]}
                  style={styles.logoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.logoIcon}>
                    <Feather name="book" size={24} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </Animated.View>
              <Text style={[styles.title, { color: themeColors.text }]}>
                Student Login
              </Text>
              <Text style={[styles.subtitle, { color: themeColors.textLight }]}>
                Access your attendance records
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
                      placeholder="student@school.edu"
                      value={formData.email}
                      onChangeText={(value) => handleInputChange("email", value)}
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
                      value={formData.password}
                      onChangeText={(value) => handleInputChange("password", value)}
                      secureTextEntry
                      themeColors={themeColors}
                      leftIcon={<Feather name="lock" size={18} color={themeColors.textLight} />}
                    />
                  </View>

                  <Button
                    title="Sign In"
                    onPress={handleLogin}
                    loading={loading}
                    style={styles.button}
                  />
                </View>
              </View>
            </View>

            {/* Help Section */}
            <View style={styles.helpSection}>
              <View style={[styles.helpCard, {
                backgroundColor: themeColors.cardSecondary,
                borderColor: themeColors.border
              }]}>
                <Feather name="help-circle" size={20} color={themeColors.accent} />
                <View style={styles.helpContent}>
                  <Text style={[styles.helpTitle, { color: themeColors.text }]}>Need Help?</Text>
                  <Text style={[styles.helpText, { color: themeColors.textLight }]}>
                    Contact your teacher or administrator for account access
                  </Text>
                </View>
              </View>
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
  mainContent: {
    flex: 1,
    justifyContent: "center",
    minHeight: 0,
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
    shadowColor: "#00D9FF",
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
  helpSection: {
    marginBottom: spacing.md,
  },
  helpCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
  },
  helpContent: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  helpTitle: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: "600" as const,
  },
  helpText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
})
