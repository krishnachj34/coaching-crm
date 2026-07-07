"use client";

import React, { useState } from "react";
import styles from "../app/fees/page.module.css";
import Sidebar from "@/components/Sidebar";
import PaymentTable from "@/components/PaymentTable";
import PaymentModal from "@/components/PaymentModal";
import { useRouter } from "next/navigation";
import { verifyPaymentStatus } from "@/app/fees/actions";

interface SimpleStudent {
  id: string;
  name: string;
}

interface StudentForPayment {
  name: string;
  email: string | null;
}

interface Payment {
  id: string;
  studentId: string;
  amount: any;
  paymentDate: Date;
  status: string;
  student: StudentForPayment;
  notes?: string | null;
}

interface FeesDashboardClientProps {
  initialPayments: Payment[];
  studentsList: SimpleStudent[];
  stats: {
    totalPaid: number;
    totalPending: number;
  };
}

export default function FeesDashboardClient({
  initialPayments,
  studentsList,
  stats,
}: FeesDashboardClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("transactions"); // "transactions" or "verification"
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  const handleApprove = async (id: string) => {
    setVerifyingId(id);
    const res = await verifyPaymentStatus(id, true);
    setVerifyingId(null);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || "Failed to approve payment");
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter reason for rejection (optional):");
    if (reason === null) return; // User cancelled prompt
    
    setVerifyingId(id);
    const res = await verifyPaymentStatus(id, false, reason);
    setVerifyingId(null);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || "Failed to reject payment");
    }
  };

  // Filter payments in the verification queue
  const pendingVerificationPayments = initialPayments.filter(
    (p) => p.status === "PENDING_VERIFICATION"
  );
  
  const verificationCount = pendingVerificationPayments.length;

  return (
    <div className={styles.feesContainer}>
      <Sidebar currentPhase={9} />

      <main className={styles.feesMain}>
        <header className={styles.pageHeader}>
          <div className={styles.titleArea}>
            <h1>Fee Management</h1>
            <p>Log transactions, track collections, and audit tuition payments.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className={styles.addPaymentBtn}>
            + Record Payment
          </button>
        </header>

        {/* Stats Section */}
        <section className={styles.statsSummaryGrid}>
          <div className={styles.statCard}>
            <span className={styles.statCardTitle}>Total Collected Fees</span>
            <span className={`${styles.statCardValue} ${styles.statCardValuePaid}`}>
              ₹{stats.totalPaid.toFixed(2)}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statCardTitle}>Total Outstanding (Pending)</span>
            <span className={`${styles.statCardValue} ${styles.statCardValuePending}`}>
              ₹{stats.totalPending.toFixed(2)}
            </span>
          </div>
        </section>

        {/* Tab Selection */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", borderBottom: "1px solid var(--outline-variant, #cbd5e1)" }}>
          <button
            onClick={() => setActiveTab("transactions")}
            style={{
              padding: "0.75rem 1rem",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "transactions" ? "3px solid var(--primary, #4f46e5)" : "none",
              fontWeight: activeTab === "transactions" ? "700" : "500",
              color: activeTab === "transactions" ? "var(--primary, #4f46e5)" : "var(--text-muted, #64748b)",
              cursor: "pointer",
              fontSize: "0.875rem",
              transition: "all 0.2s ease"
            }}
          >
            All Transactions
          </button>
          <button
            onClick={() => setActiveTab("verification")}
            style={{
              padding: "0.75rem 1rem",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "verification" ? "3px solid var(--primary, #4f46e5)" : "none",
              fontWeight: activeTab === "verification" ? "700" : "500",
              color: activeTab === "verification" ? "var(--primary, #4f46e5)" : "var(--text-muted, #64748b)",
              cursor: "pointer",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              transition: "all 0.2s ease"
            }}
          >
            <span>Verification Queue</span>
            {verificationCount > 0 && (
              <span style={{
                background: "var(--danger, #ef4444)",
                color: "#ffffff",
                fontSize: "0.7rem",
                padding: "0.1rem 0.35rem",
                borderRadius: "10px",
                fontWeight: "700"
              }}>
                {verificationCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === "transactions" ? (
          <PaymentTable initialPayments={initialPayments} onStatusChangeSuccess={handleSuccess} />
        ) : (
          <div className={styles.tableWrapper}>
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Amount</th>
                    <th>Payment Details / UTR</th>
                    <th>Submitted Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingVerificationPayments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.emptyCell}>
                        No payments awaiting verification in this branch.
                      </td>
                    </tr>
                  ) : (
                    pendingVerificationPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td style={{ fontWeight: "700" }}>{payment.student.name}</td>
                        <td className={styles.amountText}>₹{Number(payment.amount).toFixed(2)}</td>
                        <td>
                          <span style={{
                            fontSize: "0.8125rem",
                            fontFamily: "monospace",
                            background: "var(--surface-container-low, #f1f5f9)",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            border: "1px dashed var(--outline-variant, #cbd5e1)",
                            color: "var(--primary, #4f46e5)",
                            fontWeight: "600"
                          }}>
                            {payment.notes || "UTR: Not Submitted"}
                          </span>
                        </td>
                        <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              disabled={verifyingId === payment.id}
                              onClick={() => handleApprove(payment.id)}
                              style={{
                                padding: "0.375rem 0.75rem",
                                background: "var(--primary, #4f46e5)",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                            >
                              {verifyingId === payment.id ? "..." : "Approve"}
                            </button>
                            <button
                              disabled={verifyingId === payment.id}
                              onClick={() => handleReject(payment.id)}
                              style={{
                                padding: "0.375rem 0.75rem",
                                background: "transparent",
                                color: "var(--danger, #ef4444)",
                                border: "1px solid var(--outline-variant, #fecaca)",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          students={studentsList}
        />
      </main>
    </div>
  );
}
