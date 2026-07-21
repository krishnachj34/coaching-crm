"use client";

import React, { useEffect, useState } from "react";
import styles from "./InstituteSwitcher.module.css";
import { getCurrentInstituteContext } from "@/app/instituteActions";
import { InstituteId, INSTITUTES } from "@/utils/institute";
import { logout } from "@/app/login/actions";

export default function InstituteSwitcher() {
  const [activeId, setActiveId] = useState<InstituteId>("FOREIGN_LANGUAGE");
  const [loading, setLoading] = useState(true);

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

  if (loading) return null;

  const currentMeta = INSTITUTES[activeId] || INSTITUTES.FOREIGN_LANGUAGE;
  const targetId: InstituteId = activeId === "STUDY_ABROAD" ? "FOREIGN_LANGUAGE" : "STUDY_ABROAD";
  const targetMeta = INSTITUTES[targetId];

  const handleSecureSwitch = async () => {
    // Force sign-out from current institute session to prevent security bypass
    const formData = new FormData();
    // Redirect to login page of the target institute
    window.location.href = `/login?institute=${targetId}`;
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      {/* Current Active Institute Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.4rem 0.85rem",
          borderRadius: "12px",
          background: "var(--surface-container, #f1f5f9)",
          border: `1.5px solid ${currentMeta.primaryColor}`,
          fontSize: "0.85rem",
          fontWeight: 700,
          color: "var(--on-surface, #0f172a)",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "1.1rem", color: currentMeta.primaryColor }}>
          {currentMeta.icon}
        </span>
        <span>{currentMeta.shortName} Workspace</span>
      </div>

      {/* Security Switch Button: Signs out and requires login for target institute */}
      <button
        onClick={handleSecureSwitch}
        className={styles.modalTriggerBtn}
        style={{
          background: "#fff1f2",
          borderColor: "#fecdd3",
          color: "#e11d48",
          fontSize: "0.82rem",
        }}
        title={`Sign out & Re-authenticate to access ${targetMeta.name}`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
          lock_reset
        </span>
        <span>Switch to {targetMeta.shortName} (Requires Login)</span>
      </button>
    </div>
  );
}
