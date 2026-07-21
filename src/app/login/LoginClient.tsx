"use client";

import React, { useState, useTransition } from "react";
import styles from "./page.module.css";
import { login } from "./actions";
import { INSTITUTES, InstituteId } from "@/utils/institute";
import { setActiveInstitute } from "@/app/instituteActions";

interface LoginClientProps {
  errorParam?: string;
  instituteParam?: string;
}

export default function LoginClient({ errorParam, instituteParam }: LoginClientProps) {
  const activeId: InstituteId =
    instituteParam === "STUDY_ABROAD" ? "STUDY_ABROAD" : "FOREIGN_LANGUAGE";

  const meta = INSTITUTES[activeId];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    errorParam === "profile_not_found"
      ? "Your account does not have a profile. Please contact an administrator."
      : errorParam === "account_disabled"
      ? "Your account has been deactivated. Please contact an administrator."
      : errorParam
      ? decodeURIComponent(errorParam)
      : null
  );
  const [isPending, startTransition] = useTransition();

  const handleAction = async () => {
    setError(null);
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    startTransition(async () => {
      // Set active institute cookie for the session
      await setActiveInstitute(activeId);

      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      const result = await login(null, formData);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <a
            href="/portal-select"
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "#64748b",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>arrow_back</span>
            <span>Switch Institute Box</span>
          </a>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "0.25rem 0.65rem",
              borderRadius: "9999px",
              background: activeId === "STUDY_ABROAD" ? "#e0f2fe" : "#eef2ff",
              color: meta.primaryColor,
            }}
          >
            {meta.badge}
          </span>
        </div>

        {/* Dynamic Logo Mark */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: meta.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            marginBottom: "1rem",
            boxShadow: `0 8px 20px ${activeId === "STUDY_ABROAD" ? "rgba(14,165,233,0.3)" : "rgba(79,70,229,0.3)"}`,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "2.2rem" }}>
            {meta.icon}
          </span>
        </div>

        <h1 className={styles.title}>{meta.name}</h1>
        <p className={styles.subtitle}>{meta.tagline}</p>

        {error && (
          <div className={styles.errorAlert}>
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>error</span>
            {error}
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <div className={styles.inputWrap}>
              <span className={`${styles.inputIcon} material-symbols-outlined`}>mail</span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="staff@example.com"
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={styles.inputWrap}>
              <span className={`${styles.inputIcon} material-symbols-outlined`}>lock</span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              disabled={isPending}
              onClick={handleAction}
              className={styles.primaryButton}
              style={{ background: meta.gradient }}
            >
              {isPending ? "Signing in..." : `Sign In to ${meta.shortName}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
