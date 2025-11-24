import React, { useMemo } from 'react';
import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from '../components/StatusBar';
import { colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

// Dark mode color palette
const darkColors = {
  background: "#151718",
  card: "#1F2324",
  text: "#ECEDEE",
  textLight: "#9BA1A6",
  border: "#2A2D2E",
  borderLight: "#252829",
}

export default function NotFoundScreen() {
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'
  
  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : colors.background,
    card: isDark ? darkColors.card : colors.card,
    text: isDark ? darkColors.text : colors.text,
    textLight: isDark ? darkColors.textLight : colors.textLight,
    border: isDark ? darkColors.border : colors.border,
    borderLight: isDark ? darkColors.borderLight : colors.borderLight,
  }), [isDark])

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar />
        <View style={styles.content}>
          <Text style={[styles.text, { color: themeColors.text }]}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
            <Text style={[styles.linkText, { color: colors.primary }]}>Go to home screen!</Text>
        </Link>
      </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
    