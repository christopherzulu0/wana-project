// StudentManagementTab.tsx
"use client"

import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Pressable,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  FadeIn,
  FadeOut,
  withTiming,
  withRepeat,
  runOnJS,
} from 'react-native-reanimated';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/Colors';
import { spacing } from '../../constants/spacing';
import { CreateStudentData, UpdateStudentData, useStudents } from '../../hooks/useStudents';
import { Student } from '../../types';
import { Button } from '../Button';
import { Card } from '../Card';
import { EmptyState } from '../EmptyState';
import { StudentFormModal } from '../StudentFormModal';

// ── ZAMBIAN CONSTANTS ──
const ZM_TIMEZONE = 'Africa/Lusaka';
const ZM_TERMS = [
  { name: 'Term 1', start: '2025-01-13', end: '2025-04-11' },
  { name: 'Term 2', start: '2025-05-05', end: '2025-08-08' },
  { name: 'Term 3', start: '2025-09-01', end: '2025-12-05' },
];

// ── Polished Dark Theme (ZM) ──
const theme = {
  bg: "#0B0E15",
  card: "#13151A",
  surface: "#1A1D24",
  text: "#FEFEFE",
  textLight: "#9CA3AF",
  textMuted: "#6B7280",
  border: "#1A1D24",
  primary: colors.primary,
  success: colors.success,
  danger: colors.danger,
};

// ── Avatar Colors ──
const avatarColors = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#F97316",
];

export const StudentManagementTab: React.FC = () => {
  const { students, loading, error, addStudent, updateStudent, deleteStudent, fetchStudents } = useStudents();
  const { width } = useWindowDimensions();
  const [offline, setOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [generatedPasswords, setGeneratedPasswords] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState<'all' | 'has' | 'no'>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'created-desc' | 'created-asc'>('created-desc');
  const [loadingMore, setLoadingMore] = useState(false);
  const searchRef = useRef<TextInput>(null);

  const columns = width >= 768 ? 2 : 1;
  const pageSize = 25;

  // ── Current Term (ZM) ──
  const currentTerm = useMemo(() => {
    const now = new Date();
    return ZM_TERMS.find(t => now >= new Date(t.start) && now <= new Date(t.end)) || null;
  }, []);

  // ── Offline Detection (Zambia) ──
  useEffect(() => {
    const checkOffline = async () => {
      const cached = await AsyncStorage.getItem('students_cache');
      const state = await NetInfo.fetch();
      setOffline(!state.isConnected && !cached);
  };

    checkOffline();

    const unsubscribe = NetInfo.addEventListener(state => {
      setOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);


  // ── Filtered & Sorted List ──
  const filteredStudents = useMemo(() => {
    let list = students || [];
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.registrationNumber?.includes(q)
      );
    }
    if (accountFilter !== 'all') {
      list = list.filter(s => (accountFilter === 'has') === !!s.hasAccount);
    }
    list.sort((a, b) => {
      if (sortBy.includes('name')) {
        const cmp = (a.name || '').localeCompare(b.name || '');
        return sortBy === 'name-asc' ? cmp : -cmp;
      }
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return sortBy === 'created-asc' ? at - bt : bt - at;
    });
    return list;
  }, [students, searchQuery, accountFilter, sortBy]);

  // ── Paginated List ──
  const paginatedStudents = useMemo(() => {
    return filteredStudents.slice(0, page * pageSize);
  }, [filteredStudents, page, pageSize]);

  const hasMore = filteredStudents.length > paginatedStudents.length;

  // ── Reset page when filters change ──
  useEffect(() => {
    setPage(1);
  }, [searchQuery, accountFilter, sortBy]);

  // ── Handlers ──
  const openAdd = () => { setEditingStudent(null); setIsModalVisible(true); };
  const openEdit = (s: Student) => { setEditingStudent(s); setIsModalVisible(true); };

  const copyPassword = async (pw: string) => {
    await Clipboard.setStringAsync(pw);
    Alert.alert('Copied', 'Password copied to clipboard');
  };

  const handleSubmit = async (data: CreateStudentData | UpdateStudentData) => {
    setActionLoading('submit');
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, data as UpdateStudentData);
        setIsModalVisible(false);
        Alert.alert('Updated', `${editingStudent.name} updated`);
      } else {
        const res = await addStudent(data as CreateStudentData);
        if (res?.student?.id && res.generatedPassword) {
          setGeneratedPasswords(p => ({ ...p, [res.student!.id]: res.generatedPassword }));
          setIsModalVisible(false);
          await fetchStudents();
          Alert.alert('Account Created', `Password: ${res.generatedPassword}\n\nShare with student.`, [{ text: 'OK' }]);
        }
      }
    } catch {
      Alert.alert('Error', 'Operation failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !students?.length) return <ShimmerSkeleton />;
  if (error) return <ErrorState error={error} onRetry={fetchStudents} />;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, width < 420 && styles.headerStack]}>
        <View>
          <Text style={styles.title}>Students</Text>
          <Text style={styles.subtitle}>
            {currentTerm ? `${currentTerm.name} • ` : ''}
            {students.length} total
            {offline && ' (Offline)'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {selected.size > 0 ? (
            <Button title={`Delete (${selected.size})`} onPress={() => {}} variant="danger" />
          ) : (
            <Button title="Add" onPress={openAdd} />
          )}
        </View>
      </View>
      
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={theme.textMuted} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Name, phone, reg#..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.textMuted}
            accessibilityLabel="Search students"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={20} color={theme.primary} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filters}>
          <Chip label="All" active={accountFilter === 'all'} onPress={() => setAccountFilter('all')} />
          <Chip label="Account" active={accountFilter === 'has'} onPress={() => setAccountFilter('has')} />
          <Chip label="No Account" active={accountFilter === 'no'} onPress={() => setAccountFilter('no')} />
          <Chip
            label={sortBy === 'name-asc' ? 'A-Z' : sortBy === 'name-desc' ? 'Z-A' : sortBy === 'created-desc' ? 'New' : 'Old'}
            icon="swap-vertical"
            onPress={() => setSortBy(prev => {
              const cycle = ['created-desc', 'created-asc', 'name-asc', 'name-desc'] as const;
              return cycle[(cycle.indexOf(prev) + 1) % cycle.length];
            })}
          />
          </View>
      </View>

      {/* List */}
      <FlashList
        data={paginatedStudents}
        estimatedItemSize={185}
        numColumns={columns}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchStudents} tintColor={theme.primary} />}
        onEndReached={() => {
          if (hasMore && !loadingMore) {
            setLoadingMore(true);
            setPage(p => p + 1);
            setTimeout(() => setLoadingMore(false), 300);
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={hasMore && loadingMore ? <ActivityIndicator style={{ margin: 24 }} color={theme.primary} /> : null}
        renderItem={({ item }) => (
          <View style={styles.gridItem(columns)}>
            <StudentCard
              student={item}
              password={item.password || generatedPasswords[item.id]}
              onCopy={copyPassword}
              onEdit={openEdit}
            />
          </View>
        )}
        ListEmptyComponent={
        <EmptyState
            icon="people-outline"
            title={searchQuery ? "No students found" : "No students yet"}
            message={searchQuery ? "Try a different search" : "Add your first student to get started"}
            actionLabel="Add Student"
            onAction={openAdd}
        />
        }
      />

      {/* FAB with Pulse */}
      <Animated.View entering={FadeIn} style={styles.fab}>
        <Pressable onPress={openAdd} accessibilityLabel="Add new student">
          <FABInner />
        </Pressable>
      </Animated.View>

      <StudentFormModal
        visible={isModalVisible}
        student={editingStudent}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleSubmit}
        loading={actionLoading === 'submit'}
      />
    </View>
  );
};

