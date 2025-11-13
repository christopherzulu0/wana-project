"use client"

import { useMemo, useState } from "react"
import { SafeAreaView, StyleSheet, useWindowDimensions } from "react-native"
import { TabView, SceneMap, TabBar } from "react-native-tab-view"
import { StatusBar } from "../components/StatusBar"
import { colors } from "../constants/Colors"
import { fonts } from "../constants/fonts"
import { Header } from "../components/Header"
import { useColorScheme } from "../hooks/useColorScheme"
import { StudentOverviewTab } from "../components/student-dashboard-tabs/StudentOverviewTab"
import { StudentClassesTab } from "../components/student-dashboard-tabs/StudentClassesTab"
import { StudentAttendanceHistoryTab } from "../components/student-dashboard-tabs/StudentAttendanceHistoryTab"
import { StudentProfileTab } from "../components/student-dashboard-tabs/StudentProfileTab"

// Dark mode color palette
const darkColors = {
  background: "#151718",
  card: "#1F2324",
  text: "#ECEDEE",
  textLight: "#9BA1A6",
  border: "#2A2D2E",
  borderLight: "#252829",
}

const renderScene = SceneMap({
  overview: StudentOverviewTab,
  myClasses: StudentClassesTab,
  attendanceHistory: StudentAttendanceHistoryTab,
  profile: StudentProfileTab,
})

export default function StudentDashboard() {
  const layout = useWindowDimensions()
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'

  const [index, setIndex] = useState(0)
  const [routes] = useState([
    { key: "overview", title: "Overview" },
    { key: "myClasses", title: "My Classes" },
    { key: "attendanceHistory", title: "Attendance" },
    { key: "profile", title: "Profile" },
  ])
  
  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : colors.background,
    card: isDark ? darkColors.card : colors.card,
    text: isDark ? darkColors.text : colors.text,
    textLight: isDark ? darkColors.textLight : colors.textLight,
    border: isDark ? darkColors.border : colors.border,
    borderLight: isDark ? darkColors.borderLight : colors.borderLight,
  }), [isDark])

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabBarIndicator}
      style={[styles.tabBar, { backgroundColor: themeColors.card, borderTopColor: themeColors.borderLight }]}
      labelStyle={styles.tabBarLabel}
      activeColor={colors.primary}
      inactiveColor={themeColors.textLight}
      pressColor={colors.primary + "10"}
    />
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar />
      <Header title="Student Dashboard" />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
        tabBarPosition="bottom"
        style={styles.tabView}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabView: {
    flex: 1,
  },
  tabBar: {
    borderTopWidth: 1,
  },
  tabBarIndicator: {
    backgroundColor: colors.primary,
    height: 3,
  },
  tabBarLabel: {
    fontFamily: fonts.regular,
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold,
  },
})
