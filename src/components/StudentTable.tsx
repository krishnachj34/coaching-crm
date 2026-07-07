"use client";

import React, { useState } from "react";
import styles from "../app/students/page.module.css";
import { deleteStudent } from "@/app/students/actions";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
  category?: Category;
}

interface Batch {
  id: string;
  name: string;
  timing: string;
  feeAmount: any;
  subCategory?: SubCategory;
}

interface Enrollment {
  batch: Batch;
}

interface Payment {
  id: string;
  amount: any;
  paymentDate: Date | string;
  status: string;
}

interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  rollNo?: string | null;
  courseEndDate?: Date | string | null;
  installments?: string | null;
  batchEnrollments: Enrollment[];
  payments: Payment[];
  createdAt: Date | string;
}

interface StudentTableProps {
  initialStudents: Student[];
  batches: Batch[];
}

export default function StudentTable({ initialStudents, batches }: StudentTableProps) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const router = useRouter();

  React.useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering row click to view details
    if (!confirm("Are you sure you want to delete this student and all their records?")) return;

    const res = await deleteStudent(id);
    if (res.success) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } else {
      alert(res.error || "Failed to delete student.");
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.phone.includes(search) ||
      (student.email && student.email.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedBatchId) {
      const isEnrolled = student.batchEnrollments.some((be) => be.batch.id === selectedBatchId);
      if (!isEnrolled) return false;
    }

    return true;
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
        <select
          value={selectedBatchId}
          onChange={(e) => setSelectedBatchId(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Batch Timings</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name} ({batch.timing})
            </option>
          ))}
        </select>
      </div>

      <div className={styles.tableResponsive}>
        <table className={styles.table} style={{ fontSize: "0.8rem" }}>
          <thead>
            <tr style={{ background: "var(--surface-container-low)" }}>
              <th style={{ padding: "0.5rem" }}>S.No</th>
              <th style={{ padding: "0.5rem" }}>Name</th>
              <th style={{ padding: "0.5rem" }}>Contact Number</th>
              <th style={{ padding: "0.5rem" }}>Course</th>
              <th style={{ padding: "0.5rem" }}>Course Level</th>
              <th style={{ padding: "0.5rem" }}>Batch Timing</th>
              <th style={{ padding: "0.5rem" }}>DO Admission</th>
              <th style={{ padding: "0.5rem" }}>DO Course End</th>
              <th style={{ padding: "0.5rem" }}>Fees paid date</th>
              <th style={{ padding: "0.5rem" }}>Fees Paid Amt.</th>
              <th style={{ padding: "0.5rem" }}>Fees Due Date</th>
              <th style={{ padding: "0.5rem" }}>Fees Due Amt.</th>
              <th style={{ padding: "0.5rem" }}>Installments</th>
              <th style={{ padding: "0.5rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={14} className={styles.emptyCell}>
                  No student registers match the search parameters.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student, index) => {
                const firstEnrollment = student.batchEnrollments[0];
                const courseName = firstEnrollment?.batch?.subCategory?.category?.name || "English";
                const levelName = firstEnrollment?.batch?.subCategory?.name || "--";
                const timing = firstEnrollment?.batch?.timing || "--";

                const paidPayment = student.payments.find((p) => p.status === "PAID");
                const pendingPayment = student.payments.find((p) => p.status === "PENDING");

                const formattedPaidDate = paidPayment 
                  ? new Date(paidPayment.paymentDate).toLocaleDateString()
                  : "--";
                const formattedPaidAmt = paidPayment
                  ? `₹${Number(paidPayment.amount).toFixed(0)}`
                  : "--";

                const formattedDueDate = pendingPayment
                  ? new Date(pendingPayment.paymentDate).toLocaleDateString()
                  : "--";
                const formattedDueAmt = pendingPayment
                  ? `₹${Number(pendingPayment.amount).toFixed(0)}`
                  : "--";

                return (
                  <tr
                    key={student.id}
                    onClick={() => router.push(`/students/${student.id}`)}
                    className={styles.clickableRow}
                  >
                    <td style={{ padding: "0.5rem", fontWeight: "700" }}>{index + 1}</td>
                    <td style={{ padding: "0.5rem", fontWeight: "700" }} className={styles.studentName}>
                      {student.name}
                    </td>
                    <td style={{ padding: "0.5rem" }}>{student.phone}</td>
                    <td style={{ padding: "0.5rem", fontWeight: "600" }}>{courseName}</td>
                    <td style={{ padding: "0.5rem" }}>{levelName}</td>
                    <td style={{ padding: "0.5rem" }}>{timing}</td>
                    <td style={{ padding: "0.5rem" }}>{new Date(student.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "0.5rem" }}>
                      {student.courseEndDate 
                        ? new Date(student.courseEndDate).toLocaleDateString() 
                        : "--"}
                    </td>
                    <td style={{ padding: "0.5rem" }}>{formattedPaidDate}</td>
                    <td style={{ padding: "0.5rem", color: "var(--success)", fontWeight: "700" }}>{formattedPaidAmt}</td>
                    <td style={{ padding: "0.5rem" }}>{formattedDueDate}</td>
                    <td style={{ padding: "0.5rem", color: "var(--danger)", fontWeight: "700" }}>{formattedDueAmt}</td>
                    <td style={{ padding: "0.5rem", fontStyle: "italic" }}>{student.installments || "Lumpsump"}</td>
                    <td style={{ padding: "0.5rem" }}>
                      <button
                        onClick={(e) => handleDelete(student.id, e)}
                        className={styles.deleteButton}
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
