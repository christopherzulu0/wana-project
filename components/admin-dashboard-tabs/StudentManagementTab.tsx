import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { colors } from '../../constants/Colors';
import { spacing } from '../../constants/spacing';
import { useColorScheme } from '../../hooks/useColorScheme';
import { CreateStudentData, UpdateStudentData, useStudents } from '../../hooks/useStudents';
import { Student } from '../../types';
import { Button } from '../Button';
import { Card } from '../Card';
import { EmptyState } from '../EmptyState';
import { StudentFormModal } from '../StudentFormModal';

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

export const StudentManagementTab: React.FC = () => {
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'

  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : colors.background,
    card: isDark ? darkColors.card : colors.card,
    text: isDark ? darkColors.text : colors.text,
    textLight: isDark ? darkColors.textLight : colors.textLight,
    textExtraLight: isDark ? darkColors.textExtraLight : colors.textExtraLight,
    border: isDark ? darkColors.border : colors.border,
    borderLight: isDark ? darkColors.borderLight : colors.borderLight,
  }), [isDark])
  const { students, loading, error, addStudent, updateStudent, deleteStudent, fetchStudents } = useStudents();
  const { width } = useWindowDimensions();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // Store generated passwords locally since production API doesn't return them
  const [generatedPasswords, setGeneratedPasswords] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState<'all' | 'has' | 'no'>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'created-desc' | 'created-asc'>('created-desc');

  const handleCopyPassword = async (password: string) => {
    try {
      await Clipboard.setStringAsync(password);
      Alert.alert('Success', 'Password copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy password to clipboard');
    }
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    setIsModalVisible(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsModalVisible(true);
  };

  const handleDeleteStudent = (student: Student) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${student.name}? This will also delete their user account if they have one.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(student.id);
            const success = await deleteStudent(student.id);
            setActionLoading(null);
            
            if (success) {
              // Remove the stored password for this student
              setGeneratedPasswords(prev => {
                const updated = { ...prev };
                delete updated[student.id];
                return updated;
              });
              Alert.alert('Success', 'Student deleted successfully');
            } else {
              Alert.alert('Error', 'Failed to delete student');
            }
          },
        },
      ]
    );
  };

  const handleSubmitStudent = async (data: CreateStudentData | UpdateStudentData) => {
    setActionLoading('submit');
    
    try {
      let success = false;
      
      if (editingStudent) {
        const result = await updateStudent(editingStudent.id, data as UpdateStudentData);
        success = !!result;
      } else {
        const result = await addStudent(data as CreateStudentData);
        success = !!result;
        
        if (result && result.generatedPassword) {
          // Store the generated password locally
          if (result.student && result.student.id) {
            setGeneratedPasswords(prev => ({
              ...prev,
              [result.student.id]: result.generatedPassword as string,
            }));
          }
          
          setIsModalVisible(false);
          // Refresh the student list to show the new student with password
          await fetchStudents();
          Alert.alert(
            'Student Created Successfully',
            `Student account created with auto-generated password:\n\nPassword: ${result.generatedPassword}\n\nPlease share this password with the student for their first login.`,
            [{ text: 'OK' }]
          );
          return;
        }
      }
      
      if (success) {
        setIsModalVisible(false);
        Alert.alert(
          'Success',
          `Student ${editingStudent ? 'updated' : 'created'} successfully`
        );
      } else {
        Alert.alert('Error', `Failed to ${editingStudent ? 'update' : 'create'} student`);
      }
    } catch (err) {
      Alert.alert('Error', `Failed to ${editingStudent ? 'update' : 'create'} student`);
    } finally {
      setActionLoading(null);
    }
  };

  const renderStudentCard = (student: Student) => (
    <Card key={student.id} style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(student.name || '?').slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, { color: themeColors.text }]}>{student.name}</Text>
          <Text style={[styles.studentDetail, { color: themeColors.textLight }]}>
            {student.registrationNumber || 'No Registration Number'}
          </Text>
          <Text style={[styles.studentDetail, { color: themeColors.textLight }]}>
            {student.email || 'No Email'}
          </Text>
          {(student.password || generatedPasswords[student.id]) && (
            <View style={styles.passwordContainer}>
              <Text style={styles.passwordText}>
                Password: {student.password || generatedPasswords[student.id]}
              </Text>
              <TouchableOpacity
                style={[styles.copyButton, { backgroundColor: themeColors.borderLight }]}
                onPress={() => handleCopyPassword(student.password || generatedPasswords[student.id])}
              >
                <Ionicons name="copy-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          {student.hasAccount && (
            <View style={styles.accountBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.accountBadgeText}>Has Account</Text>
            </View>
          )}
        </View>
        
        <View style={styles.studentActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: themeColors.borderLight }]}
            onPress={() => handleEditStudent(student)}
            disabled={!!actionLoading}
          >
            <Ionicons name="pencil" size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton, { backgroundColor: themeColors.borderLight }]}
            onPress={() => handleDeleteStudent(student)}
            disabled={!!actionLoading}
          >
            {actionLoading === student.id ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Ionicons name="trash" size={20} color={colors.danger} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={[styles.studentStats, { borderTopColor: themeColors.border }]}>
        <Text style={[styles.statText, { color: themeColors.textLight }]}>
          Enrolled Classes: {student.enrolledClassesCount || 0}
        </Text>
        <Text style={[styles.statText, { color: themeColors.textLight }]}>
          Created: {new Date(student.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </Card>
  );

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    const q = searchQuery.trim().toLowerCase();
    let list = students.filter(s => {
      const matchesQuery = !q ||
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.registrationNumber?.toLowerCase().includes(q);
      const matchesFilter =
        accountFilter === 'all' ? true :
        accountFilter === 'has' ? !!s.hasAccount : !s.hasAccount;
      return matchesQuery && matchesFilter;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === 'name-asc' || sortBy === 'name-desc') {
        const an = (a.name || '').toLowerCase();
        const bn = (b.name || '').toLowerCase();
        const cmp = an.localeCompare(bn);
        return sortBy === 'name-asc' ? cmp : -cmp;
      }
      const ad = new Date(a.createdAt).getTime();
      const bd = new Date(b.createdAt).getTime();
      return sortBy === 'created-asc' ? ad - bd : bd - ad;
    });
    return list;
  }, [students, searchQuery, accountFilter, sortBy]);

  if (loading && (!students || students.length === 0)) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: themeColors.text }]}>Loading students...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        <Button title="Retry" onPress={fetchStudents} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, width < 420 && styles.headerStack]}>
        <Text style={[styles.title, { color: themeColors.text }]}>Student Management</Text>
        <Button
          title="Add Student"
          onPress={handleAddStudent}
          disabled={!!actionLoading}
          style={width < 420 ? styles.addButtonFull : undefined}
        />
      </View>

      <View style={styles.toolbar}>
        <View style={[styles.searchWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Ionicons name="search" size={18} color={themeColors.textLight} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, email, or registration #"
            placeholderTextColor={themeColors.textLight}
            style={[styles.searchInput, { color: themeColors.text }]}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          <View style={styles.filtersRow}>
            <TouchableOpacity
              onPress={() => setAccountFilter('all')}
              style={[
                styles.chip,
                {
                  backgroundColor: accountFilter === 'all' ? colors.primary + '10' : themeColors.card,
                  borderColor: accountFilter === 'all' ? colors.primary : themeColors.border,
                }
              ]}
            >
              <Text style={[
                styles.chipText,
                { color: accountFilter === 'all' ? colors.primary : themeColors.text },
                accountFilter === 'all' && styles.chipTextActive
              ]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAccountFilter('has')}
              style={[
                styles.chip,
                {
                  backgroundColor: accountFilter === 'has' ? colors.primary + '10' : themeColors.card,
                  borderColor: accountFilter === 'has' ? colors.primary : themeColors.border,
                }
              ]}
            >
              <Text style={[
                styles.chipText,
                { color: accountFilter === 'has' ? colors.primary : themeColors.text },
                accountFilter === 'has' && styles.chipTextActive
              ]}>Has Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAccountFilter('no')}
              style={[
                styles.chip,
                {
                  backgroundColor: accountFilter === 'no' ? colors.primary + '10' : themeColors.card,
                  borderColor: accountFilter === 'no' ? colors.primary : themeColors.border,
                }
              ]}
            >
              <Text style={[
                styles.chipText,
                { color: accountFilter === 'no' ? colors.primary : themeColors.text },
                accountFilter === 'no' && styles.chipTextActive
              ]}>No Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setSortBy(prev => prev === 'created-desc' ? 'created-asc' : prev === 'created-asc' ? 'name-asc' : prev === 'name-asc' ? 'name-desc' : 'created-desc');
              }}
              style={[styles.sortButton, { backgroundColor: themeColors.card, borderColor: themeColors.border, marginLeft: spacing.xs }]}
            >
              <Ionicons name="swap-vertical" size={16} color={colors.primary} />
              <Text style={styles.sortText}>
                {sortBy === 'created-desc' && 'Newest'}
                {sortBy === 'created-asc' && 'Oldest'}
                {sortBy === 'name-asc' && 'Name A-Z'}
                {sortBy === 'name-desc' && 'Name Z-A'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <Text style={[styles.countText, { color: themeColors.textLight }]}>{filteredStudents.length} total</Text>
      </View>

      {!filteredStudents || filteredStudents.length === 0 ? (
        <EmptyState
          icon="users"
          title="No Students"
          message={searchQuery ? 'Try clearing your search or adjust your query' : 'Start by adding your first student'}
          actionLabel={!searchQuery ? 'Add Student' : undefined}
          onAction={!searchQuery ? handleAddStudent : undefined}
        />
      ) : (
        <ScrollView style={styles.studentsList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.studentsListContent}>
          {filteredStudents.map(renderStudentCard)}
        </ScrollView>
      )}

      <StudentFormModal
        visible={isModalVisible}
        student={editingStudent}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleSubmitStudent}
        loading={actionLoading === 'submit'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButtonFull: {
    width: '100%',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filtersScroll: {
    maxWidth: '50%',
  },
  filtersContent: {
    paddingRight: spacing.sm,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  searchWrapper: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    // Handled inline
  },
  chipText: {
    fontSize: 12,
  },
  chipTextActive: {
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  sortText: {
    fontSize: 12,
    color: colors.primary,
  },
  countText: {
    fontSize: 12,
  },
  studentsList: {
    flex: 1,
  },
  studentsListContent: {
    paddingBottom: spacing.xl,
  },
  studentCard: {
    marginBottom: spacing.md,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.card,
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  studentDetail: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  passwordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    fontFamily: 'monospace',
    flex: 1,
  },
  copyButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
    borderRadius: 4,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  accountBadgeText: {
    fontSize: 12,
    color: colors.success,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  studentActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: 8,
  },
  deleteButton: {
    // Handled inline
  },
  studentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  statText: {
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});