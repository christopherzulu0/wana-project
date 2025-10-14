"use client"

import { useState } from "react"
import { SafeAreaView, StyleSheet, useWindowDimensions } from "react-native"
import { TabView, SceneMap, TabBar } from "react-native-tab-view"
import { StatusBar } from "../components/StatusBar"
import { colors } from "../constants/Colors"
import { fonts } from "../constants/fonts"
import { Header } from "../components/Header"
import { StudentOverviewTab } from "../components/student-dashboard-tabs/StudentOverviewTab"
import { StudentClassesTab } from "../components/student-dashboard-tabs/StudentClassesTab"
import { StudentAttendanceHistoryTab } from "../components/student-dashboard-tabs/StudentAttendanceHistoryTab"
import { StudentProfileTab } from "../components/student-dashboard-tabs/StudentProfileTab"

const renderScene = SceneMap({
  overview: StudentOverviewTab,
  myClasses: StudentClassesTab,
  attendanceHistory: StudentAttendanceHistoryTab,
  profile: StudentProfileTab,
})

export default function StudentDashboard() {
  const layout = useWindowDimensions()

  const [index, setIndex] = useState(0)
  const [routes] = useState([
    { key: "overview", title: "Overview" },
    { key: "myClasses", title: "My Classes" },
    { key: "attendanceHistory", title: "Attendance" },
    { key: "profile", title: "Profile" },
  ])

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabBarIndicator}
      style={styles.tabBar}
      labelStyle={styles.tabBarLabel}
      activeColor={colors.primary}
      inactiveColor={colors.textLight}
      pressColor={colors.primary + "10"} // Light ripple effect
    />
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <Header title="Student Dashboard" />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
        tabBarPosition="bottom" // Tabs at the bottom of the screen
        style={styles.tabView}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabView: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
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
