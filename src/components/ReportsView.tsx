"use client";

import React from "react";
import styles from "../app/reports/page.module.css";

interface LeadsFunnel {
  totalLeads: number;
  enrolledLeads: number;
  lostLeads: number;
  conversionRate: number;
}

interface AttendanceStats {
  totalAttendance: number;
  presentAttendance: number;
  lateAttendance: number;
  absentAttendance: number;
  attendanceRate: number;
}

interface ReportsViewProps {
  data: {
    leadsFunnel: LeadsFunnel;
    attendance: AttendanceStats;
    totalStudents: number;
  };
}

export default function ReportsView({ data }: ReportsViewProps) {
  const { leadsFunnel, attendance, totalStudents } = data;

  return (
    <div className={styles.reportsWrapper}>
      {/* Metrics Row */}
      <section className={styles.metricsGrid}>
        {/* Leads Conversion */}
        <div className={styles.reportCard}>
          <div className={styles.cardHeader}>
            <h3>Lead Conversion</h3>
            <span className={styles.rateValue}>{leadsFunnel.conversionRate.toFixed(1)}%</span>
          </div>
          <div className={styles.progressBarWrapper}>
            <div
              className={`${styles.progressBar} ${styles.progressLeads}`}
              style={{ width: `${Math.min(leadsFunnel.conversionRate, 100)}%` }}
            />
          </div>
          <div className={styles.statsDetails}>
            <div>
              <span>Total Leads:</span> <strong>{leadsFunnel.totalLeads}</strong>
            </div>
            <div>
              <span>Converted:</span> <strong>{leadsFunnel.enrolledLeads}</strong>
            </div>
            <div>
              <span>Lost:</span> <strong>{leadsFunnel.lostLeads}</strong>
            </div>
          </div>
        </div>

        {/* Student Attendance */}
        <div className={styles.reportCard}>
          <div className={styles.cardHeader}>
            <h3>Class Attendance</h3>
            <span className={styles.rateValue}>{attendance.attendanceRate.toFixed(1)}%</span>
          </div>
          <div className={styles.progressBarWrapper}>
            <div
              className={`${styles.progressBar} ${styles.progressAttendance}`}
              style={{ width: `${Math.min(attendance.attendanceRate, 100)}%` }}
            />
          </div>
          <div className={styles.statsDetails}>
            <div>
              <span>Active Students:</span> <strong>{totalStudents}</strong>
            </div>
            <div>
              <span>Present/Late Days:</span>{" "}
              <strong>{attendance.presentAttendance + attendance.lateAttendance}</strong>
            </div>
            <div>
              <span>Absent Days:</span> <strong>{attendance.absentAttendance}</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
