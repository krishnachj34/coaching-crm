"use client";

import React, { useEffect, useState } from "react";
import styles from "./InstituteSwitcher.module.css";
import { getCurrentInstituteContext, setActiveInstitute } from "@/app/instituteActions";
import { InstituteId, INSTITUTES } from "@/utils/institute";
import InstituteGatewayModal from "./InstituteGatewayModal";

export default function InstituteSwitcher() {
  const [activeId, setActiveId] = useState<InstituteId>("ALL");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const ctx = await getCurrentInstituteContext();
        setActiveId(ctx.activeInstituteId);
      } catch (e) {
        console.error("Failed to load institute context:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as InstituteId;
    setActiveId(val);
    await setActiveInstitute(val);
    window.location.reload();
  };

  if (loading) return null;

  const currentMeta = INSTITUTES[activeId] || INSTITUTES.ALL;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button
          onClick={() => setModalOpen(true)}
          className={styles.modalTriggerBtn}
          title="Open Institute Portal Gateway"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "1.1rem", color: currentMeta.primaryColor }}
          >
            {currentMeta.icon}
          </span>
          <span>{currentMeta.shortName}</span>
          <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "#64748b" }}>
            grid_view
          </span>
        </button>

        <div className={styles.container}>
          <span className="material-symbols-outlined" style={{ fontSize: "1.1rem", color: currentMeta.primaryColor }}>
            unfold_more
          </span>
          <select value={activeId} onChange={handleChange} className={styles.select}>
            <option value="STUDY_ABROAD">✈️ Study Abroad Wala</option>
            <option value="FOREIGN_LANGUAGE">🗣️ Foreign Language Wala</option>
            <option value="ALL">🌐 All Institutes (Global View)</option>
          </select>
        </div>
      </div>

      <InstituteGatewayModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentActive={activeId}
      />
    </>
  );
}
