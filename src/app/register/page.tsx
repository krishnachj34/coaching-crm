"use client";

import React, { useState, useTransition } from "react";
import styles from "../login/page.module.css";
import { signup } from "../login/actions";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRegister = async () => {
    setError(null);
    setSuccess(null);
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      
      const result = await signup(null, formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(result.success);
      }
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
        <p className={styles.subtitle}>Create a new staff or coach account</p>

        {error && <div className={styles.errorAlert}><span className="material-symbols-outlined" style={{fontSize:"1rem"}}>error</span>{error}</div>}
        {success && <div className={styles.successAlert}>{success}</div>}

        <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <div className={styles.inputWrap}>
              <span className={`${styles.inputIcon} material-symbols-outlined`}>mail</span>
              <input
                id="email" type="email" value={email}
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
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button type="button" disabled={isPending} onClick={handleRegister} className={styles.primaryButton}>
              {isPending ? "Creating Account..." : "Create Account"}
            </button>
          </div>

          <div className={styles.footerLink}>
            Already have an account? <a href="/login" className={styles.linkText}>Sign In</a>
          </div>
        </form>
      </div>
    </div>
  );
}
