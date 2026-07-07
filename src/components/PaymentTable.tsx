"use client";

import React, { useState, useTransition } from "react";
import styles from "../app/fees/page.module.css";
import { updatePaymentStatus, deletePayment } from "@/app/fees/actions";

interface Student {
  name: string;
  email: string | null;
}

interface Payment {
  id: string;
  studentId: string;
  amount: any;
  paymentDate: Date;
  status: string;
  student: Student;
  notes?: string | null;
}

interface PaymentTableProps {
  initialPayments: Payment[];
  onStatusChangeSuccess: () => void;
}

export default function PaymentTable({ initialPayments, onStatusChangeSuccess }: PaymentTableProps) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    setPayments(initialPayments);
  }, [initialPayments]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updatePaymentStatus(id, newStatus);
      if (res.success) {
        setPayments((prev) =>
          prev.map((payment) => (payment.id === id ? { ...payment, status: newStatus } : payment))
        );
        onStatusChangeSuccess();
      } else {
        alert(res.error || "Failed to update status.");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment record?")) return;

    startTransition(async () => {
      const res = await deletePayment(id);
      if (res.success) {
        setPayments((prev) => prev.filter((p) => p.id !== id));
        onStatusChangeSuccess();
      } else {
        alert(res.error || "Failed to delete record.");
      }
    });
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.student.name.toLowerCase().includes(search.toLowerCase()) ||
      (payment.student.email && payment.student.email.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search receipts by student name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="ALL">All Statuses</option>
          <option value="PAID">Paid</option>
          <option value="PENDING_VERIFICATION">Pending Verification</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Amount</th>
              <th>Payment Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  No fee payment records found.
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td className={styles.studentName}>
                    <div>{payment.student.name}</div>
                    {payment.notes && (
                      <span style={{ fontSize: "0.75rem", color: "var(--primary)", display: "block", marginTop: "0.2rem", fontWeight: "600" }}>
                        {payment.notes}
                      </span>
                    )}
                  </td>
                  <td className={styles.amountText}>₹{Number(payment.amount).toFixed(2)}</td>
                  <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                  <td>
                    <select
                      disabled={isPending}
                      value={payment.status}
                      onChange={(e) => handleStatusChange(payment.id, e.target.value)}
                      className={`${styles.statusDropdown} ${
                        payment.status === "PAID"
                          ? styles.statusPaid
                          : payment.status === "PENDING"
                          ? styles.statusPending
                          : payment.status === "PENDING_VERIFICATION"
                          ? styles.statusPendingVerification || styles.statusPending
                          : styles.statusFailed
                      }`}
                    >
                      <option value="PAID">Paid</option>
                      <option value="PENDING_VERIFICATION">Pending Verification</option>
                      <option value="PENDING">Pending</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </td>
                  <td>
                    <button
                      disabled={isPending}
                      onClick={() => handleDelete(payment.id)}
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
