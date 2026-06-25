import React from "react";
import styles from "./page.module.css";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/utils/db";
import { serializePrisma } from "@/utils/serialize";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email || "Guest Coach";
  const currentPhase = 10; 

  // Fetch real statistics from database in parallel to optimize load times
  let totalLeads = 0;
  let totalStudents = 0;
  let pendingFees = 0;
  let attendanceRate = 0;
  let recentEnrollments: any[] = [];

  try {
    const [leadsCount, studentsCount, pendingCount, totalAttendance, presentOrLate, enrollments] = await Promise.all([
      db.lead.count(),
      db.student.count(),
      db.payment.count({ where: { status: "PENDING" } }),
      db.attendance.count(),
      db.attendance.count({ where: { status: { in: ["PRESENT", "LATE"] } } }),
      db.enrollment.findMany({
        take: 3,
        orderBy: { joinedAt: "desc" },
        include: {
          student: true,
          course: true,
        },
      })
    ]);

    totalLeads = leadsCount;
    totalStudents = studentsCount;
    pendingFees = pendingCount;
    recentEnrollments = enrollments;
    if (totalAttendance > 0) {
      attendanceRate = Math.round((presentOrLate / totalAttendance) * 100);
    }
  } catch (error) {
    console.error("Failed to fetch dashboard statistics from database:", error);
  }

  const serializedEnrollments = serializePrisma(recentEnrollments);
  const maxCapacity = 150;
  const capacityPercentage = Math.min(Math.round((totalStudents / maxCapacity) * 100), 100);

  return (
    <div className={styles.container}>
      <Sidebar currentPhase={currentPhase} />
      
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1>Institute Dashboard</h1>
            <p>Overview of IELTS coaching performance and lead pipeline.</p>
          </div>
          <span className={styles.phaseBadge}>{userEmail}</span>
        </header>

        {/* TWO-COLUMN BENTO GRID */}
        <div className={styles.dashboardBento}>
          {/* Left Column: Stats + Funnel + Trend + Recent Activity */}
          <div className={styles.leftColumn}>
            <div className={styles.dashboardGrid}>
              <StatCard 
                title="Total Active Leads" 
                value={totalLeads} 
                placeholderText="Leads in pipeline" 
              />
              <StatCard 
                title="Enrolled Students" 
                value={totalStudents} 
                placeholderText="Enrolled in courses" 
              />
              <StatCard 
                title="Pending Fee Invoices" 
                value={pendingFees} 
                placeholderText="Awaiting payments" 
              />
            </div>

            {/* Conversion Funnel & Trend Charts Row */}
            <div className={styles.analyticsRow}>
              {/* Funnel Card */}
              <div className={styles.funnelCard}>
                <div className={styles.analyticsCardHeader}>
                  <h4>Conversion Funnel</h4>
                </div>
                <div className={styles.funnelContent}>
                  <div className={styles.funnelStage} style={{ width: "100%" }}>
                    <span>Raw Leads</span>
                    <strong>100% ({totalLeads})</strong>
                  </div>
                  <div className={styles.funnelStage} style={{ width: "85%", opacity: 0.9 }}>
                    <span>Contacted</span>
                    <strong>85%</strong>
                  </div>
                  <div className={styles.funnelStage} style={{ width: "65%", opacity: 0.8 }}>
                    <span>Counseling</span>
                    <strong>65%</strong>
                  </div>
                  <div className={styles.funnelStage} style={{ width: "45%", opacity: 0.7 }}>
                    <span>Demo Class</span>
                    <strong>45%</strong>
                  </div>
                  <div className={styles.funnelStage} style={{ width: "30%", opacity: 0.6 }}>
                    <span>Enrolled</span>
                    <strong>30% ({totalStudents})</strong>
                  </div>
                </div>
                <div className={styles.funnelFooter}>
                  <p>Average Conversion Time: <strong>8.4 Days</strong></p>
                </div>
              </div>

              {/* Trend Chart Card */}
              <div className={styles.trendCard}>
                <div className={styles.analyticsCardHeader}>
                  <div>
                    <h4>Revenue &amp; Enrollment Trend</h4>
                    <p className={styles.trendSubtitle}>Comparison between projected and actual growth</p>
                  </div>
                  <div className={styles.legend}>
                    <span className={styles.legendItem}>
                      <span className={styles.dotRevenue}></span> Revenue
                    </span>
                    <span className={styles.legendItem}>
                      <span className={styles.dotTarget}></span> Target
                    </span>
                  </div>
                </div>
                <div className={styles.svgWrapper}>
                  <svg className={styles.svgChart} viewBox="0 0 800 180" width="100%" height="100%">
                    <line x1="0" y1="0" x2="800" y2="0" stroke="var(--surface-container)" strokeWidth="1" />
                    <line x1="0" y1="45" x2="800" y2="45" stroke="var(--surface-container)" strokeWidth="1" />
                    <line x1="0" y1="90" x2="800" y2="90" stroke="var(--surface-container)" strokeWidth="1" />
                    <line x1="0" y1="135" x2="800" y2="135" stroke="var(--surface-container)" strokeWidth="1" />
                    
                    {/* Target Line */}
                    <path d="M0,135 L100,126 L200,121 L300,108 L400,90 L500,72 L600,63 L700,45 L800,36" fill="none" stroke="var(--secondary-fixed-dim)" strokeDasharray="4" strokeWidth="2" />
                    {/* Actual Line */}
                    <path d="M0,162 L100,148 L200,139 L300,117 L400,99 L500,76 L600,54 L700,40 L800,18" fill="none" stroke="var(--primary)" strokeWidth="3" />
                    {/* Area Shade */}
                    <path d="M0,162 L100,148 L200,139 L300,117 L400,99 L500,76 L600,54 L700,40 L800,18 L800,180 L0,180 Z" fill="url(#grad1)" opacity="0.1" />
                    
                    <defs>
                      <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className={styles.xAxisLabels}>
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Enrollment Activity Table */}
            <div className={styles.activityTableCard}>
              <h3>Recent Enrollment Activity</h3>
              {serializedEnrollments.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  No recent enrollment records found.
                </p>
              ) : (
                <table className={styles.activityTable}>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Course (Module)</th>
                      <th>Status</th>
                      <th>Enrollment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serializedEnrollments.map((enr: any) => (
                      <tr key={enr.id}>
                        <td style={{ fontWeight: "700" }}>{enr.student.name}</td>
                        <td>{enr.course.title}</td>
                        <td>
                          <span className={`${styles.statusTag} ${styles.statusTagEnrolled}`}>
                            Enrolled
                          </span>
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {new Date(enr.joinedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right Column: Capacity Meter + Upcoming Orientation Schedules + AI Outreach Box */}
          <div className={styles.rightColumn}>
            {/* Institute Capacity Widget */}
            <div className={styles.progressCard}>
              <h4>Institute Capacity</h4>
              <p>Occupancy at {capacityPercentage}% ({totalStudents} / {maxCapacity} seats)</p>
              <div className={styles.progressBarContainer}>
                <div className={styles.progressBarFill} style={{ width: `${capacityPercentage}%` }}></div>
              </div>
              <p style={{ fontSize: "0.75rem", opacity: "0.85", marginTop: "0.5rem" }}>
                Suggest expanding faculty to accommodate 150+ new leads
              </p>
            </div>

            {/* Upcoming Batch Orientation List */}
            <div className={styles.scheduleCard}>
              <h4>Upcoming Schedules</h4>
              <div className={styles.scheduleList}>
                <div className={styles.scheduleItem}>
                  <div className={styles.scheduleDate}>12</div>
                  <div className={styles.scheduleDetails}>
                    <p>Morning Batch Orientation</p>
                    <span>09:00 AM • Room 4B</span>
                  </div>
                </div>
                <div className={styles.scheduleItem}>
                  <div className={styles.scheduleDate}>15</div>
                  <div className={styles.scheduleDetails}>
                    <p>IELTS Writing Masterclass</p>
                    <span>02:00 PM • Lecture Hall C</span>
                  </div>
                </div>
                <div className={styles.scheduleItem}>
                  <div className={styles.scheduleDate}>18</div>
                  <div className={styles.scheduleDetails}>
                    <p>General speaking booster mock</p>
                    <span>11:00 AM • Online Room 2</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Optimization Outreach Card */}
            <div className={styles.aiOptimizationCard}>
              <h4>AI Optimization Suggestion</h4>
              <p>
                You have {totalLeads} active leads that haven't been contacted in 48 hours. Historical data suggests immediate follow-up increases conversion rate by 24%.
              </p>
              <button className={styles.aiOptimizationBtn}>
                Execute Outreach Sequence
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
