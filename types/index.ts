export interface User {
  id: string
  name: string
  email: string
  password?: string // Password is optional for existing users when updating
  role: "teacher" | "admin" | "student"
  avatar?: string
}

export interface Student {
  id: string
  name: string
  email?: string
  registrationNumber?: string
  userId?: string
  userEmail?: string
  hasAccount: boolean
  password?: string // Store the generated password for admin reference
  enrolledClassesCount?: number
  createdAt: Date
  avatar?: string
  phone?: string
  // Legacy fields for backward compatibility
  rollNumber?: string
  class?: Class
  classId?: string
}

export interface Class {
  id: string
  name: string
  section: string
  subject: string
  teacherId: string
  teacherName?: string // Add teacher name for display
  totalStudents: number
  description?: string
  schedule?: string
  room?: string
}

export interface AttendanceRecord {
  id: string
  studentId: string
  classId: string
  date: string
  status: "present" | "absent" | "late"
  markedBy: string
  markedAt: string
}

export interface AttendanceStats {
  present: number
  absent: number
  late: number
  total: number
}

export interface MonthlyAttendance {
  month: string
  year: number
  stats: AttendanceStats
}
