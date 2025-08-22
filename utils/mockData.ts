import type { User, Class, Student, AttendanceRecord, AttendanceStats, MonthlyAttendance } from "../types"

// Mock user data (now mutable)
export let mockUsers: User[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    role: "teacher",
    avatar:
      "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=40",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    role: "admin",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=40",
  },
  {
    id: "3",
    name: "Alice Brown", // Added a student user
    email: "alice.brown@example.com",
    role: "student",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=40",
  },
  {
    id: "4",
    name: "Michael Davis",
    email: "michael.davis@example.com",
    role: "teacher",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=40",
  },
  {
    id: "5",
    name: "Emily Wilson",
    email: "emily.wilson@example.com",
    role: "teacher",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=40",
  },
]

// Helper functions for mock user CRUD
export const addMockUser = (newUser: Omit<User, "id">): User => {
  const newId = (mockUsers.length > 0 ? Math.max(...mockUsers.map((u) => Number.parseInt(u.id))) + 1 : 1).toString()
  const userWithId: User = { ...newUser, id: newId }
  mockUsers.push(userWithId)
  return userWithId
}

export const updateMockUser = (updatedUser: User): User => {
  mockUsers = mockUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
  return updatedUser
}

export const deleteMockUser = (userId: string) => {
  mockUsers = mockUsers.filter((user) => user.id !== userId)
}

// Mock class data (now mutable)
export let mockClasses: Class[] = [
  {
    id: "1",
    name: "Computer Science",
    section: "A",
    subject: "Programming",
    teacherId: "1",
    teacherName: "John Smith",
    totalStudents: 25,
    description: "Introduction to programming concepts and algorithms",
    schedule: "Mon, Wed, Fri - 9:00 AM",
    room: "Room 101",
  },
  {
    id: "2",
    name: "Mathematics",
    section: "B",
    subject: "Calculus",
    teacherId: "1",
    teacherName: "John Smith",
    totalStudents: 30,
    description: "Advanced calculus and mathematical analysis",
    schedule: "Tue, Thu - 10:30 AM",
    room: "Room 205",
  },
  {
    id: "3",
    name: "Physics",
    section: "A",
    subject: "Mechanics",
    teacherId: "4",
    teacherName: "Michael Davis",
    totalStudents: 28,
    description: "Classical mechanics and thermodynamics",
    schedule: "Mon, Wed - 2:00 PM",
    room: "Lab 301",
  },
  {
    id: "4",
    name: "English",
    section: "C",
    subject: "Literature",
    teacherId: "5",
    teacherName: "Emily Wilson",
    totalStudents: 32,
    description: "Modern literature and creative writing",
    schedule: "Tue, Thu, Fri - 11:00 AM",
    room: "Room 150",
  },
]

// Helper functions for mock class CRUD
export const addMockClass = (newClass: Omit<Class, "id">): Class => {
  const newId = (mockClasses.length > 0 ? Math.max(...mockClasses.map((c) => Number.parseInt(c.id))) + 1 : 1).toString()
  const teacher = mockUsers.find((user) => user.id === newClass.teacherId)
  const classWithId: Class = {
    ...newClass,
    id: newId,
    teacherName: teacher?.name || "Unknown Teacher",
    totalStudents: 0, // Start with 0 students
  }
  mockClasses.push(classWithId)
  return classWithId
}

export const updateMockClass = (updatedClass: Class): Class => {
  const teacher = mockUsers.find((user) => user.id === updatedClass.teacherId)
  const classWithTeacherName = {
    ...updatedClass,
    teacherName: teacher?.name || "Unknown Teacher",
  }
  mockClasses = mockClasses.map((cls) => (cls.id === updatedClass.id ? classWithTeacherName : cls))
  return classWithTeacherName
}

export const deleteMockClass = (classId: string) => {
  mockClasses = mockClasses.filter((cls) => cls.id !== classId)
}

// Get teachers only
export const getTeachers = (): User[] => {
  return mockUsers.filter((user) => user.role === "teacher")
}

// Mock student data
export const mockStudents: Student[] = [
  {
    id: "1",
    name: "Alice Brown",
    rollNumber: "CS001",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=40",
    email: "alice.brown@example.com",
    phone: "123-456-7890",
    class: mockClasses[0],
    classId: "1",
  },
  {
    id: "2",
    name: "Bob Wilson",
    rollNumber: "CS002",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=40",
    email: "bob.wilson@example.com",
    phone: "123-456-7891",
    class: mockClasses[0],
    classId: "1",
  },
  {
    id: "3",
    name: "Charlie Davis",
    rollNumber: "CS003",
    avatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=40",
    email: "charlie.davis@example.com",
    phone: "123-456-7892",
    class: mockClasses[0],
    classId: "1",
  },
  {
    id: "4",
    name: "Diana Evans",
    rollNumber: "CS004",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=40",
    email: "diana.evans@example.com",
    phone: "123-456-7893",
    class: mockClasses[0],
    classId: "1",
  },
  {
    id: "5",
    name: "Ethan Foster",
    rollNumber: "CS005",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=40",
    email: "ethan.foster@example.com",
    phone: "123-456-7894",
    class: mockClasses[0],
    classId: "1",
  },
  {
    id: "6",
    name: "Fiona Green",
    rollNumber: "CS006",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=40",
    email: "fiona.green@example.com",
    phone: "123-456-7895",
    class: mockClasses[0],
    classId: "1",
  },
  {
    id: "7",
    name: "George Harris",
    rollNumber: "CS007",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=fit=crop&w=100&q=40",
    email: "george.harris@example.com",
    phone: "123-456-7896",
    class: mockClasses[0],
    classId: "1",
  },
  {
    id: "8",
    name: "Hannah Irwin",
    rollNumber: "CS008",
    avatar:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=40",
    email: "hannah.irwin@example.com",
    phone: "123-456-7897",
    class: mockClasses[0],
    classId: "1",
  },
  {
    id: "9",
    name: "Ian Jackson",
    rollNumber: "MT001",
    avatar:
      "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=40",
    email: "ian.jackson@example.com",
    phone: "123-456-7898",
    class: mockClasses[1],
    classId: "2",
  },
  {
    id: "10",
    name: "Julia King",
    rollNumber: "MT002",
    avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=40",
    email: "julia.king@example.com",
    phone: "123-456-7899",
    class: mockClasses[1],
    classId: "2",
  },
]

