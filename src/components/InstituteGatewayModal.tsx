"use client";

import React, { useEffect, useState } from "react";
import styles from "./InstituteGatewayModal.module.css";
import { setActiveInstitute, getInstituteOverviewStats } from "@/app/instituteActions";
import { InstituteId } from "@/utils/institute";

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  currentActive?: InstituteId;
}

export default function InstituteGatewayModal({ isOpen, onClose, currentActive }: Props) {
  const [stats, setStats] = useState<{
    STUDY_ABROAD: { leadsCount: number; studentsCount: number; activeBatches: number; countriesCount: number };
    FOREIGN_LANGUAGE: { leadsCount: number; studentsCount: number; activeBatches: number; languagesCount: number };
  } | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getInstituteOverviewStats().then(setStats);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = async (id: InstituteId) => {
    setLoading(true);
    await setActiveInstitute(id);
    if (onClose) onClose();
    window.location.reload();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalContent}>
        {onClose && (
          <button onClick={onClose} className={styles.closeButton} aria-label="Close modal">
            <span className="material-symbols-outlined">close</span>
          </button>
        )}

        <div className={styles.header}>
          <div className={styles.badge}>
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>domain</span>
            <span>Multi-Institute CRM Hub</span>
          </div>
          <h1 className={styles.title}>Select Your Institute CRM Portal</h1>
          <p className={styles.subtitle}>
            Choose an institute workspace below to switch your views, data, and management suite.
          </p>
        </div>

        <div className={styles.grid}>
          {/* Box 1: Study Abroad Wala */}
          <div
            className={`${styles.card} ${styles.studyAbroadCard}`}
            onClick={() => handleSelect("STUDY_ABROAD")}
          >
            <div>
              <div className={styles.cardHeader}>
                <div className={`${styles.iconWrapper} ${styles.studyAbroadIcon}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>
                    flight_takeoff
                  </span>
                </div>
                {currentActive === "STUDY_ABROAD" && (
                  <span className={styles.activeTag}>
                    <span className="material-symbols-outlined" style={{ fontSize: "0.85rem" }}>
                      check_circle
                    </span>
                    Active Workspace
                  </span>
                )}
              </div>

              <h2 className={styles.cardTitle}>Study Abroad Wala</h2>
              <p className={styles.cardDescription}>
                Overseas Education CRM for university admissions, visa tracking, SOP checklists, and target country portals.
              </p>

              <div className={styles.featureList}>
                <div className={styles.featureItem}>
                  <span className={`material-symbols-outlined ${styles.featureCheck}`}>check_circle</span>
                  <span>14+ Target Countries & University Finder</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={`material-symbols-outlined ${styles.featureCheck}`}>check_circle</span>
                  <span>Visa Application Stage Tracker</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={`material-symbols-outlined ${styles.featureCheck}`}>check_circle</span>
                  <span>SOP / Passport Document Checklist</span>
                </div>
              </div>
            </div>

            <div>
              <div className={styles.statRow}>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{stats?.STUDY_ABROAD.leadsCount ?? "--"}</div>
                  <div className={styles.statLabel}>Overseas Applicants</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{stats?.STUDY_ABROAD.countriesCount ?? "14"}</div>
                  <div className={styles.statLabel}>Target Countries</div>
                </div>
              </div>

              <button className={`${styles.actionButton} ${styles.studyAbroadButton}`}>
                <span>Enter Study Abroad CRM</span>
                <span className="material-symbols-outlined">east</span>
              </button>
            </div>
          </div>

          {/* Box 2: Foreign Language Wala */}
          <div
            className={`${styles.card} ${styles.foreignLanguageCard}`}
            onClick={() => handleSelect("FOREIGN_LANGUAGE")}
          >
            <div>
              <div className={styles.cardHeader}>
                <div className={`${styles.iconWrapper} ${styles.foreignLanguageIcon}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>
                    translate
                  </span>
                </div>
                {currentActive === "FOREIGN_LANGUAGE" && (
                  <span className={styles.activeTag}>
                    <span className="material-symbols-outlined" style={{ fontSize: "0.85rem" }}>
                      check_circle
                    </span>
                    Active Workspace
                  </span>
                )}
              </div>

              <h2 className={styles.cardTitle}>Foreign Language Wala</h2>
              <p className={styles.cardDescription}>
                Language Coaching CRM for German, French, Spanish, IELTS, TOEFL batches, mock tests, and class schedules.
              </p>

              <div className={styles.featureList}>
                <div className={styles.featureItem}>
                  <span className={`material-symbols-outlined ${styles.featureCheck}`}>check_circle</span>
                  <span>German, French, Spanish & IELTS Prep</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={`material-symbols-outlined ${styles.featureCheck}`}>check_circle</span>
                  <span>Batch Rosters & Live Class Schedules</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={`material-symbols-outlined ${styles.featureCheck}`}>check_circle</span>
                  <span>Mock Test Scoring & Attendance</span>
                </div>
              </div>
            </div>

            <div>
              <div className={styles.statRow}>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{stats?.FOREIGN_LANGUAGE.leadsCount ?? "--"}</div>
                  <div className={styles.statLabel}>Active Students</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{stats?.FOREIGN_LANGUAGE.activeBatches ?? "15"}</div>
                  <div className={styles.statLabel}>Language Batches</div>
                </div>
              </div>

              <button className={`${styles.actionButton} ${styles.foreignLanguageButton}`}>
                <span>Enter Foreign Language CRM</span>
                <span className="material-symbols-outlined">east</span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.globalFooter}>
          <button className={styles.globalButton} onClick={() => handleSelect("ALL")}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>
              hub
            </span>
            <span>Switch to Combined Global View (All Institutes)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
