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

interface GrowthTrendItem {
  name: string;
  count: number;
  cumulative: number;
}

interface ReportsViewProps {
  data: {
    leadsFunnel: LeadsFunnel;
    financials: Financials;
    attendance: AttendanceStats;
    courses: CourseStat[];
    totalStudents: number;
    growthTrend?: GrowthTrendItem[];
  };
}

export default function ReportsView({ data }: ReportsViewProps) {
  const { leadsFunnel, financials, attendance, courses, totalStudents, growthTrend } = data;

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
              <span>Collected:</span> <strong>₹{financials.totalPaid.toFixed(2)}</strong>
            </div>
            <div>
              <span>Pending:</span> <strong>₹{financials.totalPending.toFixed(2)}</strong>
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

      {/* Student Growth Trend Visual Analysis */}
      {growthTrend && growthTrend.length > 0 && (
        <section className={styles.tableCard} style={{ gridColumn: "span 2" }}>
          <div className={styles.tableHeader}>
            <h3>Student Signup & Growth Trend</h3>
            <p>Visualizing cumulative student registrations and new monthly signups.</p>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "2rem", marginTop: "1rem" }} className={styles.growthPanelGrid}>
            {/* Legend & Stats breakdown */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "1.25rem" }}>
              <div style={{ padding: "1rem", borderRadius: "var(--radius)", background: "var(--primary-light)", border: "1px solid var(--primary-fixed-dim)" }}>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--primary)", fontWeight: "700" }}>Total Students</span>
                <h3 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--foreground)", margin: "0.25rem 0" }}>{totalStudents}</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Cumulative active database size</span>
              </div>
              <div style={{ padding: "1rem", borderRadius: "var(--radius)", background: "var(--success-container)", border: "1px solid #a7f3d0" }}>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--success)", fontWeight: "700" }}>Recent Growth</span>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--foreground)", margin: "0.25rem 0" }}>
                  +{growthTrend.reduce((sum, item) => sum + item.count, 0)} new
                </h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Signups over the last 6 months</span>
              </div>
            </div>
            
            {/* SVG Chart */}
            <div style={{ flex: 1, minHeight: "220px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <svg viewBox="0 0 500 200" style={{ width: "100%", height: "220px", overflow: "visible" }}>
                <defs>
                  <linearGradient id="growthAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="growthLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--secondary)" />
                  </linearGradient>
                </defs>
                
                <line x1="0" y1="40" x2="500" y2="40" stroke="var(--outline-variant)" strokeDasharray="3,3" />
                <line x1="0" y1="90" x2="500" y2="90" stroke="var(--outline-variant)" strokeDasharray="3,3" />
                <line x1="0" y1="140" x2="500" y2="140" stroke="var(--outline-variant)" strokeDasharray="3,3" />
                
                {(() => {
                  const maxVal = Math.max(...growthTrend.map(d => d.cumulative), 6) || 6;
                  const points = growthTrend.map((d, i) => {
                    const x = (i / (growthTrend.length - 1)) * 500;
                    const y = 180 - (d.cumulative / maxVal) * 140;
                    return { x, y, name: d.name, count: d.count, cumulative: d.cumulative };
                  });
                  
                  const linePath = points.map(p => `${p.x},${p.y}`).join(" ");
                  const areaPath = `0,180 ${linePath} 500,180`;
                  
                  return (
                    <>
                      <polygon points={areaPath} fill="url(#growthAreaGrad)" />
                      <polyline
                        fill="none"
                        stroke="url(#growthLineGrad)"
                        strokeWidth="3.5"
                        points={linePath}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {points.map((p, idx) => (
                        <g key={idx}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="5"
                            fill="var(--primary)"
                            stroke="#ffffff"
                            strokeWidth="2"
                            style={{ cursor: "pointer" }}
                          />
                          <text
                            x={p.x}
                            y={p.y - 12}
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="800"
                            fill="var(--foreground)"
                          >
                            {p.cumulative}
                          </text>
                          {p.count > 0 && (
                            <text
                              x={p.x}
                              y={p.y + 16}
                              textAnchor="middle"
                              fontSize="8"
                              fontWeight="700"
                              fill="var(--success)"
                            >
                              +{p.count}
                            </text>
                          )}
                          <text
                            x={p.x}
                            y="196"
                            textAnchor="middle"
                            fontSize="9.5"
                            fontWeight="600"
                            fill="var(--text-muted)"
                          >
                            {p.name}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        </section>
      )}

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
                    <td>₹{course.feeAmount.toFixed(2)}</td>
                    <td><strong>{course.studentCount} students</strong></td>
                    <td className={styles.revenueText}>
                      ₹{course.monthlyRevenue.toFixed(2)}
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
