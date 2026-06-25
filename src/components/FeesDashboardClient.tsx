"use client";

import React, { useState } from "react";
import styles from "../app/fees/page.module.css";
import Sidebar from "@/components/Sidebar";
import PaymentTable from "@/components/PaymentTable";
import PaymentModal from "@/components/PaymentModal";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className={styles.feesContainer}>
      <Sidebar currentPhase={6} />

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

        <PaymentTable initialPayments={initialPayments} onStatusChangeSuccess={handleSuccess} />

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
