"use client";

import React, { useState, useTransition } from "react";
import styles from "../app/attendance/page.module.css";
import { getDailyAttendance, saveDailyAttendance } from "@/app/attendance/actions";

interface StudentAttendance {
  studentId: string;
  studentName: string;
  studentPhone: string;
  status: string;
}

interface AttendanceSheetProps {
  initialDate: string;
  initialRecords: StudentAttendance[];
}

export default function AttendanceSheet({ initialDate, initialRecords }: AttendanceSheetProps) {
  const [date, setDate] = useState(initialDate);
  const [records, setRecords] = useState<StudentAttendance[]>(initialRecords);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDateChange = async (newDate: string) => {
    setDate(newDate);
    setSuccess(null);
    setError(null);
    startTransition(async () => {
      try {
        const loadedRecords = await getDailyAttendance(newDate);
        setRecords(loadedRecords);
      } catch (err: any) {
        setError(err.message || "Failed to load attendance sheet.");
      }
    });
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setRecords((prev) =>
      prev.map((rec) => (rec.studentId === studentId ? { ...rec, status } : rec))
    );
    setSuccess(null);
  };

  const handleSave = async () => {
    setSuccess(null);
    setError(null);
    startTransition(async () => {
      const payload = records.map((rec) => ({
        studentId: rec.studentId,
        status: rec.status,
      }));
      const res = await saveDailyAttendance(date, payload);
      if (res.success) {
        setSuccess("Attendance sheet saved successfully!");
      } else {
        setError(res.error || "Failed to save attendance.");
      }
    });
  };

  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;
  const lateCount = records.filter((r) => r.status === "LATE").length;

  return (
    <div className={styles.sheetWrapper}>
      <div className={styles.controlsRow}>
        <div className={styles.dateSelector}>
          <label htmlFor="attendance-date">Select Date:</label>
          <input
            id="attendance-date"
            type="date"
            disabled={isPending}
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className={styles.dateInput}
          />
        </div>

        <div className={styles.statsRow}>
          <div className={`${styles.miniStat} ${styles.statPresent}`}>
            <span>Present:</span> <strong>{presentCount}</strong>
          </div>
          <div className={`${styles.miniStat} ${styles.statAbsent}`}>
            <span>Absent:</span> <strong>{absentCount}</strong>
          </div>
          <div className={`${styles.miniStat} ${styles.statLate}`}>
            <span>Late:</span> <strong>{lateCount}</strong>
          </div>
        </div>
      </div>

      {success && <div className={styles.successAlert}>{success}</div>}
      {error && <div className={styles.errorAlert}>{error}</div>}

      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Phone</th>
              <th className={styles.actionsHeader}>Attendance Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={3} className={styles.emptyCell}>
                  No students enrolled yet. Register students to record attendance.
                </td>
              </tr>
            ) : (
              records.map((rec) => (
                <tr key={rec.studentId}>
                  <td className={styles.studentName}>{rec.studentName}</td>
                  <td>{rec.studentPhone}</td>
                  <td>
                    <div className={styles.toggleGroup}>
                      <button
                        disabled={isPending}
                        onClick={() => handleStatusChange(rec.studentId, "PRESENT")}
                        className={`${styles.toggleBtn} ${
                          rec.status === "PRESENT" ? styles.activePresent : ""
                        }`}
                      >
                        Present
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => handleStatusChange(rec.studentId, "ABSENT")}
                        className={`${styles.toggleBtn} ${
                          rec.status === "ABSENT" ? styles.activeAbsent : ""
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => handleStatusChange(rec.studentId, "LATE")}
                        className={`${styles.toggleBtn} ${
                          rec.status === "LATE" ? styles.activeLate : ""
                        }`}
                      >
                        Late
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {records.length > 0 && (
        <div className={styles.footerRow}>
          <button
            onClick={handleSave}
            disabled={isPending}
            className={styles.saveBtn}
          >
            {isPending ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      )}
    </div>
  );
}
