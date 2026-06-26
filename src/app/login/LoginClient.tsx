"use client";

import React, { useState, useTransition } from "react";
import styles from "./page.module.css";
import { login } from "./actions";

interface LoginClientProps {
  errorParam?: string;
}

export default function LoginClient({ errorParam }: LoginClientProps) {
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
        {/* Logo mark */}
        <div className={styles.logoMark}>
          <span className="material-symbols-outlined" style={{ fontSize: "1.6rem", color: "#fff" }}>school</span>
        </div>

        <h1 className={styles.title}>Coaching CRM</h1>
        <p className={styles.subtitle}>Sign in to your coaching dashboard</p>

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
                placeholder="coach@example.com"
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
            <button type="button" disabled={isPending} onClick={handleAction} className={styles.primaryButton}>
              {isPending ? "Processing..." : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
