"use client"

import { useState, useEffect } from "react"
import type { Class } from "../types"

const API_BASE_URL = 'https://attendance-records-wana.vercel.app';

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export const useClasses = () => {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all classes from API
  const fetchClasses = async (): Promise<ApiResponse<Class[]>> => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/classes`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch classes')
      }
      
      setClasses(data.classes)
      return { success: true, data: data.classes }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Load classes on component mount
  useEffect(() => {
    fetchClasses()
  }, [])

  const getAllClasses = () => {
    return classes
  }

  const getClassesForTeacher = (teacherId: string) => {
    console.log('useClasses - getClassesForTeacher called with teacherId:', teacherId, 'type:', typeof teacherId);
    console.log('useClasses - All classes:', classes);
    console.log('useClasses - Checking each class teacherId:');
    classes.forEach(cls => {
      console.log(`  Class "${cls.name}" has teacherId: ${cls.teacherId} (type: ${typeof cls.teacherId}), matches: ${cls.teacherId === teacherId}`);
    });
    // Handle both string and number comparisons for teacherId
    const filteredClasses = classes.filter(cls => {
      const classTeacherId = cls.teacherId?.toString();
      const userTeacherId = teacherId?.toString();
      return classTeacherId === userTeacherId;
    });
    console.log('useClasses - Filtered teacher classes:', filteredClasses);
    return filteredClasses;
  }

  const getClass = (classId: string) => {
    return classes.find((cls) => cls.id === classId)
  }

  const addClass = async (newClass: Omit<Class, "id" | "totalStudents" | "teacherName">): Promise<ApiResponse<Class>> => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClass),
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create class')
      }
      
      setClasses((prevClasses) => [...prevClasses, data.class])
      return { success: true, data: data.class }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const updateClass = async (updatedClass: Class): Promise<ApiResponse<Class>> => {
    try {
      console.log('useClasses - updateClass called with:', updatedClass)
      console.log('useClasses - Room value:', updatedClass.room)
      setLoading(true)
      setError(null)
      const requestBody = {
        name: updatedClass.name,
        description: updatedClass.description,
        teacherId: updatedClass.teacherId,
        room : updatedClass.room,
        section: updatedClass.section,
        subject: updatedClass.subject,
        schedule: updatedClass.schedule
      }
      console.log('useClasses - Request body:', requestBody)
      const response = await fetch(`${API_BASE_URL}/api/classes/${updatedClass.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update class')
      }
      
      setClasses((prevClasses) => prevClasses.map((cls) => (cls.id === data.class.id ? data.class : cls)))
      return { success: true, data: data.class }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const deleteClass = async (classId: string): Promise<ApiResponse<void>> => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/classes/${classId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete class')
      }
      
      setClasses((prevClasses) => prevClasses.filter((cls) => cls.id !== classId))
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return {
    classes,
    loading,
    error,
    getAllClasses,
    getClassesForTeacher,
    getClass,
    addClass,
    updateClass,
    deleteClass,
    refetch: fetchClasses,
  }
}
