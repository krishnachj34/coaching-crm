"use client";

import React, { useState } from "react";
import styles from "../app/students/page.module.css";
import Sidebar from "@/components/Sidebar";
import StudentTable from "@/components/StudentTable";
import StudentModal from "@/components/StudentModal";
import CourseModal from "@/components/CourseModal";
import { useRouter } from "next/navigation";

interface Course {
  id: string;
  title: string;
  description?: string | null;
  feeAmount: any;
}

interface Enrollment {
  course: Course;
}

interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  enrollments: Enrollment[];
  createdAt: Date;
}

interface StudentsDashboardClientProps {
  initialStudents: Student[];
  courses: Course[];
}

export default function StudentsDashboardClient({
  initialStudents,
  courses,
}: StudentsDashboardClientProps) {
  const [isRegOpen, setIsRegOpen] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className={styles.studentsContainer}>
      <Sidebar currentPhase={5} />

      <main className={styles.studentsMain}>
        <header className={styles.pageHeader}>
          <div className={styles.titleArea}>
            <h1>Student Management</h1>
            <p>Maintain courses, student details, and enrollments.</p>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={() => setIsCourseOpen(true)}
              className={styles.courseBtn}
            >
              ⚙ Manage Courses
            </button>
            <button onClick={() => setIsRegOpen(true)} className={styles.addStudentBtn}>
              + Register Student
            </button>
          </div>
        </header>

        <StudentTable initialStudents={initialStudents} />

        <StudentModal
          isOpen={isRegOpen}
          onClose={() => setIsRegOpen(false)}
          onSuccess={handleSuccess}
          courses={courses}
        />

        <CourseModal
          isOpen={isCourseOpen}
          onClose={() => setIsCourseOpen(false)}
          onSuccess={handleSuccess}
          courses={courses}
        />
      </main>
    </div>
  );
}
