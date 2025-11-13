"use client"

import { Feather } from "@expo/vector-icons"
import { useCallback, useMemo, useState } from "react"
import { Modal, Platform, SafeAreaView, StyleSheet, Text, TextStyle, TouchableOpacity, useWindowDimensions, View, ViewStyle } from "react-native"
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
import { spacing } from "../constants/spacing"
import { useColorScheme } from "../hooks/useColorScheme"

// Dark mode color palette
const darkColors = {
  background: "#151718",
  card: "#1F2324",
  text: "#ECEDEE",
  textLight: "#9BA1A6",
  textExtraLight: "#6C757D",
  border: "#2A2D2E",
  borderLight: "#252829",
}

// Enhanced Tab Icon Component
const TabIcon = ({ 
  name, 
  color, 
  focused, 
  size = 20 
}: { 
  name: string; 
  color: string; 
  focused: boolean; 
  size?: number;
}) => {
  const iconSize = focused ? size + 1 : size;
  
  return (
    <View style={[
      styles.iconContainer,
      focused && styles.iconContainerActive
    ]}>
      <Feather 
        name={name as any} 
        color={color} 
        size={iconSize}
      />
      {focused && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
    </View>
  );
};

export default function AdminDashboard() {
  const layout = useWindowDimensions()
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

  const [index, setIndex] = useState(0)
  const [showMoreModal, setShowMoreModal] = useState(false)
  const allRoutes = [
    { key: "overview", title: "Overview", icon: "layout" },
    { key: "users", title: "Users", icon: "users" },
    { key: "classes", title: "Classes", icon: "book-open" },
    { key: "students", title: "Students", icon: "user-check" },
    { key: "reports", title: "Reports", icon: "bar-chart-2" },
    { key: "profile", title: "Profile", icon: "user" },
  ]
  
  // Show first 4 tabs in tab bar, rest go to "More" modal
  const visibleTabsCount = 4
  const visibleRoutes = allRoutes.slice(0, visibleTabsCount)
  const moreRoutes = allRoutes.slice(visibleTabsCount)
  
  // For TabView, we use all routes but customize the tab bar display
  const routes = allRoutes

  const handleIndexChange = useCallback((index: number) => {
    console.log('Tab index changed to:', index);
    setIndex(index);
  }, []);
  
  const handleMoreTabSelect = useCallback((routeKey: string) => {
    const routeIndex = allRoutes.findIndex(r => r.key === routeKey);
    if (routeIndex !== -1) {
      setIndex(routeIndex);
      setShowMoreModal(false);
    }
  }, [allRoutes]);

  const renderScene = useCallback(({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'overview':
        return <AdminOverviewTab onNavigateToReports={() => {
          const reportsIndex = allRoutes.findIndex(r => r.key === "reports");
          if (reportsIndex !== -1) setIndex(reportsIndex);
        }} />
      case 'users':
        return <UserManagementTab />
      case 'classes':
        return <ClassManagementTab />
      case 'students':
        return <StudentManagementTab />
      case 'reports':
        return <AdminReportsTab />
      case 'profile':
        return <AdminProfileTab />
      default:
        return null
    }
  }, [allRoutes]);

  const renderTabBar = (props: any) => {
    // Create display routes: first 4 tabs + More button
    const displayRoutes = [...visibleRoutes];
    if (moreRoutes.length > 0) {
      displayRoutes.push({ key: "more", title: "More", icon: "more-horizontal" });
    }
    
    return (
      <View style={[styles.tabBar, { backgroundColor: themeColors.card }]}>
        <View style={styles.tabBarContent}>
          {displayRoutes.map((route, routeIndex) => {
            const isMoreButton = route.key === "more";
            const isActive = isMoreButton 
              ? index >= visibleRoutes.length 
              : allRoutes.findIndex(r => r.key === route.key) === index;
            
            const color = isActive ? colors.primary : themeColors.textLight;
            
            return (
              <TouchableOpacity
                key={route.key}
                style={[
                  styles.customTab,
                  isActive && styles.customTabActive,
                  { backgroundColor: isActive ? colors.primary + "10" : "transparent" }
                ]}
                onPress={() => {
                  if (isMoreButton) {
                    setShowMoreModal(true);
                  } else {
                    const routeIndex = allRoutes.findIndex(r => r.key === route.key);
                    if (routeIndex !== -1) {
                      setIndex(routeIndex);
                    }
                  }
                }}
                activeOpacity={0.7}
              >
                <TabIcon name={route.icon} color={color} focused={isActive} size={18} />
                <Text
                  style={[
                    styles.tabBarLabel,
                    { color, opacity: isActive ? 1 : 0.7 },
                    isActive && styles.tabBarLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {route.title}
                </Text>
                {isActive && (
                  <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: {
      ...styles.container,
      backgroundColor: themeColors.background,
    },
  }), [themeColors])

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar />
      <Header title="Admin Dashboard" />
      <TabView
        navigationState={{ index, routes: allRoutes }}
        renderScene={renderScene}
        onIndexChange={handleIndexChange}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
        tabBarPosition="bottom"
        lazy
        swipeEnabled={false} // Disable swipe since we only show 4 tabs + More
        style={styles.tabView}
      />
      
      {/* More Tabs Modal */}
      <Modal
        visible={showMoreModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreModal(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: themeColors.card }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.borderLight }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>More Options</Text>
              <TouchableOpacity onPress={() => setShowMoreModal(false)}>
                <Feather name="x" size={24} color={themeColors.textLight} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {moreRoutes.map((route) => {
                const isActive = allRoutes.findIndex(r => r.key === route.key) === index;
                return (
                  <TouchableOpacity
                    key={route.key}
                    style={[
                      styles.moreTabItem,
                      { backgroundColor: isActive ? colors.primary + "10" : "transparent" },
                      { borderBottomColor: themeColors.borderLight }
                    ]}
                    onPress={() => handleMoreTabSelect(route.key)}
                  >
                    <View style={styles.moreTabItemContent}>
                      <TabIcon name={route.icon} color={isActive ? colors.primary : themeColors.textLight} focused={isActive} size={20} />
                      <Text style={[
                        styles.moreTabItemText,
                        { color: isActive ? colors.primary : themeColors.text },
                        isActive && styles.moreTabItemTextActive
                      ]}>
                        {route.title}
                      </Text>
                    </View>
                    {isActive && (
                      <Feather name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create<{
  container: ViewStyle
  tabView: ViewStyle
  tabBar: ViewStyle
  tabBarContent: ViewStyle
  tabBarIndicator: ViewStyle
  tabIndicator: ViewStyle
  tabBarLabel: TextStyle
  tabBarLabelActive: TextStyle
  customTab: ViewStyle
  customTabActive: ViewStyle
  iconContainer: ViewStyle
  iconContainerActive: ViewStyle
  activeIndicator: ViewStyle
  modalOverlay: ViewStyle
  modalContent: ViewStyle
  modalHeader: ViewStyle
  modalTitle: TextStyle
  modalBody: ViewStyle
  moreTabItem: ViewStyle
  moreTabItemContent: ViewStyle
  moreTabItemText: TextStyle
  moreTabItemTextActive: TextStyle
}>({
  container: {
    flex: 1,
  },
  tabView: {
    flex: 1,
  },
  tabBar: {
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    paddingVertical: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.md + 8 : spacing.sm,
  },
  tabBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  tabBarIndicator: {
    height: 0, // Not used in custom tab bar
  },
  customTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: spacing.md,
    position: 'relative',
    minWidth: 70,
  },
  customTabActive: {
    // Active state handled by backgroundColor
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 3,
    borderRadius: 1.5,
  },
  tabBarLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'none',
    marginTop: spacing.xs / 2,
    textAlign: 'center',
  },
  tabBarLabelActive: {
    fontWeight: '600',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  iconContainerActive: {
    // Active state styling handled in component
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.regular,
    fontWeight: '600',
  },
  modalBody: {
    padding: spacing.md,
  },
  moreTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: spacing.md,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
  },
  moreTabItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  moreTabItemText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    fontWeight: '500',
  },
  moreTabItemTextActive: {
    fontWeight: '600',
  },
})
