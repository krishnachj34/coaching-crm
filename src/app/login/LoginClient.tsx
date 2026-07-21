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
        <img 
          src="https://media-bom2-3.cdn.whatsapp.net/v/t61.24694-24/626529755_25544422018569200_8454774622390840168_n.jpg?ccb=11-4&oh=01_Q5Aa5AENapT3jJXByAF0XBx-LAa4CsoD752VfseL4H_SWXZ5EQ&oe=6A5CD8C5&_nc_sid=5e03e0&_nc_cat=111" 
          alt="Foreign Language Wala Logo" 
          style={{ width: 60, height: 60, borderRadius: 16, objectFit: "cover", marginBottom: "1rem", boxShadow: "0 4px 12px rgba(79,70,229,0.15)" }}
        />

        <h1 className={styles.title}>Foreign Language Wala</h1>
        <p className={styles.subtitle}>Sign in to your foreign language academy dashboard</p>

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
