"use client"

import { StyleSheet, View, ScrollView, Text, TouchableOpacity } from "react-native"
import { colors } from "../../constants/Colors"
import { spacing } from "../../constants/spacing"
import { Card } from "../Card"
import { fonts } from "../../constants/fonts"
import { useAuth } from "../../hooks/useAuth"
import {
  mockStudents,
  getStudentAttendanceHistoryByMonthAndYear,
  getMonthlyAttendanceStatsForStudent,
} from "../../utils/mockData"
import { AttendanceStatusBadge } from "../AttendanceStatusBadge"
import { formatDate } from "../../utils/dateUtils"
import { AttendanceChart } from "../AttendanceChart"
import { EmptyState } from "../EmptyState"
import { Feather } from "@expo/vector-icons"
import { useState, useMemo } from "react"

type FilterStatus = "all" | "present" | "absent" | "late"
type SortColumn = "date" | "status"
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

  // Assuming the logged-in user is a student, we'll use a mock student for now
  const student = mockStudents.find((s) => s.id === user?.id) || mockStudents[0] // Fallback to first mock student

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

  // Get attendance history for the selected month and year
  const monthlyAttendanceHistory = useMemo(
    () => getStudentAttendanceHistoryByMonthAndYear(student.id, selectedMonth, selectedYear),
    [student.id, selectedMonth, selectedYear],
  )

  // Calculate attendance stats for the chart based on selected month/year
  const attendanceStats = useMemo(
    () => getMonthlyAttendanceStatsForStudent(student.id, selectedMonth, selectedYear),
    [student.id, selectedMonth, selectedYear],
  )

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.sectionTitle}>Your Attendance Overview</Text>
      <AttendanceChart stats={attendanceStats} />

      <Text style={styles.sectionTitle}>Attendance History</Text>

      {/* Month and Year Selectors */}
      <View style={styles.dateSelectorsContainer}>
        <View style={styles.dateSelector}>
          <Text style={styles.filterLabel}>Month:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorChips}>
            {months.map((monthName, index) => (
              <TouchableOpacity
                key={monthName}
                style={[styles.selectorChip, selectedMonth === index && styles.activeSelectorChip]}
                onPress={() => {
                  setSelectedMonth(index)
                  setCurrentPage(1) // Reset pagination on month change
                }}
              >
                <Text style={[styles.selectorChipText, selectedMonth === index && styles.activeSelectorChipText]}>
                  {monthName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.dateSelector}>
          <Text style={styles.filterLabel}>Year:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorChips}>
            {years.map((yearValue) => (
              <TouchableOpacity
                key={yearValue}
                style={[styles.selectorChip, selectedYear === yearValue && styles.activeSelectorChip]}
                onPress={() => {
                  setSelectedYear(yearValue)
                  setCurrentPage(1) // Reset pagination on year change
                }}
              >
                <Text style={[styles.selectorChipText, selectedYear === yearValue && styles.activeSelectorChipText]}>
                  {yearValue}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Filter Controls */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Status:</Text>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === "all" && styles.activeFilterButton]}
            onPress={() => setFilterStatus("all")}
          >
            <Text style={[styles.filterButtonText, filterStatus === "all" && styles.activeFilterButtonText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === "present" && styles.activeFilterButton]}
            onPress={() => setFilterStatus("present")}
          >
            <Text style={[styles.filterButtonText, filterStatus === "present" && styles.activeFilterButtonText]}>
              Present
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === "absent" && styles.activeFilterButton]}
            onPress={() => setFilterStatus("absent")}
          >
            <Text style={[styles.filterButtonText, filterStatus === "absent" && styles.activeFilterButtonText]}>
              Absent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === "late" && styles.activeFilterButton]}
            onPress={() => setFilterStatus("late")}
          >
            <Text style={[styles.filterButtonText, filterStatus === "late" && styles.activeFilterButtonText]}>
              Late
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {filteredAndSortedHistory.length === 0 ? (
        <EmptyState
          title="No Attendance Records"
          message="Your attendance history will appear here once recorded, or adjust your filters."
          icon="clipboard"
        />
      ) : (
        <Card variant="outlined" style={styles.historyCard}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <TouchableOpacity style={styles.headerCell} onPress={() => handleSort("date")}>
              <Text style={styles.headerText}>Date</Text>
              <Feather name={getSortIcon("date")} size={14} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCell} onPress={() => handleSort("status")}>
              <Text style={styles.headerText}>Status</Text>
              <Feather name={getSortIcon("status")} size={14} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Table Rows */}
          {paginatedHistory.map((record, index) => (
            <View
              key={record.id}
              style={[styles.historyItem, index < paginatedHistory.length - 1 && styles.borderBottom]}
            >
              <Text style={styles.dateText}>{formatDate(record.date)}</Text>
              <AttendanceStatusBadge status={record.status} />
            </View>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                  Previous
                </Text>
              </TouchableOpacity>
              <Text style={styles.paginationText}>
                Page {currentPage} of {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <Text
                  style={[
                    styles.paginationButtonText,
                    currentPage === totalPages && styles.paginationButtonTextDisabled,
                  ]}
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
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
    borderColor: colors.border,
    backgroundColor: colors.card,
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
    color: colors.text,
    fontWeight: fonts.weights.medium,
  },
  activeSelectorChipText: {
    color: colors.card,
    fontWeight: fonts.weights.semibold,
  },
  filterContainer: {
    marginBottom: spacing.xl, // Increased spacing
  },
  filterLabel: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
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
    borderColor: colors.border,
    backgroundColor: colors.card,
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
    color: colors.text,
    fontWeight: fonts.weights.medium, // Slightly bolder text
  },
  activeFilterButtonText: {
    color: colors.card,
    fontWeight: fonts.weights.semibold, // Bolder text when active
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg, // Increased horizontal padding
    backgroundColor: colors.borderLight, // Lighter background for header
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    fontWeight: fonts.weights.semibold,
    color: colors.text,
    marginRight: spacing.xs,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg, // Consistent padding with header
    backgroundColor: colors.card, // Ensure white background for rows
  },
  dateText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    color: colors.text,
    flex: 1, // Allow date text to take space
    textAlign: "center", // Center align date text
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.card, // Ensure white background for pagination area
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
    backgroundColor: colors.textExtraLight, // Grey out disabled buttons
  },
  paginationButtonText: {
    color: colors.card,
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.medium,
  },
  paginationButtonTextDisabled: {
    color: colors.textLight, // Lighter text for disabled buttons
  },
  paginationText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },
})
