"use client";

import React from "react";
import styles from "../app/students/page.module.css";

interface Course {
  id: string;
  title: string;
  description?: string | null;
  feeAmount: any;
}

interface Enrollment {
  course: Course;
}

interface Payment {
  id: string;
  amount: any;
  paymentDate: Date;
  status: string;
}

interface Attendance {
  id: string;
  date: Date;
  status: string;
}

interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  photoUrl?: string | null;
  enrollments: Enrollment[];
  payments?: Payment[];
  attendance?: Attendance[];
  createdAt: Date;
}

interface StudentDetailModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
}

export default function StudentDetailModal({ isOpen, student, onClose }: StudentDetailModalProps) {
  if (!isOpen || !student) return null;

  const payments = student.payments || [];
  const attendance = student.attendance || [];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContentLarge}>
        <div className={styles.modalHeader}>
          <h3>Student Profile: {student.name}</h3>
          <button onClick={onClose} className={styles.closeModalButton}>
            ✕
          </button>
        </div>

        <div className={styles.profileLayout}>
          {/* Left panel: Info */}
          <div className={styles.profileSidebar}>
            {/* Student Photo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem", gap: "0.5rem" }}>
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary)", boxShadow: "var(--shadow-sm)" }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", fontWeight: "800", boxShadow: "var(--shadow-sm)" }}>
                  {student.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                </div>
              )}
            </div>

            <div className={styles.profileSection}>
              <h4>Personal Info</h4>
              <p><strong>Phone:</strong> {student.phone}</p>
              <p><strong>Email:</strong> {student.email || <span className={styles.noneText}>None</span>}</p>
              <p><strong>Address:</strong> {student.address || <span className={styles.noneText}>None</span>}</p>
              <p><strong>Registered:</strong> {new Date(student.createdAt).toLocaleDateString()}</p>
            </div>

            <div className={styles.profileSection}>
              <h4>Parent / Guardian Contact</h4>
              <p><strong>Name:</strong> {student.parentName || <span className={styles.noneText}>None</span>}</p>
              <p><strong>Phone:</strong> {student.parentPhone || <span className={styles.noneText}>None</span>}</p>
            </div>

            <div className={styles.profileSection}>
              <h4>Enrolled Courses</h4>
              {student.enrollments.length === 0 ? (
                <p className={styles.noneText}>No enrollments yet.</p>
              ) : (
                <div className={styles.courseBadgeContainer}>
                  {student.enrollments.map((e, idx) => (
                    <div key={idx} className={styles.courseProfileCard}>
                      <strong>{e.course.title}</strong>
                      {e.course.description && (
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.25rem 0", lineHeight: "1.3" }}>
                          {e.course.description}
                        </p>
                      )}
                      <span>Fee: ₹{Number(e.course.feeAmount).toFixed(2)}/mo</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Logs */}
          <div className={styles.profileMain}>
            <div className={styles.profileLogSection}>
              <h4>Fee Payments (Phase 6 Placeholder)</h4>
              {payments.length === 0 ? (
                <div className={styles.logPlaceholder}>
                  <p className={styles.noneText}>No payments recorded yet.</p>
                  <span>Tuple entries will appear here once connected in Phase 6.</span>
                </div>
              ) : (
                <table className={styles.logTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                        <td>₹{Number(p.amount).toFixed(2)}</td>
                        <td>
                          <span
                            className={
                              p.status === "PAID"
                                ? styles.statusTextPaid
                                : styles.statusTextPending
                            }
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles.profileLogSection}>
              <h4>Attendance History (Phase 7 Placeholder)</h4>
              {attendance.length === 0 ? (
                <div className={styles.logPlaceholder}>
                  <p className={styles.noneText}>No attendance records found.</p>
                  <span>Attendance calendars will sync here in Phase 7.</span>
                </div>
              ) : (
                <table className={styles.logTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a) => (
                      <tr key={a.id}>
                        <td>{new Date(a.date).toLocaleDateString()}</td>
                        <td>
                          <span
                            className={
                              a.status === "PRESENT"
                                ? styles.statusTextPresent
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
              )}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelButton}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
