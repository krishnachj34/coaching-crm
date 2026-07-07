"use client";

import React from "react";
import styles from "../app/attendance/page.module.css";
import Sidebar from "@/components/Sidebar";
import AttendanceSheet from "@/components/AttendanceSheet";

interface StudentAttendance {
  studentId: string;
  studentName: string;
  studentPhone: string;
  status: string;
  batchIds: string[];
}

interface Batch {
  id: string;
  name: string;
}

interface AttendanceDashboardClientProps {
  initialDate: string;
  initialRecords: StudentAttendance[];
  batches: Batch[];
}

export default function AttendanceDashboardClient({
  initialDate,
  initialRecords,
  batches,
}: AttendanceDashboardClientProps) {
  return (
    <div className={styles.attendanceContainer}>
      <Sidebar currentPhase={11} />

      <main className={styles.attendanceMain}>
        <header className={styles.pageHeader}>
          <div className={styles.titleArea}>
            <h1>Attendance Tracker</h1>
            <p>Monitor daily student presence, log class attendances, and compile records.</p>
          </div>
        </header>

        <AttendanceSheet
          initialDate={initialDate}
          initialRecords={initialRecords}
          batches={batches}
        />
      </main>
    </div>
  );
}
