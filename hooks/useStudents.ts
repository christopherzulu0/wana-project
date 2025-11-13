import { useState, useEffect } from "react";
import { Student } from "../types";

const API_BASE_URL = 'http://10.156.181.203:3000';

export interface CreateStudentData {
  name: string;
  email?: string;
  registrationNumber?: string;
  createAccount?: boolean;
  password?: string;
  generatedPassword?: string;
}

export interface UpdateStudentData {
  name: string;
  email?: string;
  registrationNumber?: string;
  createAccount?: boolean;
  password?: string;
  generatedPassword?: string;
}

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/students`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const getAllStudents = () => {
    return students;
  };

  const getStudentsByClassId = (classId: string) => {
    // Filter students from the existing state based on classId
    return students.filter(student => student.classId === classId);
  };

  const fetchStudentsByClassId = async (classId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/classes/${classId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch class students');
      }
      
      const classData = await response.json();
      return classData.students || [];
    } catch (err) {
      console.error('Error fetching students by class:', err);
      return [];
    }
  };

  const getStudent = (studentId: string) => {
    return students.find(student => student.id === studentId);
  };

  const addStudent = async (newStudent: CreateStudentData): Promise<{ student: Student; generatedPassword?: string } | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStudent),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create student');
      }
      
      const createdStudent = await response.json();
      setStudents(prev => [createdStudent, ...prev]);
      
      return {
        student: createdStudent,
        generatedPassword: newStudent.generatedPassword
      };
    } catch (err) {
      console.error('Error creating student:', err);
      setError(err instanceof Error ? err.message : 'Failed to create student');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateStudent = async (studentId: string, updatedData: UpdateStudentData): Promise<Student | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${studentId}`, {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(updatedData),
       });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update student');
      }
      
      const updatedStudent = await response.json();
      setStudents(prev => prev.map(student => 
        student.id === studentId ? updatedStudent : student
      ));
      return updatedStudent;
    } catch (err) {
      console.error('Error updating student:', err);
      setError(err instanceof Error ? err.message : 'Failed to update student');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (studentId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${studentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete student');
      }
      
      setStudents(prev => prev.filter(student => student.id !== studentId));
      return true;
    } catch (err) {
      console.error('Error deleting student:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete student');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return {
    students,
    loading,
    error,
    getAllStudents,
    getStudentsByClassId,
    fetchStudentsByClassId,
    getStudent,
    addStudent,
    updateStudent,
    deleteStudent,
    fetchStudents,
  };
};