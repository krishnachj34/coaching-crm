import React from "react";
import styles from "../app/page.module.css";

interface StatCardProps {
  title: string;
  value: string | number;
  placeholderText: string;
}

export default function StatCard({ title, value, placeholderText }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>{title}</span>
      </div>
      <div className={styles.cardValue}>{value}</div>
      <div className={styles.cardPlaceholder}>
        <span>{placeholderText}</span>
      </div>
    </div>
  );
}
