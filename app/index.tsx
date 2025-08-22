import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { StatusBar } from "../components/StatusBar";
import { colors } from "../constants/Colors";
import { fonts } from "../constants/fonts";
import { spacing } from "../constants/spacing";
import { useAuth } from "../hooks/useAuth";

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // If user is already logged in, redirect based on role
      if (user.role === "admin") {
        router.replace("/admin-dashboard");
      } if (user.role === "student") {
        router.replace("/student-dashboard");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [user, loading, router]);

  const handleGetStarted = () => {
    router.push("/login");
  };

  if (loading) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>A</Text>
          </View>
          <Text style={styles.appName}>AttendanceTracker</Text>
        </View>
        
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: "https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=40" }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Attendance Management Made Simple</Text>
          <Text style={styles.subtitle}>
            Track student attendance, generate reports, and manage classes all in one place.
          </Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Button 
          title="Get Started" 
          onPress={handleGetStarted} 
          variant="primary"
          size="large"
          style={styles.button}
        />
      </View>
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
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  logoText: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    color: colors.card,
  },
  appName: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  imageContainer: {
    width: "100%",
    height: "40%",
    borderRadius: spacing.lg,
    overflow: "hidden",
    marginBottom: spacing.xl,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fonts.sizes.xxl,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.textLight,
    lineHeight: 24,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  button: {
    width: "100%",
  },
});