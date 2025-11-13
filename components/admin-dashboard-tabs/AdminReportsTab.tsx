import { useMemo, useState } from "react"
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, ActivityIndicator, Alert, Modal } from "react-native"
import { colors } from "../../constants/Colors"
import { spacing } from "../../constants/spacing"
import { Card } from "../Card"
import { fonts } from "../../constants/fonts"
import { Feather } from "@expo/vector-icons"
import { useColorScheme } from "../../hooks/useColorScheme"
import { useStudents } from "../../hooks/useStudents"
import { useClasses } from "../../hooks/useClasses"
import { useUsers } from "../../hooks/useUsers"
import * as FileSystem from 'expo-file-system/legacy'
import * as Linking from 'expo-linking'
import {
  generateOverallAttendanceReport,
  generateClassWiseReport,
  generateTeacherActivityReport,
  generateAbsenteeismTrendsReport,
  saveAndShareReport,
} from "../../utils/reportGenerator"

// Dark mode color palette
const darkColors = {
  background: "#151718",
  card: "#1F2324",
  text: "#ECEDEE",
  textLight: "#9BA1A6",
  border: "#2A2D2E",
  borderLight: "#252829",
}

export function AdminReportsTab() {
  const colorScheme = useColorScheme() ?? 'dark'
  const isDark = colorScheme === 'dark'
  const { students } = useStudents()
  const { classes } = useClasses()
  const { users } = useUsers()
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null)
  const [generatedReports, setGeneratedReports] = useState<Record<string, string>>({}) // Store file URIs
  const [viewingReportId, setViewingReportId] = useState<string | null>(null)
  const [reportContent, setReportContent] = useState<string>('')

  // Theme-aware colors
  const themeColors = useMemo(() => ({
    background: isDark ? darkColors.background : colors.background,
    card: isDark ? darkColors.card : colors.card,
    text: isDark ? darkColors.text : colors.text,
    textLight: isDark ? darkColors.textLight : colors.textLight,
    borderLight: isDark ? darkColors.borderLight : colors.borderLight,
  }), [isDark])

  const handleViewReport = async (reportId: string, fileUri: string) => {
    try {
      // Read the file content using legacy API
      const content = await FileSystem.readAsStringAsync(fileUri)
      setReportContent(content)
      setViewingReportId(reportId)
    } catch (error) {
      console.error('Error reading file:', error)
      // Fallback: try to open with system app
      try {
        await Linking.openURL(fileUri)
      } catch (linkError) {
        Alert.alert('Info', 'File saved. You can open it from your device\'s file manager or share it to view in Excel.')
      }
    }
  }

  const handleShareReport = async (fileUri: string) => {
    try {
      // Try to use expo-sharing if available
      let Sharing
      try {
        Sharing = require('expo-sharing')
      } catch (importError) {
        // expo-sharing not installed
        Alert.alert(
          'Sharing Not Available',
          'Please install expo-sharing to share files. The report has been saved to your device storage.',
          [{ text: 'OK' }]
        )
        return
      }
      
      const isAvailable = await Sharing.isAvailableAsync()
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Share Report',
        })
      } else {
        // Sharing not available on this device
        Alert.alert(
          'Sharing Not Available',
          'File sharing is not available on this device. The report has been saved to your device storage.',
          [{ text: 'OK' }]
        )
      }
    } catch (error) {
      console.error('Error sharing file:', error)
      Alert.alert(
        'Error Sharing File',
        'Unable to share the file. The report has been saved to your device storage. You can find it in your file manager.',
        [{ text: 'OK' }]
      )
    }
  }

  const handleGenerateReport = async (reportId: string, reportTitle: string) => {
    if (generatingReportId) return
    
    setGeneratingReportId(reportId)
    try {
      let csvContent = ''
      let filename = ''
      
      switch (reportId) {
        case "1": // Overall Attendance Summary
          csvContent = await generateOverallAttendanceReport(students, classes)
          filename = 'overall-attendance-summary'
          break
        case "2": // Student Performance by Attendance (same as overall for now)
          csvContent = await generateOverallAttendanceReport(students, classes)
          filename = 'student-performance-attendance'
          break
        case "3": // Teacher Activity Log
          csvContent = await generateTeacherActivityReport(users, classes)
          filename = 'teacher-activity-log'
          break
        case "4": // Absenteeism Trends
          csvContent = await generateAbsenteeismTrendsReport(students)
          filename = 'absenteeism-trends'
          break
        case "5": // Class-wise Attendance Breakdown
          csvContent = await generateClassWiseReport(classes, students)
          filename = 'class-wise-attendance'
          break
        default:
          throw new Error('Unknown report type')
      }
      
      const fileUri = await saveAndShareReport(csvContent, filename)
      if (fileUri) {
        setGeneratedReports(prev => ({ ...prev, [reportId]: fileUri }))
        Alert.alert('Success', `${reportTitle} has been generated and is ready to share.`, [
          { text: 'OK' },
          { text: 'View', onPress: () => handleViewReport(reportId, fileUri) }
        ])
      } else {
        Alert.alert('Success', `${reportTitle} has been generated. File saved to device.`)
      }
    } catch (error) {
      console.error('Error generating report:', error)
      Alert.alert('Error', `Failed to generate ${reportTitle}. Please try again.`)
    } finally {
      setGeneratingReportId(null)
    }
  }

  const mockReports = [
    {
      id: "1",
      title: "Overall Attendance Summary",
      description: "Comprehensive attendance data across all classes and students.",
      icon: "pie-chart",
    },
    {
      id: "2",
      title: "Student Performance by Attendance",
      description: "Analyze the correlation between attendance and academic performance.",
      icon: "trending-up",
    },
    {
      id: "3",
      title: "Teacher Activity Log",
      description: "View attendance marking activities by teachers.",
      icon: "clipboard",
    },
    {
      id: "4",
      title: "Absenteeism Trends",
      description: "Identify patterns and trends in student absenteeism.",
      icon: "alert-triangle",
    },
    {
      id: "5",
      title: "Class-wise Attendance Breakdown",
      description: "Detailed attendance reports for individual classes.",
      icon: "bar-chart",
    },
  ]

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Available Reports</Text>
      {mockReports.map((report) => {
        const isGenerating = generatingReportId === report.id
        return (
          <Card key={report.id} variant="outlined" style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Feather name={report.icon as any} size={24} color={colors.primary} />
              <Text style={[styles.reportTitle, { color: themeColors.text }]}>{report.title}</Text>
            </View>
            <Text style={[styles.reportDescription, { color: themeColors.textLight }]}>{report.description}</Text>
            <View style={[styles.reportActions, { borderTopColor: themeColors.borderLight }]}>
              {generatedReports[report.id] ? (
                <View style={styles.reportActionButtons}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => handleViewReport(report.id, generatedReports[report.id])}
                    activeOpacity={0.7}
                  >
                    <Feather name="eye" size={16} color={colors.primary} />
                    <Text style={[styles.viewButtonText, { color: colors.primary }]}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => handleShareReport(generatedReports[report.id])}
                    activeOpacity={0.7}
                  >
                    <Feather name="share-2" size={16} color={colors.primary} />
                    <Text style={[styles.shareButtonText, { color: colors.primary }]}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.regenerateButton}
                    onPress={() => handleGenerateReport(report.id, report.title)}
                    disabled={isGenerating || !!generatingReportId}
                    activeOpacity={0.7}
                  >
                    <Feather name="refresh-cw" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleGenerateReport(report.id, report.title)}
                  disabled={isGenerating || !!generatingReportId}
                  activeOpacity={0.7}
                  style={styles.generateButtonContainer}
                >
                  {isGenerating ? (
                    <>
                      <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: spacing.xs }} />
                      <Text style={[styles.generateButton, { opacity: 0.7 }]}>Generating...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.generateButton}>Generate Report</Text>
                      <Feather name="arrow-right" size={18} color={colors.primary} />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )
      })}

      {/* Report View Modal */}
      <Modal
        visible={!!viewingReportId}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setViewingReportId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.borderLight }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                {mockReports.find(r => r.id === viewingReportId)?.title || 'Report'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setViewingReportId(null)
                  setReportContent('')
                }}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color={themeColors.textLight} />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.modalBody} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContentContainer}
            >
              <View style={[styles.csvContainer, { backgroundColor: themeColors.background }]}>
                <Text 
                  style={[styles.csvText, { color: themeColors.text }]}
                  selectable={true}
                >
                  {reportContent || 'No content available'}
                </Text>
              </View>
            </ScrollView>
            <View style={[styles.modalFooter, { borderTopColor: themeColors.borderLight }]}>
              {viewingReportId && generatedReports[viewingReportId] && (
                <TouchableOpacity
                  style={styles.openExcelButton}
                  onPress={() => handleShareReport(generatedReports[viewingReportId])}
                >
                  <Feather name="download" size={18} color={themeColors.card} />
                  <Text style={[styles.openExcelButtonText, { color: themeColors.card }]}>
                    Open in Excel
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    marginBottom: spacing.md,
  },
  reportCard: {
    marginBottom: spacing.md,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  reportTitle: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    marginLeft: spacing.sm,
  },
  reportDescription: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    marginBottom: spacing.md,
  },
  reportActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    paddingVertical: spacing.xs,
  },
  generateButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  generateButton: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.medium,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  reportActionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  viewButtonText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.medium,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  shareButtonText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.medium,
  },
  regenerateButton: {
    padding: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  modalContent: {
    width: "95%",
    maxWidth: 600,
    height: "85%",
    maxHeight: 700,
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.bold,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalBody: {
    flex: 1,
    padding: spacing.lg,
    minHeight: 0,
  },
  scrollContentContainer: {
    paddingBottom: spacing.md,
  },
  csvContainer: {
    borderRadius: 8,
    padding: spacing.md,
    width: "100%",
  },
  csvText: {
    fontSize: 11,
    fontFamily: "monospace",
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    flexShrink: 0,
  },
  openExcelButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  openExcelButtonText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
  },
})
