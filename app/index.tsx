"use client"

import { useRouter } from "expo-router"
import { useEffect, useMemo, useRef } from "react"
import { Image, StyleSheet, Text, View, Animated, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Button } from "../components/Button"
import { StatusBar } from "../components/StatusBar"
import { colors } from "../constants/Colors"
import { fonts } from "../constants/fonts"
import { spacing } from "../constants/spacing"
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

const { width, height } = Dimensions.get("window")

export default function WelcomeScreen() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  
  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : colors.background,
    card: isDark ? darkColors.card : colors.card,
    text: isDark ? darkColors.text : colors.text,
    textLight: isDark ? darkColors.textLight : colors.textLight,
    border: isDark ? darkColors.border : colors.border,
    borderLight: isDark ? darkColors.borderLight : colors.borderLight,
  }), [isDark])

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
  }, [])

  useEffect(() => {
    if (!loading && user) {
      // If user is already logged in, redirect based on role
      if (user.role === "admin") {
        router.replace("/admin-dashboard")
      } else if (user.role === "student") {
        router.replace("/student-dashboard")
      } else {
        // Teacher or other roles go to teacher dashboard
        router.replace("/(tabs)")
      }
    }
  }, [user, loading, router])

  const handleGetStarted = () => {
    router.push("/login")
  }

  if (loading) {
    return null
  }

  const gradientColors = isDark 
    ? ["#0f172a", "#1e293b", "#1e293b"]
    : ["#ffffff", "#f0fdf4", "#ecfdf5"]

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar />

      <LinearGradient colors={gradientColors} style={styles.gradientBackground} />

      <View style={styles.mainContent}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}>
              <LinearGradient colors={["#059669", "#10b981"]} style={styles.logoGradient}>
                <View style={styles.logoIcon}>
                  <Text style={styles.logoText}>👤</Text>
                </View>
              </LinearGradient>
            </Animated.View>
            <View style={styles.appNameContainer}>
              <Text style={[styles.appName, { color: isDark ? "#10b981" : "#059669" }]}>FaceAttend</Text>
              <Text style={[styles.appSubtitle, { color: isDark ? "#10b981" : "#10b981" }]}>Smart Recognition</Text>
            </View>
          </View>

          <View style={styles.heroSection}>
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <View style={[styles.imageOverlay, { backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(5, 150, 105, 0.1)" }]}>
                <View style={styles.scanningFrame}>
                  <View style={[styles.scanningCorner, { borderColor: "#10b981" }]} />
                  <View style={[styles.scanningCorner, styles.topRight, { borderColor: "#10b981" }]} />
                  <View style={[styles.scanningCorner, styles.bottomLeft, { borderColor: "#10b981" }]} />
                  <View style={[styles.scanningCorner, styles.bottomRight, { borderColor: "#10b981" }]} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: isDark ? "#10b981" : "#059669" }]}>Attendance Made{"\n"}Effortless</Text>
            <Text style={[styles.subtitle, { color: themeColors.textLight }]}>
              Experience the future of attendance tracking with secure facial recognition technology. Quick, accurate,
              and contactless.
            </Text>

            <View style={[styles.featuresContainer, { backgroundColor: isDark ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.05)", borderColor: isDark ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.1)" }]}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>⚡</Text>
                <Text style={[styles.featureText, { color: isDark ? "#10b981" : "#059669" }]}>Instant Recognition</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🔒</Text>
                <Text style={[styles.featureText, { color: isDark ? "#10b981" : "#059669" }]}>Secure & Private</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📊</Text>
                <Text style={[styles.featureText, { color: isDark ? "#10b981" : "#059669" }]}>Real-time Reports</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim, backgroundColor: isDark ? themeColors.card : "rgba(255, 255, 255, 0.95)", borderTopColor: isDark ? themeColors.borderLight : "rgba(16, 185, 129, 0.1)" }]}>
        <Button
          title="Get Started"
          onPress={handleGetStarted}
          variant="primary"
          size="large"
          style={styles.primaryButton}
        />
        <Text style={[styles.footerText, { color: isDark ? "#10b981" : "#059669" }]}>Secure • Fast • Reliable</Text>
      </Animated.View>
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
  mainContent: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingBottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  logoContainer: {
    marginRight: spacing.md,
  },
  logoGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#059669",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 24,
    color: "#ffffff",
  },
  appNameContainer: {
    flex: 1,
  },
  appName: {
    fontSize: width > 400 ? fonts.sizes.xl : fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: width > 400 ? fonts.sizes.sm : fonts.sizes.xs,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  heroSection: {
    marginBottom: spacing.lg,
  },
  imageContainer: {
    width: "100%",
    height: height * 0.28,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  scanningFrame: {
    width: 120,
    height: 120,
    position: "relative",
  },
  scanningCorner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderWidth: 3,
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    left: "auto",
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    top: "auto",
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: "auto",
    left: "auto",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    minHeight: height * 0.25,
  },
  title: {
    fontSize: width > 400 ? fonts.sizes.xxl : width > 350 ? fonts.sizes.xl : fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    marginBottom: spacing.md,
    lineHeight: width > 400 ? fonts.sizes.xxl * 1.2 : width > 350 ? fonts.sizes.xl * 1.2 : fonts.sizes.lg * 1.2,
    letterSpacing: -1,
    textAlign: "center",
  },
  subtitle: {
    fontSize: width > 400 ? fonts.sizes.md : width > 350 ? fonts.sizes.sm : fonts.sizes.xs,
    fontFamily: fonts.regular,
    lineHeight: width > 400 ? 24 : width > 350 ? 20 : 18,
    marginBottom: spacing.md,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
  },
  featuresContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 16,
    paddingVertical: spacing.md,
    borderWidth: 1,
  },
  featureItem: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  featureIcon: {
    fontSize: width > 400 ? 28 : width > 350 ? 24 : 20,
    marginBottom: spacing.xs,
    textShadowColor: "rgba(5, 150, 105, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  featureText: {
    fontSize: width > 400 ? fonts.sizes.sm : width > 350 ? fonts.sizes.xs : 10,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    textAlign: "center",
    lineHeight: width > 400 ? 16 : width > 350 ? 14 : 12,
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  primaryButton: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: spacing.lg,
    shadowColor: "#059669",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    transform: [{ scale: 1 }],
  },
  footerText: {
    textAlign: "center",
    fontSize: width > 400 ? fonts.sizes.sm : width > 350 ? fonts.sizes.xs : 10,
    marginTop: spacing.md,
    fontWeight: fonts.weights.semibold,
    letterSpacing: 1,
    opacity: 0.8,
  },
})
