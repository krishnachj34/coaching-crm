"use client";

import React, { useState, useTransition } from "react";
import styles from "../app/leads/page.module.css";
import { createLead } from "@/app/leads/actions";

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LeadModal({ isOpen, onClose, onSuccess }: LeadModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("");
  const [status, setStatus] = useState("NEW");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState("MANUAL");
  const [trialStartDate, setTrialStartDate] = useState("");
  const [trialEndDate, setTrialEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !phone) {
      setError("Name and Phone number are required.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("interest", interest);
      formData.append("status", status);
      formData.append("notes", notes);
      formData.append("source", source);
      formData.append("trialStartDate", trialStartDate);
      formData.append("trialEndDate", trialEndDate);

      const res = await createLead(formData);

      if (res.error) {
        setError(res.error);
      } else {
        setName("");
        setEmail("");
        setPhone("");
        setInterest("");
        setStatus("NEW");
        setNotes("");
        setSource("MANUAL");
        setTrialStartDate("");
        setTrialEndDate("");
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Register New Lead</h3>
          <button onClick={onClose} className={styles.closeModalButton}>
            ✕
          </button>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="lead-name">Name *</label>
            <input
              id="lead-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className={styles.modalInput}
            />
          </div>

          <div className={styles.formGroupDouble}>
            <div className={styles.formGroup}>
              <label htmlFor="lead-phone">Phone *</label>
              <input
                id="lead-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                className={styles.modalInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="lead-email">Email</label>
              <input
                id="lead-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className={styles.modalInput}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="lead-interest">Course Interest</label>
            <input
              id="lead-interest"
              type="text"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              placeholder="e.g. Mathematics"
              className={styles.modalInput}
            />
          </div>
          <div className={styles.formGroupDouble}>
            <div className={styles.formGroup}>
              <label htmlFor="lead-source">Lead Source</label>
              <select
                id="lead-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className={styles.modalSelect}
              >
                <option value="MANUAL">Manual</option>
                <option value="FACEBOOK_ADS">Facebook Ads</option>
                <option value="INSTAGRAM_ADS">Instagram Ads</option>
                <option value="LINKEDIN_ADS">LinkedIn Ads</option>
                <option value="TRIAL_CLASS">Trial Class</option>
                <option value="SEMINAR">Seminar</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="lead-status">Status</label>
              <select
                id="lead-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={styles.modalSelect}
              >
                <option value="NEW">New</option>
                <option value="TRIAL">Trial</option>
                <option value="CONTACTED">Contacted</option>
                <option value="ENROLLED">Enrolled</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
          </div>

          {status === "TRIAL" && (
            <div className={styles.formGroupDouble}>
              <div className={styles.formGroup}>
                <label htmlFor="trial-start-date">Trial Start Date</label>
                <input
                  id="trial-start-date"
                  type="date"
                  value={trialStartDate}
                  onChange={(e) => setTrialStartDate(e.target.value)}
                  className={styles.modalInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="trial-end-date">Trial End Date</label>
                <input
                  id="trial-end-date"
                  type="date"
                  value={trialEndDate}
                  onChange={(e) => setTrialEndDate(e.target.value)}
                  className={styles.modalInput}
                />
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="lead-notes">Notes</label>
            <textarea
              id="lead-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional information about inquiry..."
              className={styles.modalTextarea}
            />
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={styles.submitButton}
            >
              {isPending ? "Creating..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
