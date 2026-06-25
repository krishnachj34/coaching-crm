"use client";

import React, { useState, useTransition } from "react";
import styles from "../app/fees/page.module.css";
import { createPayment } from "@/app/fees/actions";

interface Student {
  id: string;
  name: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  students: Student[];
}

export default function PaymentModal({ isOpen, onClose, onSuccess, students }: PaymentModalProps) {
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("PAID");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!studentId || !amount) {
      setError("Please select a student and enter the fee amount.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("amount", amount);
      formData.append("status", status);
      formData.append("paymentDate", paymentDate);

      const res = await createPayment(formData);

      if (res.error) {
        setError(res.error);
      } else {
        setStudentId("");
        setAmount("");
        setStatus("PAID");
        setPaymentDate(new Date().toISOString().substring(0, 10));
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Record Tuition Payment</h3>
          <button onClick={onClose} className={styles.closeModalButton}>
            ✕
          </button>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="payment-student">Student *</label>
            <select
              id="payment-student"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className={styles.modalSelect}
            >
              <option value="">-- Select Enrolled Student --</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroupDouble}>
            <div className={styles.formGroup}>
              <label htmlFor="payment-amount">Amount (₹) *</label>
              <input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="150.00"
                className={styles.modalInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="payment-status">Status</label>
              <select
                id="payment-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={styles.modalSelect}
              >
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="payment-date">Payment Date *</label>
            <input
              id="payment-date"
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className={styles.modalInput}
            />
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={styles.submitButton}
            >
              {isPending ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
