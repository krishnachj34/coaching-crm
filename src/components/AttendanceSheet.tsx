"use client";

import React, { useState, useEffect, useTransition } from "react";
import styles from "../app/attendance/page.module.css";
import { getDailyAttendance, saveDailyAttendance } from "@/app/attendance/actions";

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

interface AttendanceSheetProps {
  initialDate: string;
  initialRecords: StudentAttendance[];
  batches: Batch[];
}

export default function AttendanceSheet({ initialDate, initialRecords, batches }: AttendanceSheetProps) {
  const [date, setDate] = useState(initialDate);
  const [records, setRecords] = useState<StudentAttendance[]>(initialRecords);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter states
  const [selectedBatchId, setSelectedBatchId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("attendance_filter_batch") || "";
    }
    return "";
  });
  const [filterDistributed, setFilterDistributed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("attendance_filter_distributed") === "true";
    }
    return false;
  });

  // Sync filters to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("attendance_filter_batch", selectedBatchId);
  }, [selectedBatchId]);

  useEffect(() => {
    sessionStorage.setItem("attendance_filter_distributed", filterDistributed ? "true" : "false");
  }, [filterDistributed]);

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

  // Apply filters client-side
  const filteredRecords = records.filter((rec) => {
    if (selectedBatchId && (!rec.batchIds || !rec.batchIds.includes(selectedBatchId))) {
      return false;
    }
    if (filterDistributed) {
      const numBatches = rec.batchIds ? rec.batchIds.length : 0;
      if (numBatches === 1) {
        return false;
      }
    }
    return true;
  });

  const presentCount = filteredRecords.filter((r) => r.status === "PRESENT").length;
  const absentCount = filteredRecords.filter((r) => r.status === "ABSENT").length;
  const lateCount = filteredRecords.filter((r) => r.status === "LATE").length;

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

        {/* Filters Group */}
        <div className={styles.filtersGroup} style={{ display: "flex", gap: "1.25rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label htmlFor="batch-select" style={{ fontSize: "0.8125rem", fontWeight: "700", color: "var(--foreground)" }}>
              Batch:
            </label>
            <select
              id="batch-select"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className={styles.dateInput}
              style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <input
              id="distributed-toggle"
              type="checkbox"
              checked={filterDistributed}
              onChange={(e) => setFilterDistributed(e.target.checked)}
              style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
            />
            <label htmlFor="distributed-toggle" style={{ fontSize: "0.8125rem", fontWeight: "700", color: "var(--foreground)", cursor: "pointer" }}>
              Distributed Students
            </label>
          </div>
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
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={3} className={styles.emptyCell}>
                  No students match the current filters.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => (
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
