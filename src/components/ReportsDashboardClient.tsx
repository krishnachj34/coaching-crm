"use client";

import React from "react";
import styles from "../app/reports/page.module.css";
import Sidebar from "@/components/Sidebar";
import ReportsView from "@/components/ReportsView";

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

interface ReportsDashboardClientProps {
  reportsData: {
    leadsFunnel: LeadsFunnel;
    financials: Financials;
    attendance: AttendanceStats;
    courses: CourseStat[];
    totalStudents: number;
  };
}

export default function ReportsDashboardClient({ reportsData }: ReportsDashboardClientProps) {
  return (
    <div className={styles.reportsContainer}>
      <Sidebar currentPhase={12} />

      <main className={styles.reportsMain}>
        <header className={styles.pageHeader}>
          <div className={styles.titleArea}>
            <h1>Reports & Analytics</h1>
            <p>View business analytics, student conversions, and tuition incomes.</p>
          </div>
        </header>

        <ReportsView data={reportsData} />
      </main>
    </div>
  );
}
