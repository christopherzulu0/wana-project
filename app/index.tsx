"use client"

import { useRouter } from "expo-router"
import { useEffect, useMemo, useRef } from "react"
import { Image, StyleSheet, Text, View, Animated, Dimensions, Platform, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Feather } from "@expo/vector-icons"
import { Button } from "../components/Button"
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

const { width, height } = Dimensions.get("window")

export default function WelcomeScreen() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const featureSlideAnim = useRef([
    new Animated.Value(30),
    new Animated.Value(30),
    new Animated.Value(30),
  ]).current
  
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

  useEffect(() => {
    // Main animations
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

    // Staggered feature animations
    const featureAnimations = featureSlideAnim.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 0,
        duration: 600,
        delay: 300 + index * 100,
        useNativeDriver: true,
      })
    )
    Animated.parallel(featureAnimations).start()

    // Pulse animation for scanning frame
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start()

    // Rotate animation for accent elements
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start()
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
    ? [themeColors.backgroundGradientStart, themeColors.backgroundGradientEnd, themeColors.card] as const
    : [themeColors.backgroundGradientStart, themeColors.backgroundGradientEnd, "#FFFFFF"] as const

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

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

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
                <LinearGradient 
                  colors={isDark ? [themeColors.success, "#059669"] : ["#059669", themeColors.success]} 
                  style={styles.logoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                <View style={styles.logoIcon}>
                    <Feather name="user-check" size={28} color="#FFFFFF" />
                </View>
                  <View style={[styles.logoGlow, { backgroundColor: themeColors.success + "40" }]} />
              </LinearGradient>
            </Animated.View>
            <View style={styles.appNameContainer}>
                <Text style={[styles.appName, { color: themeColors.success }]}>FaceAttend</Text>
                <Text style={[styles.appSubtitle, { color: themeColors.textLight }]}>Smart Recognition</Text>
            </View>
          </View>

          <View style={styles.heroSection}>
              <Animated.View 
                style={[
                  styles.imageContainer,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                }}
                style={styles.heroImage}
                resizeMode="cover"
              />
                <LinearGradient
                  colors={isDark 
                    ? ["rgba(16, 185, 129, 0.25)", "rgba(0, 217, 255, 0.15)", "rgba(124, 58, 237, 0.1)"]
                    : ["rgba(5, 150, 105, 0.15)", "rgba(5, 150, 105, 0.08)", "rgba(5, 150, 105, 0.05)"]
                  }
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.scanningFrame}>
                  <Animated.View style={[styles.scanningCorner, { borderColor: themeColors.success }]} />
                  <Animated.View style={[styles.scanningCorner, styles.topRight, { borderColor: themeColors.success }]} />
                  <Animated.View style={[styles.scanningCorner, styles.bottomLeft, { borderColor: themeColors.success }]} />
                  <Animated.View style={[styles.scanningCorner, styles.bottomRight, { borderColor: themeColors.success }]} />
                  <View style={[styles.scanningCenter, { backgroundColor: themeColors.success + "20" }]}>
                    <Feather name="maximize" size={32} color={themeColors.success} />
                  </View>
                </View>
              </Animated.View>
          </View>

          <View style={styles.textContainer}>
              <Text style={[styles.title, { color: themeColors.text }]}>
                Attendance Made{"\n"}
                <Text style={{ color: themeColors.success }}>Effortless</Text>
              </Text>
              <Text style={[styles.subtitle, { color: themeColors.textLight }]}>
              Experience the future of attendance tracking with secure facial recognition technology. Quick, accurate,
              and contactless.
            </Text>

            <View style={styles.featuresContainer}>
                {[
                  { icon: "zap", title: "Instant Recognition", color: themeColors.accent },
                  { icon: "lock", title: "Secure & Private", color: themeColors.success },
                  { icon: "bar-chart-2", title: "Real-time Reports", color: themeColors.accentAlt },
                ].map((feature, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.featureCard,
                      {
                        backgroundColor: isDark 
                          ? themeColors.cardSecondary + "80" 
                          : themeColors.cardSecondary,
                        borderColor: isDark 
                          ? feature.color + "30" 
                          : feature.color + "20",
                        transform: [{ translateY: featureSlideAnim[index] }],
                        opacity: fadeAnim,
                      },
                    ]}
                  >
                    <View style={[styles.featureIconContainer, { backgroundColor: feature.color + "15" }]}>
                      <Feather name={feature.icon as any} size={20} color={feature.color} />
                    </View>
                    <Text style={[styles.featureText, { color: themeColors.text }]}>{feature.title}</Text>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      <Animated.View 
        style={[
          styles.footer, 
          { 
            opacity: fadeAnim,
            borderTopColor: isDark ? themeColors.border : themeColors.borderLight,
          }
        ]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} style={styles.footerBlur}>
            <View style={styles.footerContent}>
              <Button
                title="Get Started"
                onPress={handleGetStarted}
                variant="primary"
                size="large"
                style={styles.primaryButton}
              />
              <View style={styles.footerBadges}>
                <View style={[styles.badge, { backgroundColor: themeColors.success + "15" }]}>
                  <Feather name="shield" size={14} color={themeColors.success} />
                  <Text style={[styles.badgeText, { color: themeColors.success }]}>Secure</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: themeColors.accent + "15" }]}>
                  <Feather name="zap" size={14} color={themeColors.accent} />
                  <Text style={[styles.badgeText, { color: themeColors.accent }]}>Fast</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: themeColors.accentAlt + "15" }]}>
                  <Feather name="check-circle" size={14} color={themeColors.accentAlt} />
                  <Text style={[styles.badgeText, { color: themeColors.accentAlt }]}>Reliable</Text>
              </View>
              </View>
            </View>
          </BlurView>
        ) : (
          <LinearGradient
            colors={isDark 
              ? [themeColors.card + "E6", themeColors.card + "F0"]
              : ["rgba(255, 255, 255, 0.95)", "rgba(255, 255, 255, 0.98)"]
            }
            style={styles.footerGradient}
          >
            <View style={styles.footerContent}>
        <Button
          title="Get Started"
          onPress={handleGetStarted}
          variant="primary"
          size="large"
          style={styles.primaryButton}
        />
              <View style={styles.footerBadges}>
                <View style={[styles.badge, { backgroundColor: themeColors.success + "15" }]}>
                  <Feather name="shield" size={14} color={themeColors.success} />
                  <Text style={[styles.badgeText, { color: themeColors.success }]}>Secure</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: themeColors.accent + "15" }]}>
                  <Feather name="zap" size={14} color={themeColors.accent} />
                  <Text style={[styles.badgeText, { color: themeColors.accent }]}>Fast</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: themeColors.accentAlt + "15" }]}>
                  <Feather name="check-circle" size={14} color={themeColors.accentAlt} />
                  <Text style={[styles.badgeText, { color: themeColors.accentAlt }]}>Reliable</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  mainContent: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
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
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    position: "relative",
    overflow: "visible",
  },
  logoIcon: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  logoGlow: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 20,
    opacity: 0.6,
    zIndex: 1,
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
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#10B981",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
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
    width: 140,
    height: 140,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  scanningCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(16, 185, 129, 0.3)",
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
    justifyContent: "space-between",
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  featureCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 16,
    borderWidth: 1.5,
    minHeight: 100,
    justifyContent: "center",
    gap: spacing.sm,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  featureText: {
    fontSize: width > 400 ? fonts.sizes.xs : 10,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    textAlign: "center",
    lineHeight: width > 400 ? 14 : 12,
  },
  footer: {
    borderTopWidth: 1.5,
    overflow: "hidden",
  },
  footerBlur: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  footerGradient: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  footerContent: {
    gap: spacing.md,
  },
  primaryButton: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: spacing.lg,
    shadowColor: "#10B981",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  footerBadges: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
  },
  backgroundAccent: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -100,
    right: -100,
    opacity: 0.1,
  },
})
