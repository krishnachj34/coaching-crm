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
            <div className={styles.profileSection}>
              <h4>Personal Info</h4>
              <p><strong>Phone:</strong> {student.phone}</p>
              <p><strong>Email:</strong> {student.email || <span className={styles.noneText}>None</span>}</p>
              <p><strong>Registered:</strong> {new Date(student.createdAt).toLocaleDateString()}</p>
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
                      <span>Fee: ${Number(e.course.feeAmount).toFixed(2)}/mo</span>
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
                        <td>${Number(p.amount).toFixed(2)}</td>
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
