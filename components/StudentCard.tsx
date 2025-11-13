import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/Colors";
import { fonts } from "../constants/fonts";
import { spacing } from "../constants/spacing";
import { AttendanceRecord, Student } from "../types";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";
import { Avatar } from "./Avatar";
import { Card } from "./Card";

interface StudentCardProps {
  student: Student;
  attendanceRecord?: AttendanceRecord;
  onMarkAttendance?: (student: Student, status: "present" | "absent" | "late") => void;
  showAttendanceControls?: boolean;
  themeColors?: {
    background?: string;
    card?: string;
    text?: string;
    textLight?: string;
    textExtraLight?: string;
    border?: string;
    borderLight?: string;
  };
}

export const StudentCard = ({ 
  student, 
  attendanceRecord,
  onMarkAttendance,
  showAttendanceControls = false,
  themeColors,
}: StudentCardProps) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/student/${student.id}`);
  };

  const handleMarkAttendance = (status: "present" | "absent" | "late") => {
    if (onMarkAttendance) {
      onMarkAttendance(student, status);
    }
  };

  const cardThemeColors = {
    text: themeColors?.text || colors.text,
    textLight: themeColors?.textLight || colors.textLight,
    textExtraLight: themeColors?.textExtraLight || colors.textExtraLight,
    borderLight: themeColors?.borderLight || colors.borderLight,
  };

  return (
    <Card variant="outlined" style={styles.card}>
      <TouchableOpacity 
        style={styles.cardContent} 
        activeOpacity={0.7}
        onPress={handlePress}
      >
        <Avatar 
          source={student.avatar} 
          name={student.name} 
          size={50} 
        />
        
        <View style={styles.details}>
          <Text style={[styles.name, { color: cardThemeColors.text }]}>{student.name}</Text>
          {student.rollNumber && (
            <Text style={[styles.rollNumber, { color: cardThemeColors.textLight || cardThemeColors.textExtraLight }]}>
              {student.registrationNumber ? `Reg No: ${student.registrationNumber}` : `Roll No: ${student.rollNumber}`}
            </Text>
          )}
        </View>
        
        {attendanceRecord && (
          <AttendanceStatusBadge status={attendanceRecord.status} />
        )}
      </TouchableOpacity>

      {showAttendanceControls && (
        <View style={[styles.attendanceControls, { borderTopColor: cardThemeColors.borderLight }]}>
          <TouchableOpacity
            style={[
              styles.attendanceButton,
              styles.presentButton,
              attendanceRecord?.status === "present" && styles.activeButton
            ]}
            onPress={() => handleMarkAttendance("present")}
          >
            <Text style={[styles.buttonText, { color: colors.statusPresent }]}>Present</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.attendanceButton,
              styles.lateButton,
              { borderLeftColor: cardThemeColors.borderLight, borderRightColor: cardThemeColors.borderLight },
              attendanceRecord?.status === "late" && styles.activeButton
            ]}
            onPress={() => handleMarkAttendance("late")}
          >
            <Text style={[styles.buttonText, { color: colors.statusLate }]}>Late</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.attendanceButton,
              styles.absentButton,
              attendanceRecord?.status === "absent" && styles.activeButton
            ]}
            onPress={() => handleMarkAttendance("absent")}
          >
            <Text style={[styles.buttonText, { color: colors.statusAbsent }]}>Absent</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: 0,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
  },
  details: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.semibold,
    marginBottom: spacing.xs / 2,
  },
  rollNumber: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
  },
  attendanceControls: {
    flexDirection: "row",
    borderTopWidth: 1,
  },
  attendanceButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  presentButton: {
    backgroundColor: colors.statusPresent + "20", // 20% opacity
  },
  lateButton: {
    backgroundColor: colors.statusLate + "20", // 20% opacity
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  absentButton: {
    backgroundColor: colors.statusAbsent + "20", // 20% opacity
  },
  activeButton: {
    opacity: 1,
  },
  buttonText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    fontWeight: fonts.weights.medium,
  },
});