import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Student } from '../types';
import { CreateStudentData, UpdateStudentData } from '../hooks/useStudents';
import { colors } from '../constants/Colors';
import { spacing } from '../constants/spacing';
import { useColorScheme } from '../hooks/useColorScheme';
import { Input } from './Input';
import { Button } from './Button';

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

interface StudentFormModalProps {
  visible: boolean;
  student?: Student | null;
  onClose: () => void;
  onSubmit: (data: CreateStudentData | UpdateStudentData) => void;
  loading?: boolean;
}

// Generate a secure random password
const generatePassword = () => {
  const length = 8;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  visible,
  student,
  onClose,
  onSubmit,
  loading = false,
}) => {
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
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    registrationNumber: '',
    createAccount: false,
    password: '',
    autoGeneratePassword: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        email: student.email || '',
        registrationNumber: student.registrationNumber || '',
        createAccount: false,
        password: '',
        autoGeneratePassword: true,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        registrationNumber: '',
        createAccount: false,
        password: '',
        autoGeneratePassword: true,
      });
    }
    setErrors({});
  }, [student, visible]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.createAccount) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required for account creation';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      if (!student && !formData.autoGeneratePassword && !formData.password.trim()) {
        newErrors.password = 'Password is required for account creation';
      } else if (!student && !formData.autoGeneratePassword && formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    let finalPassword = undefined;
    if (formData.createAccount) {
      if (formData.autoGeneratePassword && !student) {
        finalPassword = generatePassword();
      } else if (formData.password.trim()) {
        finalPassword = formData.password.trim();
      }
    }

    const submitData = {
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      registrationNumber: formData.registrationNumber.trim() || undefined,
      createAccount: formData.createAccount,
      password: finalPassword,
      generatedPassword: formData.createAccount && formData.autoGeneratePassword && !student ? finalPassword : undefined,
    };

    onSubmit(submitData);
  };

  const handleCreateAccountToggle = (value: boolean) => {
    if (student?.hasAccount && !value) {
      Alert.alert(
        'Warning',
        'This student already has an account. Disabling this option will not delete their existing account.',
        [{ text: 'OK' }]
      );
    }
    
    setFormData(prev => ({ ...prev, createAccount: value }));
    
    // Clear password error when toggling off
    if (!value && errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={[styles.header, { borderBottomColor: themeColors.borderLight }]}>
          <Text style={[styles.title, { color: themeColors.text }]}>
            {student ? 'Edit Student' : 'Add New Student'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={themeColors.textLight} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Student Information</Text>
            
            <Input
              label="Full Name *"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter student's full name"
              error={errors.name}
              themeColors={themeColors}
            />

            <Input
              label="Registration Number"
              value={formData.registrationNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, registrationNumber: text }))}
              placeholder="Enter registration number (optional)"
              error={errors.registrationNumber}
              themeColors={themeColors}
            />

            <Input
              label="Email Address"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="Enter email address (optional)"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              themeColors={themeColors}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Account Settings</Text>
            
            <View style={[styles.switchContainer, { backgroundColor: themeColors.borderLight }]}>
              <View style={styles.switchInfo}>
                <Text style={[styles.switchLabel, { color: themeColors.text }]}>
                  {student?.hasAccount ? 'Update Account' : 'Create Login Account'}
                </Text>
                <Text style={[styles.switchDescription, { color: themeColors.textLight }]}>
                  {student?.hasAccount 
                    ? 'Allow updating the existing user account'
                    : 'Allow student to login to the system'
                  }
                </Text>
              </View>
              <Switch
                value={formData.createAccount}
                onValueChange={handleCreateAccountToggle}
                trackColor={{ false: themeColors.border, true: colors.primary }}
                thumbColor={formData.createAccount ? themeColors.card : themeColors.textLight}
              />
            </View>

            {formData.createAccount && (
              <View style={styles.accountFields}>
                {!student && (
                  <>
                    <View style={[styles.switchContainer, { backgroundColor: themeColors.borderLight }]}>
                      <View style={styles.switchInfo}>
                        <Text style={[styles.switchLabel, { color: themeColors.text }]}>Auto-Generate Password</Text>
                        <Text style={[styles.switchDescription, { color: themeColors.textLight }]}>
                          Automatically create a secure password for the student
                        </Text>
                      </View>
                      <Switch
                        value={formData.autoGeneratePassword}
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, autoGeneratePassword: value }));
                          if (value && errors.password) {
                            setErrors(prev => ({ ...prev, password: '' }));
                          }
                        }}
                        trackColor={{ false: themeColors.border, true: colors.primary }}
                        thumbColor={formData.autoGeneratePassword ? themeColors.card : themeColors.textLight}
                      />
                    </View>
                    
                    {formData.autoGeneratePassword ? (
                      <View style={[styles.passwordNote, { backgroundColor: colors.warning + '20' }]}>
                        <Ionicons name="key" size={16} color={colors.primary} />
                        <Text style={[styles.passwordNoteText, { color: colors.primary }]}>
                          A secure 8-character password will be generated automatically. You'll see it after creating the student.
                        </Text>
                      </View>
                    ) : (
                      <Input
                        label="Password *"
                        value={formData.password}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                        placeholder="Enter password (min 6 characters)"
                        secureTextEntry
                        error={errors.password}
                        themeColors={themeColors}
                      />
                    )}
                  </>
                )}
                
                {student && (
                  <View style={[styles.passwordNote, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="information-circle" size={16} color={colors.warning} />
                    <Text style={[styles.passwordNoteText, { color: colors.warning }]}>
                      Leave password empty to keep existing password
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: themeColors.borderLight }]}>
          <Button
            title="Cancel"
            onPress={onClose}
            variant="secondary"
            style={styles.cancelButton}
            disabled={loading}
          />
          <Button
            title={student ? 'Update Student' : 'Create Student'}
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={loading}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: spacing.sm,
  },
  form: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  switchInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  switchDescription: {
    fontSize: 14,
  },
  accountFields: {
    marginTop: spacing.md,
  },
  passwordNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  passwordNoteText: {
    fontSize: 14,
    marginLeft: spacing.sm,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});