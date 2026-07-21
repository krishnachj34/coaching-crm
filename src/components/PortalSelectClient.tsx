"use client";

import React from "react";
import styles from "./PortalSelectClient.module.css";
import { useRouter } from "next/navigation";

export default function PortalSelectClient() {
  const router = useRouter();

  const handleSelect = (instituteId: "STUDY_ABROAD" | "FOREIGN_LANGUAGE") => {
    router.push(`/login?institute=${instituteId}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.brandBadge}>
          <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>domain</span>
          <span>Institute CRM Gateway</span>
        </div>
        <h1 className={styles.title}>Which CRM Portal Do You Need To Access?</h1>
        <p className={styles.subtitle}>
          Select your institute below to sign in to your dedicated CRM workspace. Both portals maintain separate datasets, workflows, and student portals.
        </p>
      </div>

      <div className={styles.grid}>
        {/* Box 1: Study Abroad Wala */}
        <div
          className={`${styles.card} ${styles.studyAbroadCard}`}
          onClick={() => handleSelect("STUDY_ABROAD")}
        >
          <div>
            <div className={`${styles.iconContainer} ${styles.studyAbroadIcon}`}>
              <span className="material-symbols-outlined" style={{ fontSize: "2.4rem" }}>
                flight_takeoff
              </span>
            </div>

            <h2 className={styles.cardTitle}>Study Abroad Wala</h2>
            <p className={styles.cardDesc}>
              Overseas Education CRM for university admissions, student visa tracking, SOP checklists, and target country portals.
            </p>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <span className={`material-symbols-outlined ${styles.checkIcon} ${styles.studyAbroadCheck}`}>
                  check_circle
                </span>
                <span>University Application Tracker</span>
              </div>
              <div className={styles.featureItem}>
                <span className={`material-symbols-outlined ${styles.checkIcon} ${styles.studyAbroadCheck}`}>
                  check_circle
                </span>
                <span>Visa Processing & Stage Pipeline</span>
              </div>
              <div className={styles.featureItem}>
                <span className={`material-symbols-outlined ${styles.checkIcon} ${styles.studyAbroadCheck}`}>
                  check_circle
                </span>
                <span>14+ Country Portals & Checklists</span>
              </div>
            </div>
          </div>

          <button className={`${styles.enterBtn} ${styles.studyAbroadBtn}`}>
            <span>Proceed to Study Abroad Sign In</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>

        {/* Box 2: Foreign Language Wala */}
        <div
          className={`${styles.card} ${styles.foreignLanguageCard}`}
          onClick={() => handleSelect("FOREIGN_LANGUAGE")}
        >
          <div>
            <div className={`${styles.iconContainer} ${styles.foreignLanguageIcon}`}>
              <span className="material-symbols-outlined" style={{ fontSize: "2.4rem" }}>
                translate
              </span>
            </div>

            <h2 className={styles.cardTitle}>Foreign Language Wala</h2>
            <p className={styles.cardDesc}>
              Language Coaching CRM for German, French, Spanish, IELTS & TOEFL prep batches, mock tests, and attendance schedules.
            </p>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <span className={`material-symbols-outlined ${styles.checkIcon} ${styles.foreignLanguageCheck}`}>
                  check_circle
                </span>
                <span>German, French & IELTS Prep</span>
              </div>
              <div className={styles.featureItem}>
                <span className={`material-symbols-outlined ${styles.checkIcon} ${styles.foreignLanguageCheck}`}>
                  check_circle
                </span>
                <span>Batch Rosters & Class Schedules</span>
              </div>
              <div className={styles.featureItem}>
                <span className={`material-symbols-outlined ${styles.featureCheck} ${styles.foreignLanguageCheck}`}>
                  check_circle
                </span>
                <span>Mock Test Scoring & Attendance</span>
              </div>
            </div>
          </div>

          <button className={`${styles.enterBtn} ${styles.foreignLanguageBtn}`}>
            <span>Proceed to Foreign Language Sign In</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>

      <div className={styles.footer}>
        <p>© 2026 Unified Institute CRM Suite • Isolated Multi-Institute Architecture</p>
      </div>
    </div>
  );
}