// ── FAB Pulse Animation ──
const FABInner = () => {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(withSpring(1.1), -1, true);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={[styles.fabInner, animatedStyle]}>
      <Ionicons name="add" size={28} color="#FFF" />
    </Animated.View>
  );
};

// ── Student Card (Polished) ──
const StudentCard = React.memo(({ student, password, onCopy, onEdit }: any) => {
  const color = avatarColors[Math.abs((student.name?.charCodeAt(0) || 0)) % avatarColors.length];
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => scale.value = withSpring(0.97)}
      onPressOut={() => scale.value = withSpring(1)}
      accessibilityRole="button"
      accessibilityLabel={`Student ${student.name}`}
    >
      <Animated.View style={[styles.card, anim, { backgroundColor: theme.card }]}>
        <View style={[styles.cardInner, { backgroundColor: theme.card }]}>
          <View style={[styles.avatar, { borderColor: color }]}>
            <Text style={styles.avatarText}>{(student.name || '?').slice(0, 2).toUpperCase()}</Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.name}>{student.name}</Text>
            <Text style={styles.phone}>
              {student.phone ? student.phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : '—'}
            </Text>
            <Text style={styles.reg}>Reg: {student.registrationNumber || '—'}</Text>
            {student.hasAccount && <Text style={styles.active}>Active Account</Text>}
            {password && (
              <View style={styles.passRow}>
                <Text style={styles.pass}>••••••••</Text>
                <TouchableOpacity onPress={() => onCopy(password)} style={styles.copyBtn}>
                  <Ionicons name="copy" size={16} color={theme.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={() => onEdit(student)} style={styles.iconBtn}>
              <Ionicons name="pencil" size={18} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="trash" size={18} color={theme.danger} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.footer, { backgroundColor: theme.card }]}>
          <Text style={styles.stat}>{student.enrolledClassesCount || 0} Classes</Text>
          <Text style={styles.date}>
            {new Date(student.createdAt).toLocaleDateString('en-GB', {
              timeZone: ZM_TIMEZONE,
              day: '2-digit',
              month: 'short',
            })}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
});

