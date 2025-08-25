import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

const API_BASE_URL =  'https://attendance-records-wana.vercel.app'

interface Class {
  id: string
  name: string
  section: string
  subject: string
  description: string
  schedule: string
  room: string
  teacherId: string
  teacherName: string
  enrolledAt?: string
  createdAt: string
}

interface EnrollmentResponse {
  message: string
  enrollment?: {
    id: number
    classId: string
    studentId: string
    enrolledAt: string
    className: string
    studentName: string
  }
}

export function useStudentEnrollment() {
  const { user } = useAuth()
  const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([])
  const [availableClasses, setAvailableClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch student's enrolled classes
  const fetchEnrolledClasses = async () => {
    if (!user?.id) return
    
    // Check if user has student role
    if (user.role !== 'student') {
      setError('Access denied. Only students can view enrolled classes.')
      setEnrolledClasses([])
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      // First, get the student record associated with this user
      const studentResponse = await fetch(`${API_BASE_URL}/api/students/by-user/${user.id}`)
      
      if (!studentResponse.ok) {
        console.error('Student record not found for user:', user.id)
        setError('No student record found. Please contact an administrator to create your student profile.')
        setEnrolledClasses([])
        return
      }
      
      const studentData = await studentResponse.json()
      const studentId = studentData.student?.id
      
      if (!studentId) {
        console.error('Student ID not found')
        setEnrolledClasses([])
        return
      }
      
      const response = await fetch(`${API_BASE_URL}/api/students/${studentId}/classes`)
      const data = await response.json()
      
      if (response.ok) {
        setEnrolledClasses(data.classes || [])
      } else {
        setError(data.error || 'Failed to fetch enrolled classes')
      }
    } catch (err) {
      console.error('Error fetching enrolled classes:', err)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Fetch all available classes
  const fetchAvailableClasses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_BASE_URL}/api/classes`)
      const data = await response.json()
      
      if (response.ok) {
        setAvailableClasses(data.classes || [])
      } else {
        setError(data.error || 'Failed to fetch available classes')
      }
    } catch (err) {
      console.error('Error fetching available classes:', err)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Enroll in a class
  const enrollInClass = async (classId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated')
      return false
    }
    
    // Check if user has student role
    if (user.role !== 'student') {
      setError('Access denied. Only students can enroll in classes.')
      return false
    }
    
    try {
      setLoading(true)
      setError(null)
      
      // First, get the student record associated with this user
      const studentResponse = await fetch(`${API_BASE_URL}/api/students/by-user/${user.id}`)
      
      if (!studentResponse.ok) {
        const errorData = await studentResponse.json().catch(() => ({}))
        console.error('Student record not found for user:', user.id, errorData)
        setError('No student record found. Please contact an administrator to create your student profile.')
        return false
      }
      
      const studentData = await studentResponse.json()
      const studentId = studentData.student?.id
      
      if (!studentId) {
        setError('Student ID not found. Please contact an administrator.')
        return false
      }
      
      console.log('Enrolling student:', studentId, 'in class:', classId)
      
      const response = await fetch(`${API_BASE_URL}/api/classes/${classId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId: studentId }),
      })
      
      const data: EnrollmentResponse = await response.json()
      console.log('Enrollment response:', response.status, data)
      
      if (response.ok) {
        // Refresh enrolled classes after successful enrollment
        await fetchEnrolledClasses()
        return true
      } else {
        console.error('Enrollment failed:', data)
        setError(data.message || data.error || 'Failed to enroll in class')
        return false
      }
    } catch (err) {
      console.error('Error enrolling in class:', err)
      setError('Network error occurred')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Unenroll from a class
  const unenrollFromClass = async (classId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated')
      return false
    }
    
    // Check if user has student role
    if (user.role !== 'student') {
      setError('Access denied. Only students can unenroll from classes.')
      return false
    }
    
    try {
      setLoading(true)
      setError(null)
      
      // First, get the student record associated with this user
      const studentResponse = await fetch(`${API_BASE_URL}/api/students/by-user/${user.id}`)
      
      if (!studentResponse.ok) {
        const errorData = await studentResponse.json().catch(() => ({}))
        console.error('Student record not found for user:', user.id, errorData)
        setError('No student record found. Please contact an administrator to create your student profile.')
        return false
      }
      
      const studentData = await studentResponse.json()
      const studentId = studentData.student?.id
      
      if (!studentId) {
        setError('Student ID not found. Please contact an administrator.')
        return false
      }
      
      const response = await fetch(`${API_BASE_URL}/api/classes/${classId}/unenroll`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId: studentId }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Refresh enrolled classes after successful unenrollment
        await fetchEnrolledClasses()
        return true
      } else {
        setError(data.error || 'Failed to unenroll from class')
        return false
      }
    } catch (err) {
      console.error('Error unenrolling from class:', err)
      setError('Network error occurred')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Check if student is enrolled in a specific class
  const isEnrolledInClass = (classId: string): boolean => {
    return enrolledClasses.some(cls => cls.id === classId)
  }

  // Get classes available for enrollment (not already enrolled)
  const getAvailableForEnrollment = (): Class[] => {
    const enrolledClassIds = enrolledClasses.map(cls => cls.id)
    return availableClasses.filter(cls => !enrolledClassIds.includes(cls.id))
  }

  useEffect(() => {
    if (user?.id) {
      fetchEnrolledClasses()
      fetchAvailableClasses()
    }
  }, [user?.id])

  return {
    enrolledClasses,
    availableClasses,
    loading,
    error,
    enrollInClass,
    unenrollFromClass,
    isEnrolledInClass,
    getAvailableForEnrollment,
    fetchEnrolledClasses,
    fetchAvailableClasses,
  }
}