"use client"

import { useCallback, useState } from "react"
import { SafeAreaView, StyleSheet, Text, TextStyle, useWindowDimensions, ViewStyle } from "react-native"
import { SceneMap, TabBar, TabView } from "react-native-tab-view"
import { Header } from "../components/Header"
import { StatusBar } from "../components/StatusBar"
import { AdminOverviewTab } from "../components/admin-dashboard-tabs/AdminOverviewTab"
import { AdminProfileTab } from "../components/admin-dashboard-tabs/AdminProfileTab"
import { AdminReportsTab } from "../components/admin-dashboard-tabs/AdminReportsTab"
import { ClassManagementTab } from "../components/admin-dashboard-tabs/ClassManagementTab"
import { StudentManagementTab } from "../components/admin-dashboard-tabs/StudentManagementTab"
import { UserManagementTab } from "../components/admin-dashboard-tabs/UserManagementTab"
import { colors } from "../constants/Colors"
import { fonts } from "../constants/fonts"

const renderScene = SceneMap({
  overview: AdminOverviewTab,
  users: UserManagementTab,
  classes: ClassManagementTab,
  students: StudentManagementTab,
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
    { key: "students", title: "Students" },
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
      activeColor={colors.primary}
      inactiveColor={colors.textLight}
      pressColor={colors.primary + "10"}
      scrollEnabled
      renderLabel={({ route, focused, color }: { route: { key: string; title: string }; focused: boolean; color: string }) => (
        <Text
          style={[
            styles.tabBarLabel,
            { color, opacity: focused ? 1 : 0.8 },
          ]}
          numberOfLines={1}
        >
          {route.title}
        </Text>
      )}
      tabStyle={{ width: 'auto', paddingHorizontal: 12 }}
      contentContainerStyle={{ paddingHorizontal: 8 }}
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
        lazy
        swipeEnabled
        style={styles.tabView}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create<{
  container: ViewStyle
  tabView: ViewStyle
  tabBar: ViewStyle
  tabBarIndicator: ViewStyle
  tabBarLabel: TextStyle
}>({
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
    fontWeight: Number(fonts.weights.semibold) as unknown as TextStyle['fontWeight'],
    textTransform: 'none', // Prevent automatic uppercase
  },
})