// ── Chip (Tighter) ──
const Chip = ({ label, active, onPress, icon }: any) => {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable onPressIn={() => scale.value = withSpring(0.92)} onPressOut={() => scale.value = withSpring(1)} onPress={onPress}>
      <Animated.View style={[styles.chip, active && styles.chipActive, anim]}>
        {icon && <Ionicons name={icon} size={13} color={active ? theme.primary : theme.textMuted} />}
        <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
};

// ── Shimmer Skeleton ──
const ShimmerSkeleton = () => {
  const translateX = useSharedValue(-300);
  useEffect(() => {
    translateX.value = withRepeat(withTiming(300, { duration: 1200 }), -1);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.skeleton}>
      {[...Array(6)].map((_, i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonInfo}>
            <View style={[styles.skeletonLine, { width: 140 }]} />
            <View style={[styles.skeletonLine, { width: 90 }]} />
          </View>
          <Animated.View style={[styles.shimmer, animatedStyle]} />
        </View>
      ))}
    </View>
  );
};

// ── Error State ──
const ErrorState = ({ error, onRetry }: any) => (
  <View style={styles.error}>
    <Ionicons name="cloud-offline" size={56} color={theme.danger} />
    <Text style={styles.errorTitle}>Offline Mode</Text>
    <Text style={styles.errorText}>{error}</Text>
    <Button title="Retry" onPress={onRetry} />
  </View>
);

// ── Styles (Polished) ──
const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  headerStack: { flexDirection: 'column', gap: spacing.md, alignItems: 'flex-start' },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  title: { fontSize: 30, fontWeight: '800', color: theme.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: theme.textLight, marginTop: 4 },
  toolbar: { flexDirection: 'column', gap: spacing.md, marginBottom: spacing.lg },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    height: 56,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  searchInput: { flex: 1, marginLeft: spacing.sm, color: theme.text, fontSize: 16 },
  clearBtn: { padding: spacing.xs },
  filters: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: theme.card,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  chipActive: { backgroundColor: theme.primary + '18', borderColor: theme.primary },
  chipLabel: { fontSize: 13.5, color: theme.textMuted, fontWeight: '500' },
  chipLabelActive: { color: theme.primary, fontWeight: '600' },
  gridItem: (cols: number) => ({
    flex: cols === 1 ? 1 : 0,
    paddingHorizontal: cols === 2 ? 8 : 0,
  }),
  card: { marginBottom: spacing.lg, borderRadius: 24, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  cardInner: { flexDirection: 'row', padding: spacing.lg, gap: spacing.lg, alignItems: 'flex-start', borderRadius: spacing.md },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 3.5 },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 18 },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 18, fontWeight: '700', color: theme.text, letterSpacing: -0.2 },
  phone: { fontSize: 14.5, color: theme.textLight, fontFamily: 'monospace' },
  reg: { fontSize: 13.5, color: theme.textMuted },
  active: { fontSize: 12.5, color: theme.success, fontWeight: '600', marginTop: 3 },
  passRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  pass: { fontFamily: 'monospace', color: theme.primary, fontSize: 13.5, flex: 1 },
  copyBtn: { padding: 6 },
  actions: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'flex-start' },
  iconBtn: { padding: 10, backgroundColor: theme.surface, borderRadius: 14 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1.5,
    borderTopColor: theme.border,
  },
  stat: { fontSize: 13, color: theme.textLight, fontWeight: '500' },
  date: { fontSize: 13, color: theme.textMuted },
  fab: { position: 'absolute', right: 24, bottom: 24, backgroundColor: theme.primary, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 12, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
  fabInner: { padding: 4 },
  skeleton: { padding: spacing.lg, gap: spacing.lg },
  skeletonCard: { flexDirection: 'row', padding: spacing.lg, backgroundColor: theme.card, borderRadius: 20, gap: spacing.lg, overflow: 'hidden', position: 'relative' },
  skeletonAvatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: theme.border },
  skeletonInfo: { flex: 1, gap: 10 },
  skeletonLine: { height: 18, borderRadius: 9, backgroundColor: theme.border },
  shimmer: { position: 'absolute', top: 0, left: 0, width: 100, height: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  error: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.lg },
  errorTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
  errorText: { color: theme.danger, fontSize: 16, textAlign: 'center', marginBottom: spacing.lg },
});