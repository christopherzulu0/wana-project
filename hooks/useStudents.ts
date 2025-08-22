import { useState } from "react";
import { Student } from "../types";
import { mockStudents, getStudentsByClass } from "../utils/mockData";

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>(mockStudents);

  const getAllStudents = () => {
    return students;
  };

  const getStudentsByClassId = (classId: string) => {
    return getStudentsByClass(classId);
  };

  const getStudent = (studentId: string) => {
    return students.find(student => student.id === studentId);
  };

  const addStudent = (newStudent: Omit<Student, "id">) => {
    const studentWithId = {
      ...newStudent,
      id: (students.length + 1).toString(),
    };
    setStudents([...students, studentWithId]);
    return studentWithId;
  };

  const updateStudent = (updatedStudent: Student) => {
    const updatedStudents = students.map(student => 
      student.id === updatedStudent.id ? updatedStudent : student
    );
    setStudents(updatedStudents);
    return updatedStudent;
  };

  const deleteStudent = (studentId: string) => {
    setStudents(students.filter(student => student.id !== studentId));
  };

  return {
    students,
    getAllStudents,
    getStudentsByClassId,
    getStudent,
    addStudent,
    updateStudent,
    deleteStudent,
  };
};