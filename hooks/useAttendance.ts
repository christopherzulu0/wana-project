import { useState } from "react";
import { AttendanceRecord, AttendanceStats, Student } from "../types";
import { 
  mockAttendanceRecords, 
  getAttendanceByDateAndClass,
  getTodayAttendanceStats,
  getMonthlyAttendanceStats
} from "../utils/mockData";
import { getToday } from "../utils/dateUtils";

export const useAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);

  const getClassAttendanceByDate = (classId: string, date: string = getToday()) => {
    return getAttendanceByDateAndClass(date, classId);
  };

  const getAttendanceStats = (classId: string) => {
    return getTodayAttendanceStats(classId);
  };

  const getMonthlyStats = (classId: string) => {
    return getMonthlyAttendanceStats(classId);
  };

  const markAttendance = (
    student: Student,
    status: "present" | "absent" | "late",
    date: string = getToday(),
    teacherId: string
  ) => {
    // Check if there's already a record for this student on this date
    const existingRecordIndex = attendanceRecords.findIndex(
      record => record.studentId === student.id && record.date === date
    );

    if (existingRecordIndex !== -1) {
      // Update existing record
      const updatedRecords = [...attendanceRecords];
      updatedRecords[existingRecordIndex] = {
        ...updatedRecords[existingRecordIndex],
        status,
        markedBy: teacherId,
        markedAt: new Date().toISOString(),
      };
      setAttendanceRecords(updatedRecords);
    } else {
      // Create new record
      const newRecord: AttendanceRecord = {
        id: `${student.id}-${date}`,
        studentId: student.id,
        classId: student.classId,
        date,
        status,
        markedBy: teacherId,
        markedAt: new Date().toISOString(),
      };
      setAttendanceRecords([...attendanceRecords, newRecord]);
    }
  };

  const getStudentAttendance = (studentId: string, date: string = getToday()) => {
    return attendanceRecords.find(
      record => record.studentId === studentId && record.date === date
    );
  };

  return {
    attendanceRecords,
    getClassAttendanceByDate,
    getAttendanceStats,
    getMonthlyStats,
    markAttendance,
    getStudentAttendance,
  };
};