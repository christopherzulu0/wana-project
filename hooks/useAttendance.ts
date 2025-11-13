import { useState } from "react";
import { AttendanceRecord, AttendanceStats, Student } from "../types";
import { 
  mockAttendanceRecords, 
  getAttendanceByDateAndClass,
  getTodayAttendanceStats,
  getMonthlyAttendanceStats
} from "../utils/mockData";
import { getToday } from "../utils/dateUtils";

const API_BASE_URL = 'http://10.156.181.203:3000';

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
    teacherId: string,
    method: "manual" | "face_recognition" = "manual"
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
        method,
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
        method,
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

  const markAttendanceByFace = async (
    student: Student,
    classId: string,
    faceEncoding: string,
    date: string = getToday()
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance/face-recognition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          studentId: parseInt(student.id), 
          classId: parseInt(classId), 
          faceEncoding 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state with the new attendance record
        const newRecord: AttendanceRecord = {
          id: `${student.id}-${date}`,
          studentId: student.id,
          classId: classId,
          date,
          status: 'present',
          method: 'face_recognition',
          markedBy: student.id, // Student marks their own attendance
          markedAt: new Date().toISOString(),
        };
        
        // Check if record already exists and update or add
        const existingRecordIndex = attendanceRecords.findIndex(
          record => record.studentId === student.id && record.date === date && record.classId === classId
        );

        if (existingRecordIndex !== -1) {
          const updatedRecords = [...attendanceRecords];
          updatedRecords[existingRecordIndex] = newRecord;
          setAttendanceRecords(updatedRecords);
        } else {
          setAttendanceRecords([...attendanceRecords, newRecord]);
        }
        
        return { success: true, confidence: data.confidence, message: data.message };
      } else {
        return { success: false, message: data.error || 'Face recognition failed' };
      }
    } catch (err) {
      console.error('Error marking attendance by face:', err);
      return { success: false, message: 'Network error occurred. Please try again.' };
    }
  };

  return {
    attendanceRecords,
    getClassAttendanceByDate,
    getAttendanceStats,
    getMonthlyStats,
    markAttendance,
    markAttendanceByFace,
    getStudentAttendance,
  };
};