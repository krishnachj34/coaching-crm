"use client";

import React, { useState, useEffect, useTransition } from "react";
import styles from "../app/fees/page.module.css";
import { createPayment } from "@/app/fees/actions";
import { QRCodeSVG } from "qrcode.react";
import { createWorker } from "tesseract.js";

// The Director's destination UPI ID
const DIRECTOR_UPI_ID = "director.coachingcrm@okaxis";

interface Student {
  id: string;
  name: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  students: Student[];
  defaultStudentId?: string;
  defaultAmount?: string;
}

export default function PaymentModal({ isOpen, onClose, onSuccess, students, defaultStudentId, defaultAmount }: PaymentModalProps) {
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStudentId(defaultStudentId || "");
      setAmount(defaultAmount || "");
    }
  }, [isOpen, defaultStudentId, defaultAmount]);

  const [status, setStatus] = useState("PAID");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [utr, setUtr] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setError(null);
    try {
      // Initialize Tesseract worker for English language OCR
      const worker = await createWorker("eng");
      const ret = await worker.recognize(file);
      const text = ret.data.text;
      await worker.terminate();

      console.log("OCR Extracted Text:", text);

      // Search for any 12-digit UPI UTR number in the text
      const match = text.match(/\b\d{12}\b/);
      if (match) {
        setUtr(match[0]);
      } else {
        setError("Could not find a 12-digit UTR number in the screenshot. Please enter it manually.");
      }
    } catch (err: any) {
      console.error("OCR Error:", err);
      setError("Failed to read image. Please type the UTR manually.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!studentId || !amount) {
      setError("Please select a student and enter the fee amount.");
      return;
    }

    if (status === "PENDING_VERIFICATION" && (!utr || utr.length !== 12 || isNaN(Number(utr)))) {
      setError("A valid 12-digit UTR/UPI Ref number is required for verification.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("amount", amount);
      formData.append("status", status);
      formData.append("paymentDate", paymentDate);
      if (status === "PENDING_VERIFICATION") {
        formData.append("notes", `UTR: ${utr}`);
      }

      const res = await createPayment(formData);

      if (res.error) {
        setError(res.error);
      } else {
        setStudentId("");
        setAmount("");
        setStatus("PAID");
        setUtr("");
        setPaymentDate(new Date().toISOString().substring(0, 10));
        onSuccess();
        onClose();
      }
    });
  };

  // Inline CSS styling for the payment elements
  const qrSectionStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
    padding: "1rem",
    background: "var(--surface-container-low, #f8fafc)",
    borderRadius: "12px",
    border: "1px solid var(--outline-variant, #e2e8f0)",
    marginBottom: "1.25rem",
    textAlign: "center",
  };

  const qrWrapperStyle: React.CSSProperties = {
    padding: "0.5rem",
    background: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    display: "inline-block",
  };

  const upiDetailsStyle: React.CSSProperties = {
    fontSize: "0.8125rem",
    color: "var(--foreground, #0f172a)",
    fontFamily: "monospace",
    background: "var(--surface-container, #ffffff)",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    border: "1px dashed var(--outline-variant, #cbd5e1)",
  };

  const fileInputStyle: React.CSSProperties = {
    padding: "0.5rem",
    border: "1px dashed var(--primary, #4f46e5)",
    borderRadius: "8px",
    background: "var(--primary-light, #eef2ff)",
    width: "100%",
    cursor: "pointer",
    fontSize: "0.8125rem",
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
                placeholder="15000.00"
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
                <option value="PENDING_VERIFICATION">Pending Verification (UPI QR)</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          {/* DYNAMIC UPI QR CODE SECTION */}
          {status === "PENDING_VERIFICATION" && amount && studentId && (
            <div style={qrSectionStyle}>
              <p style={{ fontSize: "0.8125rem", fontWeight: "600", margin: 0 }}>
                Scan to pay directly to Director's account:
              </p>
              <div style={qrWrapperStyle}>
                <QRCodeSVG
                  value={`upi://pay?pa=${DIRECTOR_UPI_ID}&pn=CoachingCRM&am=${amount}&tn=FEE_${studentId.slice(0, 8)}&cu=INR`}
                  size={140}
                  level="H"
                />
              </div>
              <div style={upiDetailsStyle}>
                UPI ID: {DIRECTOR_UPI_ID}
              </div>
            </div>
          )}

          {/* OCR SCREENSHOT UPLOADER SECTION */}
          {status === "PENDING_VERIFICATION" && (
            <div className={styles.formGroup} style={{ background: "var(--surface-container-low, #f8fafc)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--outline-variant, #e2e8f0)" }}>
              <label htmlFor="payment-screenshot" style={{ fontWeight: "700", display: "block", marginBottom: "0.25rem" }}>
                Upload Payment Screenshot (Optional UTR Scan)
              </label>
              <input
                id="payment-screenshot"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={fileInputStyle}
                disabled={ocrLoading}
              />
              {ocrLoading && (
                <p style={{ fontSize: "0.75rem", fontStyle: "italic", color: "var(--primary)", marginTop: "0.25rem", margin: 0 }}>
                  Scanning receipt screenshot for UTR number...
                </p>
              )}
            </div>
          )}

          {/* 12-DIGIT UTR FIELD */}
          {status === "PENDING_VERIFICATION" && (
            <div className={styles.formGroup}>
              <label htmlFor="payment-utr">12-Digit UPI UTR/Ref No *</label>
              <input
                id="payment-utr"
                type="text"
                maxLength={12}
                required
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="e.g. 318902834190"
                className={styles.modalInput}
              />
            </div>
          )}

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
              disabled={isPending || ocrLoading}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || ocrLoading}
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
