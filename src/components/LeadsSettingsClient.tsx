"use client";

import React, { useState, useEffect, useTransition } from "react";
import Sidebar from "@/components/Sidebar";
import styles from "../app/leads/settings/page.module.css";
import modalStyles from "../app/students/page.module.css";
import { useRouter } from "next/navigation";
import { updateMetaSettings } from "@/app/leads/settings/actions";

interface MetaSettings {
  id: string;
  enabled: boolean;
  accessToken: string | null;
  pageId: string | null;
  verifyToken: string;
  fieldsMapping?: any;
}

interface LeadsSettingsClientProps {
  initialSettings: MetaSettings | null;
  errorMsg?: string;
}

export default function LeadsSettingsClient({ initialSettings, errorMsg }: LeadsSettingsClientProps) {
  const [enabled, setEnabled] = useState(initialSettings?.enabled ?? false);
  const [verifyToken, setVerifyToken] = useState(initialSettings?.verifyToken ?? "coaching_crm_secret_token");
  const [accessToken, setAccessToken] = useState(initialSettings?.accessToken ?? "");
  const [pageId, setPageId] = useState(initialSettings?.pageId ?? "");
  const [fieldsMapping, setFieldsMapping] = useState<Record<string, string>>(() => {
    const defaultMapping = {
      name: "full_name",
      phone: "phone_number",
      email: "email",
      interest: "course_interest",
      message: "message"
    };
    return (initialSettings as any)?.fieldsMapping || defaultMapping;
  });
  
  const [webhookUrl, setWebhookUrl] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(errorMsg || null);
  const [isPending, startTransition] = useTransition();
  const [oauthLoading, setOauthLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/webhooks/meta`);
    }
  }, []);

  const startSimulatedOAuth = () => {
    setOauthLoading(true);
    setSuccess(null);
    setFormError(null);
    
    // Simulate interactive OAuth flow popup
    setTimeout(() => {
      const mockToken = "EAAGzDxeH12sBAO" + Math.random().toString(36).substring(2, 15).toUpperCase() + "xyzMetaToken";
      const mockPageId = "fb_page_" + Math.floor(100000000 + Math.random() * 900000000);
      setAccessToken(mockToken);
      setPageId(mockPageId);
      setOauthLoading(false);
      setSuccess("Simulated Meta OAuth authentication successful! Connected to Facebook Business Page.");
    }, 1500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setFormError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("enabled", enabled ? "true" : "false");
      formData.append("verifyToken", verifyToken);
      formData.append("accessToken", accessToken);
      formData.append("pageId", pageId);
      formData.append("fieldsMapping", JSON.stringify(fieldsMapping));

      const res = await updateMetaSettings(formData);
      if (res.error) {
        setFormError(res.error);
      } else {
        setSuccess("Meta Integration Settings updated successfully!");
        router.refresh();
      }
    });
  };

  return (
    <div className={styles.container}>
      <Sidebar currentPhase={8} />

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <a href="/leads" style={{ display: "flex", alignItems: "center", color: "var(--text-muted)", textDecoration: "none" }}>
                <span className="material-symbols-outlined">arrow_back</span>
              </a>
              <h1>Social Lead Integration</h1>
            </div>
            <p>Automate lead capture from Facebook Lead Ads and Instagram Direct inquiries via webhooks.</p>
          </div>
        </header>

        {success && <div className={styles.successAlert}>{success}</div>}
        {formError && <div className={styles.errorAlert}>{formError}</div>}

        <div className={styles.settingsGrid}>
          {/* Form Side */}
          <div className={styles.settingsCard}>
            <h3>Meta Webhook Settings</h3>
            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.formGroup}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.5rem 0" }}>
                  <input
                    id="integration-enabled"
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }}
                  />
                  <label htmlFor="integration-enabled" style={{ fontWeight: "700", cursor: "pointer", fontSize: "0.9rem" }}>
                    Enable Meta Webhook Integration
                  </label>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Callback URL (Read-only)</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className={styles.inputReadOnly}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      alert("Webhook Callback URL copied to clipboard!");
                    }}
                    className={styles.copyBtn}
                  >
                    Copy
                  </button>
                </div>
                <span className={styles.inputHelp}>Enter this URL in Meta Developer App's Webhooks setup page.</span>
              </div>

              <div className={styles.formGroup}>
                <label>Verify Token *</label>
                <input
                  type="text"
                  required
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  placeholder="coaching_crm_secret_token"
                  className={styles.input}
                />
                <span className={styles.inputHelp}>Must match the Verify Token value you register in the Meta Console.</span>
              </div>

              <div className={styles.formGroup} style={{ borderTop: "1px solid var(--outline-variant)", paddingTop: "1rem", marginTop: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label style={{ margin: 0 }}>Meta Authentication OAuth</label>
                  <button
                    type="button"
                    disabled={oauthLoading}
                    onClick={startSimulatedOAuth}
                    className={styles.copyBtn}
                    style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary-fixed-dim)", padding: "0.35rem 0.75rem", cursor: "pointer" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>link</span>
                    {oauthLoading ? "Connecting..." : "Connect Facebook Account"}
                  </button>
                </div>
                <span className={styles.inputHelp} style={{ display: "block", marginBottom: "1rem" }}>
                  Authenticate directly using your Meta Business Suite credentials.
                </span>
              </div>

              <div className={styles.formGroup}>
                <label>Page Access Token</label>
                <textarea
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Simulated access token will appear here after authentication..."
                  className={styles.textarea}
                  rows={3}
                />
                <span className={styles.inputHelp}>Required to fetch full Lead Ad details via Meta Graph API.</span>
              </div>

              <div className={styles.formGroup}>
                <label>Facebook Page ID</label>
                <input
                  type="text"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  placeholder="e.g. 104857291048"
                  className={styles.input}
                />
                <span className={styles.inputHelp}>The unique ID of the Facebook page running the Lead Ads.</span>
              </div>

              {/* Fields Mapping UI */}
              <div className={styles.formGroup} style={{ borderTop: "1px solid var(--outline-variant)", paddingTop: "1rem", marginTop: "1rem" }}>
                <label style={{ marginBottom: "0.5rem", display: "block" }}>Meta Form Fields Mapping</label>
                <div style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)", padding: "1rem", borderRadius: "var(--radius)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: "700" }}>CRM Lead Field</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: "700" }}>Facebook Form Field Key</span>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", alignItems: "center", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: "600", margin: 0 }}>Full Name:</label>
                    <input
                      type="text"
                      value={fieldsMapping.name}
                      onChange={(e) => setFieldsMapping({ ...fieldsMapping, name: e.target.value })}
                      placeholder="e.g. full_name"
                      className={styles.input}
                      style={{ padding: "0.35rem 0.5rem", fontSize: "0.8rem" }}
                    />
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", alignItems: "center", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: "600", margin: 0 }}>Phone Number:</label>
                    <input
                      type="text"
                      value={fieldsMapping.phone}
                      onChange={(e) => setFieldsMapping({ ...fieldsMapping, phone: e.target.value })}
                      placeholder="e.g. phone_number"
                      className={styles.input}
                      style={{ padding: "0.35rem 0.5rem", fontSize: "0.8rem" }}
                    />
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", alignItems: "center", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: "600", margin: 0 }}>Email Address:</label>
                    <input
                      type="text"
                      value={fieldsMapping.email}
                      onChange={(e) => setFieldsMapping({ ...fieldsMapping, email: e.target.value })}
                      placeholder="e.g. email"
                      className={styles.input}
                      style={{ padding: "0.35rem 0.5rem", fontSize: "0.8rem" }}
                    />
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", alignItems: "center", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: "600", margin: 0 }}>Course Interest:</label>
                    <input
                      type="text"
                      value={fieldsMapping.interest}
                      onChange={(e) => setFieldsMapping({ ...fieldsMapping, interest: e.target.value })}
                      placeholder="e.g. course_interest"
                      className={styles.input}
                      style={{ padding: "0.35rem 0.5rem", fontSize: "0.8rem" }}
                    />
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", alignItems: "center", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: "600", margin: 0 }}>Message / Notes:</label>
                    <input
                      type="text"
                      value={fieldsMapping.message}
                      onChange={(e) => setFieldsMapping({ ...fieldsMapping, message: e.target.value })}
                      placeholder="e.g. message"
                      className={styles.input}
                      style={{ padding: "0.35rem 0.5rem", fontSize: "0.8rem" }}
                    />
                  </div>
                </div>
                <span className={styles.inputHelp}>Define the form field keys from Meta Lead Ads that map to each lead entry parameter.</span>
              </div>

              <div className={styles.footerRow}>
                <button type="submit" disabled={isPending} className={styles.saveBtn}>
                  {isPending ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>

          {/* Guidelines / Help Side */}
          <div className={styles.helpCard}>
            <h3>Meta Developer Configuration Guide</h3>
            <p>Follow these steps to link Facebook & Instagram lead forms to this CRM:</p>
            <ol className={styles.stepsList}>
              <li>
                <strong>Create a Meta Developer App</strong>: Go to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer">Meta Developers</a> and create a Business App.
              </li>
              <li>
                <strong>Add Webhooks Product</strong>: Inside your app setup, add the <strong>Webhooks</strong> product.
              </li>
              <li>
                <strong>Subscribe to Leadgen</strong>: Choose the <strong>Page</strong> object from the dropdown, click <strong>Subscribe to this object</strong>, paste the Callback URL and Verify Token, and save.
              </li>
              <li>
                <strong>Subscribe to Fields</strong>: In the page subscriptions table, subscribe to the <code>leadgen</code> field.
              </li>
              <li>
                <strong>Connect OAuth / Access Token</strong>: Generate a permanent Page Access Token with <code>pages_show_list</code>, <code>pages_manage_ads</code>, and <code>leads_retrieval</code> permissions, and paste it here.
              </li>
            </ol>
            <div style={{ background: "var(--primary-light)", border: "1px solid var(--primary-fixed-dim)", padding: "0.875rem", borderRadius: "var(--radius)", fontSize: "0.8rem", color: "var(--on-surface-variant)", marginTop: "1rem" }}>
              <strong>Testing Tip:</strong> Use Meta's <a href="https://developers.facebook.com/tools/lead-ads-testing" target="_blank" rel="noreferrer">Lead Ads Testing Tool</a> to submit simulated leads and verify real-time capture instantly!
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
