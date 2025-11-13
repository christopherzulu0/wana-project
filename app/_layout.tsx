"use client"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { useEffect } from "react"
import { useFonts } from "expo-font"
import "react-native-reanimated"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthProvider } from "../hooks/AuthContext"

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  })

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen
            name="signup" // Added signup screen
            options={{ headerShown: false }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="class/[id]" options={{ headerShown: false, presentation: "card" }} />
          <Stack.Screen name="student/[id]" options={{ headerShown: false, presentation: "card" }} />
          <Stack.Screen name="user" options={{ headerShown: false }} />
          <Stack.Screen name="attendance/[classId]/[date]" options={{ headerShown: false, presentation: "card" }} />
          <Stack.Screen
            name="student-attendance/[classId]" // New route for student face scan attendance
            options={{ headerShown: false, presentation: "card" }}
          />
          <Stack.Screen
            name="student-dashboard"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </AuthProvider>
  )
}
