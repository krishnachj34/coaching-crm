"use client";

import React, { useState } from "react";
import styles from "../app/students/page.module.css";
import Sidebar from "@/components/Sidebar";
import StudentTable from "@/components/StudentTable";
import StudentModal from "@/components/StudentModal";
import InstituteSwitcher from "@/components/InstituteSwitcher";
import { useRouter } from "next/navigation";

interface Batch {
  id: string;
  name: string;
  timing: string;
  feeAmount: any;
  subCategory?: any;
}

interface Enrollment {
  batch: Batch;
}

interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  rollNo?: string | null;
  courseEndDate?: Date | string | null;
  installments?: string | null;
  batchEnrollments: Enrollment[];
  payments: any[];
  createdAt: Date;
}

interface StudentsDashboardClientProps {
  initialStudents: Student[];
  batches: Batch[];
}

export default function StudentsDashboardClient({
  initialStudents,
  batches,
}: StudentsDashboardClientProps) {
  const [isRegOpen, setIsRegOpen] = useState(false);
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
            <p>Maintain student details, batch enrollments, and study abroad applicant records.</p>
          </div>
          <div className={styles.headerActions} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <InstituteSwitcher />
            <button onClick={() => setIsRegOpen(true)} className={styles.addStudentBtn}>
              + Register Student
            </button>
          </div>
        </header>

        <StudentTable initialStudents={initialStudents} batches={batches} />

        <StudentModal
          isOpen={isRegOpen}
          onClose={() => setIsRegOpen(false)}
          onSuccess={handleSuccess}
          batches={batches}
        />
      </main>
    </div>
  );
}
