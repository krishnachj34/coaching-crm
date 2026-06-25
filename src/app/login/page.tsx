"use client";

import React, { useState, useTransition } from "react";
import styles from "./page.module.css";
import { login, signup } from "./actions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAction = async (type: "login" | "signup") => {
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

      if (type === "login") {
        const result = await login(null, formData);
        if (result?.error) {
          setError(result.error);
        }
      } else {
        const result = await signup(null, formData);
        if (result?.error) {
          setError(result.error);
        } else if (result?.success) {
          setSuccess(result.success);
        }
      }
    });
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Coaching CRM</h1>
        <p className={styles.subtitle}>Sign in or create a new coach account</p>

        {error && <div className={styles.errorAlert}>{error}</div>}
        {success && <div className={styles.successAlert}>{success}</div>}

        <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
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

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
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

          <div className={styles.buttonGroup}>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleAction("login")}
              className={styles.primaryButton}
            >
              {isPending ? "Processing..." : "Sign In"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleAction("signup")}
              className={styles.secondaryButton}
            >
              Register Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
