"use client"

import { Stack } from "expo-router"

export default function UserLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="[id]/assign" 
        options={{ 
          headerShown: false, 
          presentation: "card" 
        }} 
      />
    </Stack>
  )
}

