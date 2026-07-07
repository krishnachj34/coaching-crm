"use client";

import React, { useState } from "react";
import styles from "../app/leads/page.module.css";
import Sidebar from "@/components/Sidebar";
import LeadTable from "@/components/LeadTable";
import LeadModal from "@/components/LeadModal";
import { useRouter } from "next/navigation";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  interest: string | null;
  status: string;
  notes: string | null;
  source: string;
  trialStartDate: Date | string | null;
  trialEndDate: Date | string | null;
  createdAt: Date;
}

interface LeadsDashboardClientProps {
  initialLeads: Lead[];
}

export default function LeadsDashboardClient({ initialLeads }: LeadsDashboardClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    // Tells Next.js to trigger a server-side re-render of the page data
    router.refresh();
  };

  return (
    <div className={styles.leadsContainer}>
      <Sidebar currentPhase={8} />

      <main className={styles.leadsMain}>
        <header className={styles.pageHeader}>
          <div className={styles.titleArea}>
            <h1>Lead Management</h1>
            <p>Track, status check, and contact student inquiries.</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <a href="/leads/settings" className={styles.addLeadBtn} style={{ background: "var(--surface-container-low)", color: "var(--on-surface)", border: "1.5px solid var(--outline-variant)", display: "flex", alignItems: "center", gap: "0.25rem", textDecoration: "none" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>settings</span>
              <span>Integrations</span>
            </a>
            <button onClick={() => setIsModalOpen(true)} className={styles.addLeadBtn}>
              + Add Lead
            </button>
          </div>
        </header>

        <LeadTable initialLeads={initialLeads} />

        <LeadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      </main>
    </div>
  );
}
