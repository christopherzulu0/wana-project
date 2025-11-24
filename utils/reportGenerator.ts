import * as FileSystem from 'expo-file-system/legacy';

const API_BASE_URL = 'https://attendance-records-wana.vercel.app';

// Simple CSV to Excel converter (we'll use CSV format which Excel can open)
export const generateCSVReport = (data: any[], headers: string[], filename: string): string => {
  // Create CSV content
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes in values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
};

// Generate Overall Attendance Summary Report
export const generateOverallAttendanceReport = async (
  students: any[],
  classes: any[]
): Promise<string> => {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  
  const reportData: any[] = [];
  
  // Fetch attendance for all students
  for (const student of students) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${student.id}/attendance?month=${month}&year=${year}`);
      if (response.ok) {
        const data = await response.json();
        const attendance = data.attendance || [];
        
        const present = attendance.filter((r: any) => r.status === 'present').length;
        const late = attendance.filter((r: any) => r.status === 'late').length;
        const absent = attendance.filter((r: any) => r.status === 'absent').length;
        const total = attendance.length;
        const attendanceRate = total > 0 ? ((present + late) / total * 100).toFixed(2) : '0.00';
        
        reportData.push({
          'Student Name': student.name,
          'Registration Number': student.registrationNumber || 'N/A',
          'Email': student.email || 'N/A',
          'Present': present,
          'Late': late,
          'Absent': absent,
          'Total Records': total,
          'Attendance Rate (%)': attendanceRate,
        });
      }
    } catch (error) {
      console.error(`Error fetching attendance for student ${student.id}:`, error);
    }
  }
  
  const headers = ['Student Name', 'Registration Number', 'Email', 'Present', 'Late', 'Absent', 'Total Records', 'Attendance Rate (%)'];
  const csvContent = generateCSVReport(reportData, headers, 'overall-attendance-summary');
  
  return csvContent;
};

// Generate Class-wise Attendance Breakdown Report
export const generateClassWiseReport = async (
  classes: any[],
  students: any[]
): Promise<string> => {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  
  const reportData: any[] = [];
  
  for (const classItem of classes) {
    try {
      // Get students in this class
      const response = await fetch(`${API_BASE_URL}/api/classes/${classItem.id}`);
      if (response.ok) {
        const data = await response.json();
        const classStudents = data.students || [];
        
        let classPresent = 0;
        let classLate = 0;
        let classAbsent = 0;
        let classTotal = 0;
        
        // Fetch attendance for each student in the class
        for (const student of classStudents) {
          try {
            const attResponse = await fetch(`${API_BASE_URL}/api/students/${student.id}/attendance?month=${month}&year=${year}`);
            if (attResponse.ok) {
              const attData = await attResponse.json();
              const attendance = attData.attendance || [];
              
              const present = attendance.filter((r: any) => r.status === 'present').length;
              const late = attendance.filter((r: any) => r.status === 'late').length;
              const absent = attendance.filter((r: any) => r.status === 'absent').length;
              
              classPresent += present;
              classLate += late;
              classAbsent += absent;
              classTotal += attendance.length;
            }
          } catch (error) {
            console.error(`Error fetching attendance for student ${student.id}:`, error);
          }
        }
        
        const attendanceRate = classTotal > 0 ? (((classPresent + classLate) / classTotal) * 100).toFixed(2) : '0.00';
        
        reportData.push({
          'Class Name': classItem.name,
          'Section': classItem.section,
          'Subject': classItem.subject || 'N/A',
          'Total Students': classStudents.length,
          'Present': classPresent,
          'Late': classLate,
          'Absent': classAbsent,
          'Total Records': classTotal,
          'Attendance Rate (%)': attendanceRate,
          'Teacher': classItem.teacherName || 'Unassigned',
        });
      }
    } catch (error) {
      console.error(`Error fetching class ${classItem.id}:`, error);
    }
  }
  
  const headers = ['Class Name', 'Section', 'Subject', 'Total Students', 'Present', 'Late', 'Absent', 'Total Records', 'Attendance Rate (%)', 'Teacher'];
  const csvContent = generateCSVReport(reportData, headers, 'class-wise-attendance');
  
  return csvContent;
};

// Generate Teacher Activity Log Report
export const generateTeacherActivityReport = async (
  users: any[],
  classes: any[]
): Promise<string> => {
  const teachers = users.filter(u => u.role === 'teacher');
  const reportData: any[] = [];
  
  for (const teacher of teachers) {
    const teacherClasses = classes.filter(c => c.teacherId === teacher.id);
    const totalStudents = teacherClasses.reduce((sum, cls) => sum + (cls.totalStudents || 0), 0);
    
    reportData.push({
      'Teacher Name': teacher.name,
      'Email': teacher.email,
      'Classes Assigned': teacherClasses.length,
      'Total Students': totalStudents,
      'Status': 'Active',
    });
  }
  
  const headers = ['Teacher Name', 'Email', 'Classes Assigned', 'Total Students', 'Status'];
  const csvContent = generateCSVReport(reportData, headers, 'teacher-activity-log');
  
  return csvContent;
};

// Generate Absenteeism Trends Report
export const generateAbsenteeismTrendsReport = async (
  students: any[]
): Promise<string> => {
  const today = new Date();
  const reportData: any[] = [];
  
  // Get last 30 days of data
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const dateStr = date.toISOString().split('T')[0];
    
    let absentCount = 0;
    let totalRecords = 0;
    
    // Sample a subset of students for performance
    const sampleSize = Math.min(20, students.length);
    const sampleStudents = students.slice(0, sampleSize);
    
    for (const student of sampleStudents) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/students/${student.id}/attendance?month=${month}&year=${year}`);
        if (response.ok) {
          const data = await response.json();
          const attendance = data.attendance || [];
          const dayRecord = attendance.find((r: any) => r.date === dateStr);
          
          if (dayRecord) {
            totalRecords++;
            if (dayRecord.status === 'absent') {
              absentCount++;
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching attendance:`, error);
      }
    }
    
    const absenteeismRate = totalRecords > 0 ? ((absentCount / totalRecords) * 100).toFixed(2) : '0.00';
    
    reportData.push({
      'Date': dateStr,
      'Absent Count': absentCount,
      'Total Records': totalRecords,
      'Absenteeism Rate (%)': absenteeismRate,
    });
  }
  
  const headers = ['Date', 'Absent Count', 'Total Records', 'Absenteeism Rate (%)'];
  const csvContent = generateCSVReport(reportData, headers, 'absenteeism-trends');
  
  return csvContent;
};

// Save and share file
export const saveAndShareReport = async (csvContent: string, filename: string): Promise<string | null> => {
  try {
    // Create file path in document directory
    const fileUri = FileSystem.documentDirectory + `${filename}-${Date.now()}.csv`;
    
    // Write file content using legacy API
    await FileSystem.writeAsStringAsync(fileUri, csvContent);
    
    // Try to use sharing if available
    try {
      const Sharing = require('expo-sharing');
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Share ${filename}`,
        });
        return fileUri;
      }
    } catch (sharingError) {
      console.log('Sharing not available, file saved to:', fileUri);
    }
    
    // Return file URI so it can be opened/viewed
    console.log('File saved to:', fileUri);
    return fileUri;
  } catch (error) {
    console.error('Error saving/sharing report:', error);
    throw error;
  }
};

