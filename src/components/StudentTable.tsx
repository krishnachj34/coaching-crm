"use client";

import React, { useState } from "react";
import styles from "../app/students/page.module.css";
import { deleteStudent } from "@/app/students/actions";
import { useRouter } from "next/navigation";

interface Course {
  id: string;
  title: string;
  description?: string | null;
  feeAmount: any;
}

interface Enrollment {
  course: Course;
}

interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  rollNo?: string | null;
  enrollments: Enrollment[];
  createdAt: Date;
}

interface StudentTableProps {
  initialStudents: Student[];
}

export default function StudentTable({ initialStudents }: StudentTableProps) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [search, setSearch] = useState("");
  const router = useRouter();

  React.useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering row click to view details
    if (!confirm("Are you sure you want to delete this student and all their enrollments?")) return;

    const res = await deleteStudent(id);
    if (res.success) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } else {
      alert(res.error || "Failed to delete student.");
    }
  };

  const filteredStudents = students.filter((student) => {
    return (
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.phone.includes(search) ||
      (student.email && student.email.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search students by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact Details</th>
              <th>Enrolled Courses</th>
              <th>Registration Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  No students registered yet.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  onClick={() => router.push(`/students/${student.id}`)}
                  className={styles.clickableRow}
                >
                  <td className={styles.studentName}>
                    <div>{student.name}</div>
                    {student.rollNo && (
                      <span style={{ fontSize: "0.75rem", color: "var(--primary)", display: "block", marginTop: "0.15rem", fontWeight: "600" }}>
                        ID: {student.rollNo}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className={styles.contactDetails}>
                      <span>📞 {student.phone}</span>
                      {student.email && <span className={styles.emailText}>✉️ {student.email}</span>}
                    </div>
                  </td>
                  <td>
                    {student.enrollments.length === 0 ? (
                      <span className={styles.noneText}>No enrollments</span>
                    ) : (
                      <div className={styles.courseBadgesList}>
                        {student.enrollments.map((e, index) => (
                          <span key={index} className={styles.courseBadge}>
                            {e.course.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={(e) => handleDelete(student.id, e)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
