import React from "react";
import { getStudentById } from "../actions";
import Sidebar from "@/components/Sidebar";
import styles from "../page.module.css";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentProfilePage({ params }: PageProps) {
  const { id } = await params;
  const student = await getStudentById(id);

  if (!student) {
    notFound();
  }

  // Calculate statistics
  const payments = student.payments || [];
  const attendance = student.attendance || [];
  const batchEnrollments = student.batchEnrollments || [];

  const totalPaid = payments
    .filter((p: any) => p.status === "PAID")
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  const totalPending = payments
    .filter((p: any) => p.status === "PENDING")
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  const totalPaymentsCount = payments.length;
  const financialCompletionRate =
    totalPaid + totalPending > 0
      ? Math.round((totalPaid / (totalPaid + totalPending)) * 100)
      : 100;

  const totalAttendance = attendance.length;
  const presentDays = attendance.filter((a: any) => a.status === "PRESENT").length;
  const lateDays = attendance.filter((a: any) => a.status === "LATE").length;
  const attendanceRate =
    totalAttendance > 0
      ? Math.round(((presentDays + lateDays * 0.5) / totalAttendance) * 100)
      : 0;

  // Determine attendance status badge
  let attendanceBadgeColor = "var(--text-muted)";
  let attendanceBadgeText = "No Record";
  if (totalAttendance > 0) {
    if (attendanceRate >= 90) {
      attendanceBadgeColor = "var(--success)";
      attendanceBadgeText = "Excellent";
    } else if (attendanceRate >= 75) {
      attendanceBadgeColor = "var(--warning)";
      attendanceBadgeText = "Good";
    } else {
      attendanceBadgeColor = "var(--danger)";
      attendanceBadgeText = "Critical";
    }
  }

  return (
    <div className={styles.studentsContainer}>
      <Sidebar currentPhase={5} />

      <main className={styles.studentsMain}>
        <header className={styles.pageHeader}>
          <div className={styles.titleArea}>
            <Link href="/students" className={styles.backButton}>
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
                arrow_back
              </span>
              Back to Students
            </Link>
            <h1>Student Profile: {student.name}</h1>
            <p>Roll Number: {student.rollNo || <span className={styles.noneText}>Unassigned</span>}</p>
          </div>
        </header>

        {/* Visual Analytics / Overview Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.5rem",
            width: "100%",
          }}
        >
          {/* Card 1: Attendance Progress */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--outline-variant)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "var(--primary-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
                position: "relative",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "1.75rem", margin: "auto" }}
              >
                how_to_reg
              </span>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Attendance Rate
              </span>
              <h2 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--foreground)", margin: "0.25rem 0" }}>
                {totalAttendance > 0 ? `${attendanceRate}%` : "N/A"}
              </h2>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: attendanceBadgeColor,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: attendanceBadgeColor,
                    display: "inline-block",
                  }}
                />
                {attendanceBadgeText} ({presentDays}/{totalAttendance} present)
              </span>
            </div>
          </div>

          {/* Card 2: Financial Completion */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--outline-variant)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "var(--secondary-container)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--secondary-container-on, #7c3aed)",
                position: "relative",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "1.75rem", margin: "auto", color: "var(--secondary)" }}
              >
                payments
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Fee Collections
              </span>
              <h2 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--foreground)", margin: "0.25rem 0" }}>
                ₹{totalPaid.toFixed(2)}
              </h2>
              <div
                style={{
                  width: "100%",
                  height: "6px",
                  backgroundColor: "var(--outline-variant)",
                  borderRadius: "99px",
                  marginTop: "0.5rem",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${financialCompletionRate}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)",
                    borderRadius: "99px",
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                <span>Paid: {financialCompletionRate}%</span>
                <span>Pending: ₹{totalPending.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Active Enrollments */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--outline-variant)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "var(--tertiary-container)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--tertiary)",
                position: "relative",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "1.75rem", margin: "auto" }}
              >
                auto_stories
              </span>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Course Load
              </span>
              <h2 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--foreground)", margin: "0.25rem 0" }}>
                {batchEnrollments.length}
              </h2>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Active batch enrollment{batchEnrollments.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Content Layout */}
        <div className={styles.profileLayout}>
          {/* Left panel: Info */}
          <div className={styles.profileSidebar}>
            {/* Student Photo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "0.5rem", gap: "0.75rem" }}>
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  style={{ width: "96px", height: "96px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--primary)", boxShadow: "var(--shadow-md)" }}
                />
              ) : (
                <div style={{ width: "96px", height: "96px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.25rem", fontWeight: "800", boxShadow: "var(--shadow-md)" }}>
                  {student.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)}
                </div>
              )}
              <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--foreground)", margin: "0.25rem 0 0 0" }}>{student.name}</h3>
              {student.rollNo && (
                <span style={{ fontSize: "0.75rem", fontWeight: "700", background: "var(--primary-light)", color: "var(--primary)", padding: "0.2rem 0.60rem", borderRadius: "99px" }}>
                  {student.rollNo}
                </span>
              )}
            </div>

            <div className={styles.profileSection}>
              <h4>Personal Info</h4>
              <p><strong>Phone:</strong> {student.phone}</p>
              <p><strong>Email:</strong> {student.email || <span className={styles.noneText}>None</span>}</p>
              <p><strong>Address:</strong> {student.address || <span className={styles.noneText}>None</span>}</p>
              <p><strong>Registered (DOA):</strong> {new Date(student.createdAt).toLocaleDateString()}</p>
              <p><strong>Course End:</strong> {student.courseEndDate ? new Date(student.courseEndDate).toLocaleDateString() : <span className={styles.noneText}>None</span>}</p>
              <p><strong>Installment Detail:</strong> {student.installments || "Lumpsump"}</p>
            </div>

            <div className={styles.profileSection}>
              <h4>Parent / Guardian Contact</h4>
              <p><strong>Name:</strong> {student.parentName || <span className={styles.noneText}>None</span>}</p>
              <p><strong>Phone:</strong> {student.parentPhone || <span className={styles.noneText}>None</span>}</p>
            </div>

            <div className={styles.profileSection}>
              <h4>Enrolled Batches</h4>
              {batchEnrollments.length === 0 ? (
                <p className={styles.noneText}>No enrollments yet.</p>
              ) : (
                <div className={styles.courseBadgeContainer}>
                  {batchEnrollments.map((be: any, idx: number) => (
                    <div key={idx} className={styles.courseProfileCard}>
                      <strong>{be.batch.name}</strong>
                      <span>Fee: ₹{Number(be.batch.feeAmount).toFixed(2)}/mo</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Logs */}
          <div className={styles.profileMain}>
            {/* Payment History */}
            <div className={styles.profileLogSection}>
              <h4>Fee Payments</h4>
              {payments.length === 0 ? (
                <div className={styles.logPlaceholder}>
                  <span className="material-symbols-outlined" style={{ fontSize: "2rem", color: "var(--outline)" }}>
                    account_balance_wallet
                  </span>
                  <p className={styles.noneText}>No payments recorded yet.</p>
                  <span>Use the Fees page to collect payments for this student.</span>
                </div>
              ) : (
                <div className={styles.tableResponsive}>
                  <table className={styles.logTable}>
                    <thead>
                      <tr>
                        <th>Payment Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p: any) => (
                        <tr key={p.id}>
                          <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                          <td style={{ fontWeight: "700" }}>₹{Number(p.amount).toFixed(2)}</td>
                          <td>
                            <span
                              className={
                                p.status === "PAID"
                                  ? styles.statusTextPaid
                                  : p.status === "PENDING"
                                  ? styles.statusTextPending
                                  : styles.statusTextFailed
                              }
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Attendance History */}
            <div className={styles.profileLogSection}>
              <h4>Attendance History</h4>
              {attendance.length === 0 ? (
                <div className={styles.logPlaceholder}>
                  <span className="material-symbols-outlined" style={{ fontSize: "2rem", color: "var(--outline)" }}>
                    event_busy
                  </span>
                  <p className={styles.noneText}>No attendance records found.</p>
                  <span>Logs will appear here once marked on the Attendance page.</span>
                </div>
              ) : (
                <div className={styles.tableResponsive}>
                  <table className={styles.logTable}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((a: any) => (
                        <tr key={a.id}>
                          <td>{new Date(a.date).toLocaleDateString()}</td>
                          <td>
                            <span
                              className={
                                a.status === "PRESENT"
                                  ? styles.statusTextPresent
                                  : a.status === "LATE"
                                  ? styles.statusTextLate
                                  : styles.statusTextAbsent
                              }
                            >
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
