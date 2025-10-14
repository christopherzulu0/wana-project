import { useState } from 'react';
import { Alert } from 'react-native';

// Hardcoded to local backend - change this when deploying
const API_URL = 'http://10.59.131.203:3000';

export function useFaceEnrollment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrollFace = async (studentId: string | number, base64Image: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      console.log('Enrolling face for student:', studentId);
      console.log('API URL:', API_URL);
      console.log('Full URL:', `${API_URL}/api/students/${studentId}/enroll-face`);
      console.log('Sending image to backend...');
      console.log('Image data length:', base64Image?.length || 0);
      console.log('Image starts with:', base64Image?.substring(0, 50));

      const response = await fetch(`${API_URL}/api/students/${studentId}/enroll-face`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64Image }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll face');
      }

      console.log('Face enrolled successfully:', data);
      Alert.alert(
        'Success!',
        `Face enrollment completed!\nConfidence: ${Math.round((data.confidence || 0.9) * 100)}%`
      );

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Face enrollment error:', errorMessage);
      setError(errorMessage);
      Alert.alert('Enrollment Failed', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getFaceStatus = async (studentId: string | number): Promise<{ enrolled: boolean }> => {
    try {
      const response = await fetch(`${API_URL}/api/students/${studentId}/face-status`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get face status');
      }

      return { enrolled: data.student?.faceEnrolled || false };
    } catch (err) {
      console.error('Error getting face status:', err);
      return { enrolled: false };
    }
  };

  const verifyFaceAndMarkAttendance = async (
    studentId: string | number,
    classId: string | number,
    base64Image: string
  ): Promise<{ success: boolean; similarity?: number; message?: string }> => {
    try {
      setLoading(true);
      setError(null);

      console.log('Verifying face and marking attendance...');
      console.log('Student:', studentId, 'Class:', classId);
      console.log('base64Image length:', base64Image?.length);
      
      const requestBody = {
        studentId: parseInt(studentId.toString()),
        classId: parseInt(classId.toString()),
        base64Image: base64Image  // Explicit assignment
      };
      
      console.log('🚀 REQUEST BODY BEING SENT:');
      console.log('  Keys:', Object.keys(requestBody));
      console.log('  studentId:', requestBody.studentId);
      console.log('  classId:', requestBody.classId);
      console.log('  base64Image exists:', !!requestBody.base64Image);
      console.log('  base64Image length:', requestBody.base64Image?.length || 0);
      console.log('Sending to:', `${API_URL}/api/attendance/face-recognition`);

      const response = await fetch(`${API_URL}/api/attendance/face-recognition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Face verification failed';
        console.log('Verification failed:', errorMsg);
        
        if (data.similarity !== undefined) {
          Alert.alert(
            'Face Not Recognized',
            `${errorMsg}\n\nSimilarity: ${data.similarity}%\nRequired: ${data.threshold}%`
          );
        } else {
          Alert.alert('Verification Failed', errorMsg);
        }
        
        return {
          success: false,
          similarity: data.similarity,
          message: errorMsg
        };
      }

      console.log('Face verified successfully!', data);
      
      return {
        success: true,
        similarity: data.similarity,
        message: data.message
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Face verification error:', errorMessage);
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    enrollFace,
    getFaceStatus,
    verifyFaceAndMarkAttendance,
    loading,
    error,
  };
}
