"use client"

import { StyleSheet, View, ScrollView, Text, TouchableOpacity, ActivityIndicator } from "react-native"
import { colors } from "../../constants/Colors"
import { spacing } from "../../constants/spacing"
import { Card } from "../Card"
import { fonts } from "../../constants/fonts"
import { useAuth } from "../../hooks/useAuth"
// Removed mock data imports - now fetching from API
import { AttendanceStatusBadge } from "../AttendanceStatusBadge"
import { formatDate } from "../../utils/dateUtils"
import { AttendanceChart } from "../AttendanceChart"
import { EmptyState } from "../EmptyState"
import { Feather } from "@expo/vector-icons"
import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { RefreshControl } from "react-native"
import { useFocusEffect } from "expo-router"
import { useColorScheme } from "../../hooks/useColorScheme"

const API_BASE_URL = 'http://10.156.181.203:3000'

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

type FilterStatus = "all" | "present" | "absent" | "late"
type SortColumn = "date" | "status" | "class"
type SortDirection = "asc" | "desc"

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - i) // Last 5 years

export function StudentAttendanceHistoryTab() {
  const { user } = useAuth()
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

  // State for month and year selection
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()) // 0-indexed
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // State for filters, sorting, and pagination
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [sortConfig, setSortConfig] = useState<{ column: SortColumn; direction: SortDirection }>({
    column: "date",
    direction: "desc",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // State for API data
  const [studentId, setStudentId] = useState<string | null>(null)
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Ref for polling interval
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const POLL_INTERVAL = 30000 // 30 seconds

  // Fetch student record first (to get student ID from user ID)
  const fetchStudentRecord = useCallback(async () => {
    if (!user?.id) {
      setError('User not logged in')
      setLoading(false)
      return
    }

    // Check if user is actually a student
    if (user.role !== 'student') {
      setError('Access denied. This page is only available for students.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Fetching student record for user ID:', user.id)
      const response = await fetch(`${API_BASE_URL}/api/students/by-user/${user.id}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Student record response:', data)
        if (data.student?.id) {
          setStudentId(data.student.id.toString())
          setError(null) // Clear any previous errors
        } else {
          setError('Student record not found. Please contact an administrator to link your account.')
        }
      } else if (response.status === 404) {
        // Student record doesn't exist or isn't linked
        const errorData = await response.json().catch(() => ({ error: 'Student not found' }))
        console.error('Student not found for user:', user.id, 'Error:', errorData.error)
        setError('Your student record is not linked to your account. Please contact an administrator to link your student profile to your user account.')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch student record' }))
        console.error('Error fetching student record:', errorData)
        setError(errorData.error || 'Failed to fetch student record. Please try again later.')
      }
    } catch (err) {
      console.error('Error fetching student record:', err)
      setError('Network error occurred while fetching student data. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.role])

  // Fetch student record on mount
  useEffect(() => {
    fetchStudentRecord()
  }, [fetchStudentRecord])

  // Wrap fetchAttendanceHistory in useCallback to prevent infinite re-renders
  const fetchAttendanceHistory = useCallback(async (showLoading = true) => {
    if (!studentId) {
      return // Wait for student ID to be fetched
    }

    try {
      if (showLoading) {
        setLoading(true)
      }
      setError(null)

      const url = `${API_BASE_URL}/api/students/${studentId}/attendance?month=${selectedMonth + 1}&year=${selectedYear}`
      console.log('Fetching attendance from:', url)

      const response = await fetch(url)
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('Attendance data received:', data.attendance?.length || 0, 'records')
        setAttendanceData(data.attendance || [])
        setError(null) // Clear any errors on success
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to fetch attendance records')
        // Don't clear data on error, keep existing data visible
      }
    } catch (err) {
      console.error('Error fetching attendance:', err)
      setError('Network error occurred while fetching attendance data')
      // Don't clear data on error, keep existing data visible
    } finally {
      if (showLoading) {
      setLoading(false)
      }
      setRefreshing(false)
    }
  }, [studentId, selectedMonth, selectedYear])

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchAttendanceHistory(false) // Don't show loading spinner for pull-to-refresh
  }, [fetchAttendanceHistory])

  // Set up polling when studentId is available
  useEffect(() => {
    if (!studentId) {
      return
    }

    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    // Initial fetch
    fetchAttendanceHistory(true)

    // Set up polling interval
    pollIntervalRef.current = setInterval(() => {
      console.log('Auto-refreshing attendance data...')
      fetchAttendanceHistory(false) // Silent refresh in background
    }, POLL_INTERVAL)

    // Cleanup on unmount or when dependencies change
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [studentId, selectedMonth, selectedYear, fetchAttendanceHistory])

  // Refetch when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (studentId) {
        console.log('Tab focused, refreshing attendance data...')
        fetchAttendanceHistory(false) // Silent refresh when tab becomes active
      }
    }, [studentId, fetchAttendanceHistory])
  )

  // Get attendance history for the selected month and year
  const monthlyAttendanceHistory = useMemo(
    () => attendanceData,
    [attendanceData],
  )

  // Calculate attendance stats for the chart based on actual data
  const attendanceStats = useMemo(() => {
    const present = attendanceData.filter(r => r.status === 'present').length
    const absent = attendanceData.filter(r => r.status === 'absent').length
    const late = attendanceData.filter(r => r.status === 'late').length
    return { present, absent, late, total: attendanceData.length }
  }, [attendanceData])

  // Filter and sort logic
  const filteredAndSortedHistory = useMemo(() => {
    let sortableItems = [...monthlyAttendanceHistory]

    // 1. Filter by status
    if (filterStatus !== "all") {
      sortableItems = sortableItems.filter((record) => record.status === filterStatus)
    }

    // 2. Sort
    if (sortConfig.column) {
      sortableItems.sort((a, b) => {
        let aValue: string | number = ""
        let bValue: string | number = ""

        if (sortConfig.column === "date") {
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
        } else if (sortConfig.column === "status") {
          aValue = a.status.toLowerCase()
          bValue = b.status.toLowerCase()
        } else if (sortConfig.column === "class") {
          aValue = (a.className || '').toLowerCase()
          bValue = (b.className || '').toLowerCase()
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1
        }
        return 0
      })
    }
    return sortableItems
  }, [monthlyAttendanceHistory, filterStatus, sortConfig])

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedHistory.length / itemsPerPage)
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedHistory.slice(startIndex, endIndex)
  }, [filteredAndSortedHistory, currentPage, itemsPerPage])

  const handleSort = (column: SortColumn) => {
    setSortConfig((prevConfig) => ({
      column,
      direction: prevConfig.column === column && prevConfig.direction === "asc" ? "desc" : "asc",
    }))
  }

  const getSortIcon = (column: SortColumn) => {
    if (sortConfig.column === column) {
      return sortConfig.direction === "asc" ? "arrow-up" : "arrow-down"
    }
    return "minus" // Neutral icon
  }

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    loadingText: {
      marginTop: spacing.md,
      fontSize: fonts.sizes.md,
      color: themeColors.textLight,
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    sectionTitle: {
      fontSize: fonts.sizes.lg,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.semibold as any,
      color: themeColors.text,
      marginBottom: spacing.md,
    },
    filterLabel: {
      fontSize: fonts.sizes.md,
      fontFamily: fonts.regular,
      fontWeight: fonts.weights.semibold as any,
      color: themeColors.text,
      marginBottom: spacing.sm,
    },
    selectorChip: {
      borderColor: themeColors.border,
      backgroundColor: themeColors.card,
    },
    selectorChipText: {
      color: themeColors.text,
    },
    filterButton: {
      borderColor: themeColors.border,
      backgroundColor: themeColors.card,
    },
    filterButtonText: {
      color: themeColors.text,
    },
    tableHeader: {
      backgroundColor: themeColors.borderLight,
      borderBottomColor: themeColors.border,
    },
    headerText: {
      color: themeColors.text,
    },
    historyItem: {
      backgroundColor: themeColors.card,
    },
    dateText: {
      color: themeColors.text,
    },
    classText: {
      color: themeColors.text,
    },
    borderBottom: {
      borderBottomColor: themeColors.borderLight,
    },
    paginationContainer: {
      borderTopColor: themeColors.borderLight,
      backgroundColor: themeColors.card,
    },
    paginationButtonDisabled: {
      backgroundColor: themeColors.textExtraLight,
    },
    paginationButtonTextDisabled: {
      color: themeColors.textLight,
    },
    paginationText: {
      color: themeColors.textLight,
    },
    errorText: {
      color: colors.danger,
    },
    errorBanner: {
      backgroundColor: isDark ? `${colors.danger}20` : "#fef2f2",
      borderColor: isDark ? `${colors.danger}40` : "#fecaca",
    },
    errorBannerText: {
      color: colors.danger,
    },
    refreshButton: {
      backgroundColor: themeColors.card,
      borderColor: themeColors.border,
    },
  }), [themeColors, isDark])

  if (loading) {
    return (
      <View style={[dynamicStyles.container as any, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={dynamicStyles.loadingText as any}>
          {studentId ? 'Loading attendance data...' : 'Loading student record...'}
        </Text>
      </View>
    )
  }

  if (error && !studentId) {
    return (
      <View style={[dynamicStyles.container as any, styles.centerContent]}>
        <Feather name="alert-circle" size={48} color={colors.danger} />
        <Text style={[styles.errorText, dynamicStyles.errorText] as any}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton as any} 
          onPress={fetchStudentRecord}
        >
          <Text style={styles.retryButtonText as any}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView 
      style={dynamicStyles.container as any} 
      contentContainerStyle={dynamicStyles.scrollContent as any}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.headerRow as any}>
        <Text style={dynamicStyles.sectionTitle as any}>Your Attendance Overview</Text>
        <TouchableOpacity 
          style={[styles.refreshButton, dynamicStyles.refreshButton] as any}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Feather 
            name="refresh-cw" 
            size={20} 
            color={colors.primary}
            style={refreshing && styles.refreshingIcon as any}
          />
        </TouchableOpacity>
      </View>
      <AttendanceChart stats={attendanceStats} />

      <View style={styles.headerRow as any}>
        <Text style={dynamicStyles.sectionTitle as any}>Attendance History</Text>
      </View>

      {/* Month and Year Selectors */}
      <View style={styles.dateSelectorsContainer as any}>
        <View style={styles.dateSelector as any}>
          <Text style={dynamicStyles.filterLabel as any}>Month:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorChips as any}>
            {months.map((monthName, index) => (
              <TouchableOpacity
                key={monthName}
                style={[styles.selectorChip, dynamicStyles.selectorChip as any, selectedMonth === index && styles.activeSelectorChip] as any}
                onPress={() => {
                  setSelectedMonth(index)
                  setCurrentPage(1) // Reset pagination on month change
                }}
              >
              <Text style={[styles.selectorChipText, dynamicStyles.selectorChipText, selectedMonth === index && styles.activeSelectorChipText] as any}>
                  {monthName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.dateSelector as any}>
          <Text style={dynamicStyles.filterLabel as any}>Year:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorChips as any}>
            {years.map((yearValue) => (
              <TouchableOpacity
                key={yearValue}
                style={[styles.selectorChip, dynamicStyles.selectorChip as any, selectedYear === yearValue && styles.activeSelectorChip] as any}
                onPress={() => {
                  setSelectedYear(yearValue)
                  setCurrentPage(1) // Reset pagination on year change
                }}
              >
                <Text style={[styles.selectorChipText, dynamicStyles.selectorChipText, selectedYear === yearValue && styles.activeSelectorChipText] as any}>
                  {yearValue}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Filter Controls */}
      <View style={styles.filterContainer as any}>
        <Text style={dynamicStyles.filterLabel as any}>Filter by Status:</Text>
        <View style={styles.filterButtons as any}>
          <TouchableOpacity
            style={[styles.filterButton, dynamicStyles.filterButton as any, filterStatus === "all" && styles.activeFilterButton] as any}
            onPress={() => setFilterStatus("all")}
          >
            <Text style={[styles.filterButtonText, dynamicStyles.filterButtonText, filterStatus === "all" && styles.activeFilterButtonText] as any}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, dynamicStyles.filterButton as any, filterStatus === "present" && styles.activeFilterButton] as any}
            onPress={() => setFilterStatus("present")}
          >
            <Text style={[styles.filterButtonText, dynamicStyles.filterButtonText, filterStatus === "present" && styles.activeFilterButtonText] as any}>
              Present
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, dynamicStyles.filterButton as any, filterStatus === "absent" && styles.activeFilterButton] as any}
            onPress={() => setFilterStatus("absent")}
          >
            <Text style={[styles.filterButtonText, dynamicStyles.filterButtonText, filterStatus === "absent" && styles.activeFilterButtonText] as any}>
              Absent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, dynamicStyles.filterButton as any, filterStatus === "late" && styles.activeFilterButton] as any}
            onPress={() => setFilterStatus("late")}
          >
            <Text style={[styles.filterButtonText, dynamicStyles.filterButtonText, filterStatus === "late" && styles.activeFilterButtonText] as any}>
              Late
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && studentId ? (
        <View style={[styles.errorBanner, dynamicStyles.errorBanner] as any}>
          <Feather name="alert-circle" size={20} color={colors.danger} />
          <Text style={[styles.errorBannerText, dynamicStyles.errorBannerText] as any}>{error}</Text>
        </View>
      ) : null}

      {filteredAndSortedHistory.length === 0 && !loading ? (
        <EmptyState
          title="No Attendance Records"
          message="Your attendance history will appear here once recorded, or adjust your filters."
          icon="clipboard"
        />
      ) : (
        <Card variant="outlined" style={styles.historyCard as any}>
          {/* Table Header */}
          <View style={[styles.tableHeader, dynamicStyles.tableHeader] as any}>
            <TouchableOpacity style={styles.headerCell as any} onPress={() => handleSort("date")}>
              <Text style={[styles.headerText, dynamicStyles.headerText] as any}>Date</Text>
              <Feather name={getSortIcon("date")} size={14} color={themeColors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCell as any} onPress={() => handleSort("class")}>
              <Text style={[styles.headerText, dynamicStyles.headerText] as any}>Class</Text>
              <Feather name={getSortIcon("class")} size={14} color={themeColors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCell as any} onPress={() => handleSort("status")}>
              <Text style={[styles.headerText, dynamicStyles.headerText] as any}>Status</Text>
              <Feather name={getSortIcon("status")} size={14} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          {/* Table Rows */}
          {paginatedHistory.map((record, index) => (
            <View
              key={record.id}
              style={[styles.historyItem, dynamicStyles.historyItem as any, index < paginatedHistory.length - 1 && [styles.borderBottom, dynamicStyles.borderBottom] as any] as any}
            >
              <Text style={[styles.dateText, dynamicStyles.dateText] as any}>{formatDate(record.date)}</Text>
              <Text style={[styles.classText, dynamicStyles.classText] as any}>
                {record.className || 'Unknown'}
                {record.section && ` (${record.section})`}
              </Text>
              <AttendanceStatusBadge status={record.status} />
            </View>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <View style={[styles.paginationContainer, dynamicStyles.paginationContainer] as any}>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === 1 && [styles.paginationButtonDisabled, dynamicStyles.paginationButtonDisabled] as any] as any}
                onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <Text style={[styles.paginationButtonText, currentPage === 1 && [styles.paginationButtonTextDisabled, dynamicStyles.paginationButtonTextDisabled]] as any}>
                  Previous
                </Text>
              </TouchableOpacity>
              <Text style={[styles.paginationText, dynamicStyles.paginationText] as any}>
                Page {currentPage} of {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === totalPages && [styles.paginationButtonDisabled, dynamicStyles.paginationButtonDisabled] as any] as any}
                onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <Text
                  style={[
                    styles.paginationButtonText,
                    currentPage === totalPages && [styles.paginationButtonTextDisabled, dynamicStyles.paginationButtonTextDisabled],
                  ] as any}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyCard: {
    padding: 0,
    overflow: "hidden", // Ensures rounded corners apply to children
  },
  dateSelectorsContainer: {
    marginBottom: spacing.xl,
  },
  dateSelector: {
    marginBottom: spacing.md,
  },
  selectorChips: {
    paddingRight: spacing.lg, // Allow last chip to be fully visible
  },
  selectorChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 100,
    borderWidth: 1,
    marginRight: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeSelectorChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  selectorChipText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.medium as any,
  },
  activeSelectorChipText: {
    color: colors.card,
    fontWeight: fonts.weights.semibold as any,
  },
  filterContainer: {
    marginBottom: spacing.xl, // Increased spacing
  },
  filterButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm, // Use gap for consistent spacing
  },
  filterButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 100,
    borderWidth: 1,
    shadowColor: "#000", // Added subtle shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowOpacity: 0.1, // More prominent shadow when active
    elevation: 2,
  },
  filterButtonText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.medium as any, // Slightly bolder text
  },
  activeFilterButtonText: {
    color: colors.card,
    fontWeight: fonts.weights.semibold as any, // Bolder text when active
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg, // Increased horizontal padding
    borderBottomWidth: 1,
  },
  headerCell: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    flex: 1, // Allow cells to expand
    justifyContent: "center", // Center content in header cells
  },
  headerText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold as any,
    marginRight: spacing.xs,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg, // Consistent padding with header
  },
  dateText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    flex: 1, // Allow date text to take space
    textAlign: "center" as const, // Center align date text
  },
  classText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    flex: 1.5, // Give class name a bit more space
    textAlign: "center" as const,
    fontWeight: fonts.weights.medium as any,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderTopWidth: 1,
    borderBottomLeftRadius: spacing.md, // Apply bottom radius to card
    borderBottomRightRadius: spacing.md,
  },
  paginationButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.sm,
    backgroundColor: colors.primary,
  },
  paginationButtonDisabled: {
    // Background color handled by dynamicStyles
  },
  paginationButtonText: {
    color: colors.card,
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.medium as any,
  },
  paginationButtonTextDisabled: {
    // Color handled by dynamicStyles
  },
  paginationText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    textAlign: "center" as const,
    paddingHorizontal: spacing.lg,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.md,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    color: colors.card,
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold as any,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorBannerText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    marginLeft: spacing.sm,
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  refreshButton: {
    padding: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
  },
  refreshingIcon: {
    opacity: 0.5,
  },
})
