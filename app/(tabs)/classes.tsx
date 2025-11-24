import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState, useEffect } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClassCard } from "../../components/ClassCard";
import { EmptyState } from "../../components/EmptyState";
import { Header } from "../../components/Header";
import { Input } from "../../components/Input";
import { StatusBar } from "../../components/StatusBar";
import { colors } from "../../constants/Colors";
import { spacing } from "../../constants/spacing";
import { useAuth } from "../../hooks/useAuth";
import { useColorScheme } from "../../hooks/useColorScheme";
import { useClasses } from "../../hooks/useClasses";
import { Class } from "../../types";
import { AttendanceRequestsModal } from "../../components/AttendanceRequestsModal";

// Dark mode color palette
const darkColors = {
  background: "#0F1115",
  card: "#1A1D24",
  text: "#ECEDEE",
  textLight: "#9BA1A6",
  border: "#2A2D2E",
  borderLight: "#252829",
}

const API_BASE_URL = 'https://attendance-records-wana.vercel.app'

export default function ClassesScreen() {
  const { user } = useAuth();
  const { getClassesForTeacher, classes, loading, error } = useClasses();
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'

  // Animation for background accents
  const rotateAnim1 = React.useRef(new Animated.Value(0)).current;
  const rotateAnim2 = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const rotateAnimation1 = Animated.loop(
      Animated.timing(rotateAnim1, {
        toValue: 1,
        duration: 25000,
        useNativeDriver: true,
      })
    );
    const rotateAnimation2 = Animated.loop(
      Animated.timing(rotateAnim2, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: true,
      })
    );
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    rotateAnimation1.start();
    rotateAnimation2.start();
    pulseAnimation.start();

    return () => {
      rotateAnimation1.stop();
      rotateAnimation2.stop();
      pulseAnimation.stop();
    };
  }, []);

  const rotateInterpolate1 = rotateAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotateInterpolate2 = rotateAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [requestCounts, setRequestCounts] = useState<Record<string, number>>({});

  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : "#F8F9FA",
    card: isDark ? darkColors.card : colors.card,
    text: isDark ? darkColors.text : colors.text,
    textLight: isDark ? darkColors.textLight : colors.textLight,
    border: isDark ? darkColors.border : colors.border,
    borderLight: isDark ? darkColors.borderLight : colors.borderLight,
    accent: isDark ? "#00D9FF" : "#3B82F6",
    accentAlt: isDark ? "#7C3AED" : "#8B5CF6",
    success: isDark ? "#10B981" : "#059669",
  }), [isDark])

  // Gradient colors for background
  const gradientColors = useMemo(() => {
    if (isDark) {
      return ["#0A0E27", "#0F1115", "#15181D", "#1A1F2E", "#0F1115"];
    } else {
      return ["#F5F7FA", "#F8F9FA", "#FFFFFF", "#F0F4F8", "#F8F9FA"];
    }
  }, [isDark]) as [string, string, string, string, string];

  // Debug logging
  console.log('ClassesScreen - Current user:', user);
  console.log('ClassesScreen - All classes:', classes);

  // Get teacher's classes
  const teacherClasses = user ? getClassesForTeacher(user.id) : [];
  console.log('ClassesScreen - Teacher classes:', teacherClasses);

  // Filter classes based on search query
  const filteredClasses = teacherClasses.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.section.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch request counts for all teacher's classes
  useEffect(() => {
    const fetchRequestCounts = async () => {
      if (!user || teacherClasses.length === 0) return;

      const counts: Record<string, number> = {};

      try {
        // Fetch pending requests for each class
        await Promise.all(
          teacherClasses.map(async (classItem) => {
            try {
              const response = await fetch(
                `${API_BASE_URL}/api/attendance-requests/class/${classItem.id}?status=pending`
              );

              if (response.ok) {
                const data = await response.json();
                counts[classItem.id] = data.requests?.length || 0;
              }
            } catch (err) {
              console.error(`Error fetching requests for class ${classItem.id}:`, err);
            }
          })
        );

        setRequestCounts(counts);
      } catch (err) {
        console.error('Error fetching request counts:', err);
      }
    };

    fetchRequestCounts();

    // Refresh counts every 30 seconds
    const interval = setInterval(fetchRequestCounts, 30000);

    return () => clearInterval(interval);
  }, [user, teacherClasses]);

  const handleClassPress = (classItem: Class) => {
    setSelectedClass(classItem);
    setShowRequestsModal(true);
  };

  const handleRequestsModalClose = () => {
    setShowRequestsModal(false);
    setSelectedClass(null);
  };

  const handleRequestHandled = () => {
    // Refresh request counts after a request is approved/rejected
    if (selectedClass) {
      fetch(`${API_BASE_URL}/api/attendance-requests/class/${selectedClass.id}?status=pending`)
        .then(res => res.json())
        .then(data => {
          setRequestCounts(prev => ({
            ...prev,
            [selectedClass.id]: data.requests?.length || 0
          }));
        })
        .catch(err => console.error('Error refreshing request count:', err));
    }
  };

  const renderClassItem = ({ item }: { item: Class }) => (
    <ClassCard
      classItem={item}
      requestCount={requestCounts[item.id]}
      onPress={() => handleClassPress(item)}
    />
  );

  // Render background elements (reusable function)
  const renderBackground = () => (
    <>
      {/* Gradient Background */}
      <LinearGradient
        colors={gradientColors}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated background accents */}
      <Animated.View
        style={[
          styles.backgroundAccent,
          styles.backgroundAccent1,
          {
            transform: [
              { rotate: rotateInterpolate1 },
              { scale: pulseAnim },
            ],
            opacity: isDark ? 0.15 : 0.05,
          },
        ]}
      >
        <LinearGradient
          colors={[themeColors.accent, themeColors.accentAlt]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.backgroundAccent,
          styles.backgroundAccent2,
          {
            transform: [{ rotate: rotateInterpolate2 }],
            opacity: isDark ? 0.1 : 0.03,
          },
        ]}
      >
        <LinearGradient
          colors={[themeColors.accentAlt, themeColors.success]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.backgroundAccent,
          styles.backgroundAccent3,
          {
            transform: [{ scale: pulseAnim }],
            opacity: isDark ? 0.08 : 0.02,
          },
        ]}
      >
        <LinearGradient
          colors={[themeColors.success, themeColors.accent]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </>
  );

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar />
        {renderBackground()}
        <Header title="My Classes" />
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <EmptyState
            title="Loading Classes"
            message="Please wait while we fetch your classes..."
            icon="clock"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar />
        {renderBackground()}
        <Header title="My Classes" />
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <EmptyState
            title="Error Loading Classes"
            message={error}
            icon="alert-circle"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show message for non-teacher users
  if (user && user.role !== 'teacher') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar />
        {renderBackground()}
        <Header title="My Classes" />
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <EmptyState
            title="Access Restricted"
            message="This section is only available for teachers."
            icon="lock"
          />
        </View>
      </SafeAreaView>
    );
  }

  const renderEmptyComponent = () => (
    <EmptyState
      title="No Classes Assigned"
      message={
        searchQuery
          ? "Try adjusting your search query"
          : "You haven't been assigned to any classes yet. Contact your administrator to get enrolled in classes."
      }
      icon="book-open"
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar />
      {renderBackground()}
      <Header title="My Classes" />

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search classes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            themeColors={themeColors}
            leftIcon={<Feather name="search" size={20} color={themeColors.textLight} />}
            rightIcon={
              searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Feather name="x" size={20} color={themeColors.textLight} />
                </TouchableOpacity>
              ) : undefined
            }
          />
        </View>

        <FlatList
          data={filteredClasses}
          renderItem={renderClassItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyComponent}
        />
      </View>

      {/* Attendance Requests Modal */}
      {selectedClass && (
        <AttendanceRequestsModal
          visible={showRequestsModal}
          classItem={selectedClass}
          onClose={handleRequestsModalClose}
          onRequestHandled={handleRequestHandled}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backgroundAccent: {
    position: "absolute",
    borderRadius: 200,
  },
  backgroundAccent1: {
    width: 450,
    height: 450,
    top: -150,
    right: -150,
  },
  backgroundAccent2: {
    width: 350,
    height: 350,
    bottom: -100,
    left: -100,
  },
  backgroundAccent3: {
    width: 300,
    height: 300,
    top: 300,
    left: -80,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  searchContainer: {
    marginBottom: spacing.md,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
});