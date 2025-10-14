import { useState } from 'react';
import { Alert } from 'react-native';

const API_BASE_URL = 'http://10.59.131.203:3000';

interface EnrollmentResponse {
  success?: boolean;
  message?: string;
  enrollment?: any;
  error?: string;
}

export const useClassEnrollment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrollStudent = async (classId: string, studentId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/classes/${classId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });

      const data: EnrollmentResponse = await response.json();

      if (response.ok) {
        return true;
      } else {
        setError(data.error || 'Failed to enroll student');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMessage);
      console.error('Error enrolling student:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unenrollStudent = async (classId: string, studentId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/classes/${classId}/unenroll`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });

      const data: EnrollmentResponse = await response.json();

      if (response.ok) {
        return true;
      } else {
        setError(data.error || 'Failed to unenroll student');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMessage);
      console.error('Error unenrolling student:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getEnrolledStudents = async (classId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/classes/${classId}`);
      const data = await response.json();

      if (response.ok) {
        // This would need to be implemented in the backend to return enrolled students
        // For now, we'll return an empty array
        return [];
      } else {
        setError(data.error || 'Failed to fetch enrolled students');
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMessage);
      console.error('Error fetching enrolled students:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    enrollStudent,
    unenrollStudent,
    getEnrolledStudents,
    loading,
    error,
  };
};