// Generate mock attendance records for the past 30 days
export const generateMockAttendanceRecords = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = []
  const statuses: ("present" | "absent" | "late")[] = ["present", "absent", "late"]

  // Get current date
  const today = new Date()

  // Generate records for the past 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateString = date.toISOString().split("T")[0]

    // Generate records for each student
    mockStudents.forEach((student) => {
      // Randomly assign status with higher probability for present
      const randomIndex = Math.floor(Math.random() * 10)
      const status = randomIndex < 7 ? "present" : randomIndex < 9 ? "late" : "absent"

      records.push({
        id: `${student.id}-${dateString}`,
        studentId: student.id,
        classId: student.classId,
        date: dateString,
        status: status,
        markedBy: "1", // Teacher ID
        markedAt: new Date(date).toISOString(),
      })
    })
  }

  return records
}

export const mockAttendanceRecords = generateMockAttendanceRecords()

// Generate attendance stats for today
export const getTodayAttendanceStats = (classId: string): AttendanceStats => {
  const today = new Date().toISOString().split("T")[0]
  const todayRecords = mockAttendanceRecords.filter((record) => record.date === today && record.classId === classId)

  const present = todayRecords.filter((record) => record.status === "present").length
  const absent = todayRecords.filter((record) => record.status === "absent").length
  const late = todayRecords.filter((record) => record.status === "late").length
  const total = todayRecords.length

  return { present, absent, late, total }
}

// Generate monthly attendance stats
export const getMonthlyAttendanceStats = (classId: string): MonthlyAttendance[] => {
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
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyStats: MonthlyAttendance[] = []

  // Generate stats for the current month and the previous 2 months
  for (let i = 0; i < 3; i++) {
    const monthIndex = (currentMonth - i + 12) % 12
    const year = monthIndex > currentMonth ? currentYear - 1 : currentYear

    // Filter records for this month and class
    const monthRecords = mockAttendanceRecords.filter((record) => {
      const recordDate = new Date(record.date)
      return recordDate.getMonth() === monthIndex && recordDate.getFullYear() === year && record.classId === classId
    })

    const present = monthRecords.filter((record) => record.status === "present").length
    const absent = monthRecords.filter((record) => record.status === "absent").length
    const late = monthRecords.filter((record) => record.status === "late").length
    const total = monthRecords.length

    monthlyStats.push({
      month: months[monthIndex],
      year,
      stats: { present, absent, late, total },
    })
  }

  return monthlyStats
}

// Get students by class ID
export const getStudentsByClass = (classId: string): Student[] => {
  return mockStudents.filter((student) => student.classId === classId)
}

// Get class by ID
export const getClassById = (classId: string): Class | undefined => {
  return mockClasses.find((cls) => cls.id === classId)
}

// Get attendance records for a specific date and class
export const getAttendanceByDateAndClass = (date: string, classId: string): AttendanceRecord[] => {
  return mockAttendanceRecords.filter((record) => record.date === date && record.classId === classId)
}

// Get student attendance history
export const getStudentAttendanceHistory = (studentId: string): AttendanceRecord[] => {
  return mockAttendanceRecords.filter((record) => record.studentId === studentId)
}

// Additional helper functions for student attendance history by month/year
export const getStudentAttendanceHistoryByMonthAndYear = (
  studentId: string,
  month: number,
  year: number,
): AttendanceRecord[] => {
  return mockAttendanceRecords.filter((record) => {
    const recordDate = new Date(record.date)
    return record.studentId === studentId && recordDate.getMonth() === month && recordDate.getFullYear() === year
  })
}

export const getMonthlyAttendanceStatsForStudent = (
  studentId: string,
  month: number,
  year: number,
): AttendanceStats => {
  const monthlyRecords = getStudentAttendanceHistoryByMonthAndYear(studentId, month, year)

  const present = monthlyRecords.filter((record) => record.status === "present").length
  const absent = monthlyRecords.filter((record) => record.status === "absent").length
  const late = monthlyRecords.filter((record) => record.status === "late").length
  const total = monthlyRecords.length

  return { present, absent, late, total }
}
