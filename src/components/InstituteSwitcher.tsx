"use client";

import React, { useEffect, useState } from "react";
import styles from "./InstituteSwitcher.module.css";
import { getCurrentInstituteContext, setActiveInstitute } from "@/app/instituteActions";
import { InstituteId, INSTITUTES } from "@/utils/institute";
import { useRouter } from "next/navigation";

export default function InstituteSwitcher() {
  const [activeId, setActiveId] = useState<InstituteId>("FOREIGN_LANGUAGE");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const currentMeta = INSTITUTES[activeId] || INSTITUTES.FOREIGN_LANGUAGE;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <button
        onClick={() => router.push("/portal-select")}
        className={styles.modalTriggerBtn}
        title="Return to 2-Box Chooser Landing Page"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "1.1rem", color: currentMeta.primaryColor }}
        >
          grid_view
        </span>
        <span>Switch Institute Box</span>
      </button>

      <div className={styles.container}>
        <span className="material-symbols-outlined" style={{ fontSize: "1.1rem", color: currentMeta.primaryColor }}>
          {currentMeta.icon}
        </span>
        <select value={activeId} onChange={handleChange} className={styles.select}>
          <option value="STUDY_ABROAD">🎓 Study Abroad Wala</option>
          <option value="FOREIGN_LANGUAGE">🗣️ Foreign Language Wala</option>
        </select>
      </div>
    </div>
  );
}
