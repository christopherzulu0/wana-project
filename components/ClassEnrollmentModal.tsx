import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Class, Student } from '../types';
import { useStudents } from '../hooks/useStudents';
import { colors } from '../constants/Colors';
import { spacing } from '../constants/spacing';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';
import { EmptyState } from './EmptyState';

interface ClassEnrollmentModalProps {
  visible: boolean;
  classItem: Class | null;
  onClose: () => void;
  onEnrollStudent: (classId: string, studentId: string) => Promise<boolean>;
  onUnenrollStudent: (classId: string, studentId: string) => Promise<boolean>;
  loading?: boolean;
}

export const ClassEnrollmentModal: React.FC<ClassEnrollmentModalProps> = ({
  visible,
  classItem,
  onClose,
  onEnrollStudent,
  onUnenrollStudent,
  loading = false,
}) => {
  const { students, loading: studentsLoading, fetchStudents } = useStudents();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible && classItem) {
      fetchStudents();
      // In a real app, you would fetch enrolled students for this class
      // For now, we'll simulate some enrolled students
      setEnrolledStudentIds(new Set());
    }
  }, [visible, classItem]);

  const filteredStudents = (students || []).filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (student.registrationNumber && student.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEnrollStudent = async (student: Student) => {
    if (!classItem) return;
    
    setActionLoading(student.id);
    try {
      const success = await onEnrollStudent(classItem.id, student.id);
      if (success) {
        setEnrolledStudentIds(prev => new Set([...prev, student.id]));
        Alert.alert('Success', `${student.name} has been enrolled in ${classItem.name}`);
      } else {
        Alert.alert('Error', 'Failed to enroll student');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to enroll student');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnenrollStudent = async (student: Student) => {
    if (!classItem) return;
    
    Alert.alert(
      'Unenroll Student',
      `Are you sure you want to unenroll ${student.name} from ${classItem.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unenroll',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(student.id);
            try {
              const success = await onUnenrollStudent(classItem.id, student.id);
              if (success) {
                setEnrolledStudentIds(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(student.id);
                  return newSet;
                });
                Alert.alert('Success', `${student.name} has been unenrolled from ${classItem.name}`);
              } else {
                Alert.alert('Error', 'Failed to unenroll student');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to unenroll student');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const renderStudentCard = (student: Student) => {
    const isEnrolled = enrolledStudentIds.has(student.id);
    const isLoading = actionLoading === student.id;

    return (
      <Card key={student.id} style={styles.studentCard}>
        <View style={styles.studentInfo}>
          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.studentDetail}>
              {student.registrationNumber || 'No Registration Number'}
            </Text>
            <Text style={styles.studentDetail}>
              {student.email || 'No Email'}
            </Text>
            {student.hasAccount && (
              <View style={styles.accountBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.accountBadgeText}>Has Account</Text>
              </View>
            )}
          </View>
          
          <View style={styles.studentActions}>
            {isEnrolled ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.unenrollButton]}
                onPress={() => handleUnenrollStudent(student)}
                disabled={isLoading || loading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <>
                    <Ionicons name="remove-circle" size={18} color={colors.danger} />
                    <Text style={[styles.actionButtonText, styles.unenrollButtonText]}>Unenroll</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.enrollButton]}
                onPress={() => handleEnrollStudent(student)}
                disabled={isLoading || loading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={18} color={colors.primary} />
                    <Text style={[styles.actionButtonText, styles.enrollButtonText]}>Enroll</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    );
  };

  if (!classItem) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Manage Enrollment</Text>
            <Text style={styles.subtitle}>{classItem.name} - {classItem.section}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Input
            placeholder="Search students by name, email, or registration number"
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Ionicons name="search" size={20} color={colors.text.secondary} />}
            style={styles.searchInput}
          />
        </View>

        {studentsLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading students...</Text>
          </View>
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            icon="people"
            title={searchQuery ? "No Students Found" : "No Students"}
            description={searchQuery ? "No students match your search criteria" : "No students available for enrollment"}
          />
        ) : (
          <ScrollView style={styles.studentsList} showsVerticalScrollIndicator={false}>
            <Text style={styles.studentsCount}>
              {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
            </Text>
            {filteredStudents.map(renderStudentCard)}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  closeButton: {
    padding: spacing.sm,
  },
  searchContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  studentsList: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: 0,
  },
  studentsCount: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  studentCard: {
    marginBottom: spacing.md,
  },
  studentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  studentDetail: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
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
    marginLeft: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  enrollButton: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  unenrollButton: {
    backgroundColor: colors.danger + '20',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  enrollButtonText: {
    color: colors.primary,
  },
  unenrollButtonText: {
    color: colors.danger,
  },
});