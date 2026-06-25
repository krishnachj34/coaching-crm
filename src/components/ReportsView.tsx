"use client";

import React from "react";
import styles from "../app/reports/page.module.css";

interface LeadsFunnel {
  totalLeads: number;
  enrolledLeads: number;
  lostLeads: number;
  conversionRate: number;
}

interface Financials {
  totalPaid: number;
  totalPending: number;
  collectionRate: number;
}

interface AttendanceStats {
  totalAttendance: number;
  presentAttendance: number;
  lateAttendance: number;
  absentAttendance: number;
  attendanceRate: number;
}

interface CourseStat {
  id: string;
  title: string;
  feeAmount: number;
  studentCount: number;
  monthlyRevenue: number;
}

interface ReportsViewProps {
  data: {
    leadsFunnel: LeadsFunnel;
    financials: Financials;
    attendance: AttendanceStats;
    courses: CourseStat[];
    totalStudents: number;
  };
}

export default function ReportsView({ data }: ReportsViewProps) {
  const { leadsFunnel, financials, attendance, courses, totalStudents } = data;

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

        {/* Financial Collection */}
        <div className={styles.reportCard}>
          <div className={styles.cardHeader}>
            <h3>Fee Collections</h3>
            <span className={styles.rateValue}>{financials.collectionRate.toFixed(1)}%</span>
          </div>
          <div className={styles.progressBarWrapper}>
            <div
              className={`${styles.progressBar} ${styles.progressFees}`}
              style={{ width: `${Math.min(financials.collectionRate, 100)}%` }}
            />
          </div>
          <div className={styles.statsDetails}>
            <div>
              <span>Collected:</span> <strong>${financials.totalPaid.toFixed(2)}</strong>
            </div>
            <div>
              <span>Pending:</span> <strong>${financials.totalPending.toFixed(2)}</strong>
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

      {/* Course Breakdown Table */}
      <section className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3>Course Enrollment & Revenue Analysis</h3>
          <p>Monthly tuition estimates based on active student enrollments.</p>
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Course Title</th>
                <th>Monthly Course Fee</th>
                <th>Enrolled Students</th>
                <th>Estimated Monthly Income</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyCell}>
                    No course catalog records found.
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id}>
                    <td className={styles.courseTitle}>{course.title}</td>
                    <td>${course.feeAmount.toFixed(2)}</td>
                    <td><strong>{course.studentCount} students</strong></td>
                    <td className={styles.revenueText}>
                      ${course.monthlyRevenue.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
