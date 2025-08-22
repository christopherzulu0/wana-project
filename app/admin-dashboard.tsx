"use client"

import { useState, useCallback } from "react"
import { SafeAreaView, StyleSheet, useWindowDimensions } from "react-native"
import { TabView, SceneMap, TabBar } from "react-native-tab-view"
import { StatusBar } from "../components/StatusBar"
import { colors } from "../constants/Colors"
import { fonts } from "../constants/fonts"
import { Header } from "../components/Header"
import { AdminOverviewTab } from "../components/admin-dashboard-tabs/AdminOverviewTab"
import { UserManagementTab } from "../components/admin-dashboard-tabs/UserManagementTab"
import { ClassManagementTab } from "../components/admin-dashboard-tabs/ClassManagementTab"
import { AdminReportsTab } from "../components/admin-dashboard-tabs/AdminReportsTab"
import { AdminProfileTab } from "../components/admin-dashboard-tabs/AdminProfileTab"

const renderScene = SceneMap({
  overview: AdminOverviewTab,
  users: UserManagementTab,
  classes: ClassManagementTab,
  reports: AdminReportsTab,
  profile: AdminProfileTab,
})

export default function AdminDashboard() {
  const layout = useWindowDimensions()

  const [index, setIndex] = useState(0)
  const [routes] = useState([
    { key: "overview", title: "Overview" },
    { key: "users", title: "Users" },
    { key: "classes", title: "Classes" },
    { key: "reports", title: "Reports" },
    { key: "profile", title: "Profile" },
  ])

  const handleIndexChange = useCallback((index: number) => {
    console.log('Tab index changed to:', index);
    setIndex(index);
  }, []);

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabBarIndicator}
      style={styles.tabBar}
      labelStyle={styles.tabBarLabel}
      activeColor={colors.primary}
      inactiveColor={colors.textLight}
      pressColor={colors.primary + "10"}
    />
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <Header title="Admin Dashboard" />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={handleIndexChange}
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
    backgroundColor: colors.background,
  },
  tabView: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    elevation: 0, // Remove shadow on Android
    shadowOpacity: 0, // Remove shadow on iOS
  },
  tabBarIndicator: {
    backgroundColor: colors.primary,
    height: 3,
  },
  tabBarLabel: {
    fontFamily: fonts.regular,
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold,
    textTransform: 'none', // Prevent automatic uppercase
  },
})
