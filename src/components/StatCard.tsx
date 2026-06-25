import React from "react";
import styles from "./StatCard.module.css";

const iconMap: Record<string, { icon: string; gradient: string }> = {
  "Total Active Leads":     { icon: "person_search", gradient: "linear-gradient(135deg,#4f46e5,#7c3aed)" },
  "Enrolled Students":      { icon: "school",        gradient: "linear-gradient(135deg,#0ea5e9,#6366f1)" },
  "Pending Fee Invoices":   { icon: "payments",      gradient: "linear-gradient(135deg,#f59e0b,#ef4444)" },
};

interface StatCardProps {
  title: string;
  value: string | number;
  placeholderText: string;
}

export default function StatCard({ title, value, placeholderText }: StatCardProps) {
  const meta = iconMap[title] ?? { icon: "bar_chart", gradient: "linear-gradient(135deg,#4f46e5,#7c3aed)" };

  return (
    <div className={styles.card}>
      <div className={styles.iconWrap} style={{ background: meta.gradient }}>
        <span className="material-symbols-outlined" style={{ fontSize: "1.3rem", color: "#fff" }}>
          {meta.icon}
        </span>
      </div>
      <div className={styles.cardBody}>
        <span className={styles.cardTitle}>{title}</span>
        <div className={styles.cardValue}>{value}</div>
        <div className={styles.cardPlaceholder}>{placeholderText}</div>
      </div>
    </div>
  );
}
