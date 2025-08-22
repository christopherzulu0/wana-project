import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClassCard } from "../../components/ClassCard";
import { EmptyState } from "../../components/EmptyState";
import { Header } from "../../components/Header";
import { Input } from "../../components/Input";
import { StatusBar } from "../../components/StatusBar";
import { colors } from "../../constants/Colors";
import { spacing } from "../../constants/spacing";
import { useAuth } from "../../hooks/useAuth";
import { useClasses } from "../../hooks/useClasses";
import { Class } from "../../types";

export default function ClassesScreen() {
  const { user } = useAuth();
  const { getClassesForTeacher, classes, loading, error } = useClasses();
  
  const [searchQuery, setSearchQuery] = useState("");
  
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
  
  const renderClassItem = ({ item }: { item: Class }) => (
    <ClassCard classItem={item} />
  );

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar />
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
      <SafeAreaView style={styles.container}>
        <StatusBar />
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
      <SafeAreaView style={styles.container}>
        <StatusBar />
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
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <Header title="My Classes" />
      
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search classes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Feather name="search" size={20} color={colors.textLight} />}
            rightIcon={
              searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Feather name="x" size={20} color={colors.textLight} />
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
  searchContainer: {
    marginBottom: spacing.md,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
});