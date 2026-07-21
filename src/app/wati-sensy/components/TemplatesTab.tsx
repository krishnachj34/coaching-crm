"use client";

import React, { useState, useTransition } from "react";
import styles from "../styles/styles.module.css";
import { saveTemplate, deleteTemplate, syncMetaTemplates } from "../actions";

interface TemplatesTabProps {
  initialTemplates: any[];
}

export default function TemplatesTab({ initialTemplates }: TemplatesTabProps) {
  const [templates, setTemplates] = useState<any[]>(initialTemplates);
  const [showForm, setShowForm] = useState(false);
  const [tmplName, setTmplName] = useState("");
  const [tmplCategory, setTmplCategory] = useState("MARKETING");
  const [tmplLang, setTmplLang] = useState("en");
  const [tmplHeader, setTmplHeader] = useState("");
  const [tmplBody, setTmplBody] = useState("");
  const [tmplFooter, setTmplFooter] = useState("");
  
  // Buttons
  const [buttons, setButtons] = useState<any[]>([]);

  const [isPending, startTransition] = useTransition();

  const handleAddButton = () => {
    if (buttons.length >= 3) return; // Meta limits quick reply / call to action buttons
    setButtons([...buttons, { type: "QUICK_REPLY", text: "Click Here", value: "" }]);
  };

  const handleRemoveButton = (idx: number) => {
    setButtons(buttons.filter((_, i) => i !== idx));
  };

  const handleButtonChange = (idx: number, field: string, val: string) => {
    setButtons(
      buttons.map((btn, i) => (i === idx ? { ...btn, [field]: val } : btn))
    );
  };

  const handleSave = () => {
    if (!tmplName.trim() || !tmplBody.trim()) return;

    const data = {
      name: tmplName.toLowerCase().replace(/\s+/g, "_"),
      category: tmplCategory,
      language: tmplLang,
      headerText: tmplHeader,
      bodyText: tmplBody,
      footerText: tmplFooter,
      buttons
    };

    startTransition(async () => {
      try {
        const result = await saveTemplate(data);
        if (result.success) {
          setTemplates(result.templates);
          setShowForm(false);
          // Reset
          setTmplName("");
          setTmplHeader("");
          setTmplBody("");
          setTmplFooter("");
          setButtons([]);
        }
      } catch (err) {
        console.error("Failed to save template:", err);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    startTransition(async () => {
      try {
        const result = await deleteTemplate(id);
        if (result.success) {
          setTemplates(result.templates);
        }
      } catch (err) {
        console.error("Failed to delete template:", err);
      }
    });
  };

  const handleSyncMeta = () => {
    startTransition(async () => {
      try {
        const result = await syncMetaTemplates();
        if (result.success) {
          setTemplates(result.templates);
        }
      } catch (err) {
        console.error("Failed to sync templates:", err);
      }
    });
  };

  return (
    <div>
      <div className={styles.flexBetween} style={{ marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "700" }}>WhatsApp Template Manager</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
            Create and manage approved Meta business message templates with custom action buttons.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className={styles.secondaryBtn} onClick={handleSyncMeta}>
            <span className="material-symbols-outlined">sync</span>
            <span>Sync Meta Status</span>
          </button>
          <button className={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>
            <span className="material-symbols-outlined">add</span>
            <span>{showForm ? "Close Builder" : "Create Template"}</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className={styles.broadcastWizard} style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
          {/* Form */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "1rem" }}>
              🛠️ Meta Template Builder
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className={styles.formGroup}>
                <label>Template Name (lowercase, no spaces)</label>
                <input 
                  type="text" 
                  placeholder="e.g. batch_enrollment_confirmation" 
                  value={tmplName}
                  onChange={(e) => setTmplName(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Category</label>
                  <select value={tmplCategory} onChange={(e) => setTmplCategory(e.target.value)}>
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utility</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </select>
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Language</label>
                  <select value={tmplLang} onChange={(e) => setTmplLang(e.target.value)}>
                    <option value="en">English (en)</option>
                    <option value="hi">Hindi (hi)</option>
                    <option value="es">Spanish (es)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Header Text (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Linguist Academy Admissions" 
                  value={tmplHeader}
                  onChange={(e) => setTmplHeader(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Body Text (Use {"{{1}}"}, {"{{2}}"} for custom variables)</label>
                <textarea 
                  placeholder="e.g. Hi {{1}}, your IELTS class starts on {{2}}. Please reach out if you have questions!"
                  value={tmplBody}
                  onChange={(e) => setTmplBody(e.target.value)}
                  style={{ height: "80px" }}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Footer Text (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Reply STOP to opt out" 
                  value={tmplFooter}
                  onChange={(e) => setTmplFooter(e.target.value)}
                />
              </div>

              {/* Dynamic Buttons Editor */}
              <div className={styles.formGroup}>
                <div className={styles.flexBetween}>
                  <label>Interactive Buttons (Max 3)</label>
                  {buttons.length < 3 && (
                    <button 
                      type="button" 
                      style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", cursor: "pointer", border: "1px solid var(--outline)", borderRadius: "4px" }}
                      onClick={handleAddButton}
                    >
                      + Add Button
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {buttons.map((btn, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      <select 
                        value={btn.type}
                        onChange={(e) => handleButtonChange(idx, "type", e.target.value)}
                        style={{ fontSize: "0.75rem", padding: "0.2rem" }}
                      >
                        <option value="QUICK_REPLY">Quick Reply</option>
                        <option value="URL">Visit URL</option>
                        <option value="PHONE">Call Phone</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="Button Text" 
                        value={btn.text} 
                        onChange={(e) => handleButtonChange(idx, "text", e.target.value)}
                        style={{ flex: 1, fontSize: "0.75rem", padding: "0.2rem" }}
                      />
                      {(btn.type === "URL" || btn.type === "PHONE") && (
                        <input 
                          type="text" 
                          placeholder={btn.type === "URL" ? "https://..." : "+91..."} 
                          value={btn.value} 
                          onChange={(e) => handleButtonChange(idx, "value", e.target.value)}
                          style={{ flex: 1.2, fontSize: "0.75rem", padding: "0.2rem" }}
                        />
                      )}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveButton(idx)}
                        style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "1rem" }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button 
                className={styles.primaryBtn} 
                onClick={handleSave}
                disabled={isPending}
              >
                Submit for Meta Approval
              </button>
              <button 
                className={styles.secondaryBtn} 
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Preview Panel */}
          <div style={{ width: "320px" }}>
            <h4 style={{ fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.5rem" }}>
              WhatsApp Mockup Preview
            </h4>
            <div className={styles.whatsappPreview}>
              <div className={styles.previewBubble}>
                {tmplHeader && <div className={styles.previewHeader}>{tmplHeader}</div>}
                <div className={styles.previewBody}>
                  {tmplBody ? tmplBody : "Hi {{1}}, welcome to Linguist center..."}
                </div>
                {tmplFooter && <div className={styles.previewFooter}>{tmplFooter}</div>}
                {buttons.length > 0 && (
                  <div className={styles.previewButtons}>
                    {buttons.map((btn, idx) => (
                      <div key={idx} className={styles.previewBtn}>
                        {btn.type === "URL" ? "🔗 " : btn.type === "PHONE" ? "📞 " : "💬 "}
                        {btn.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of existing templates */}
      <h3 style={{ fontSize: "1rem", fontWeight: "700", margin: "1.5rem 0 0.5rem" }}>
        Active Meta WhatsApp Templates ({templates.length})
      </h3>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Template Name</th>
              <th>Category</th>
              <th>Language</th>
              <th>Body Content</th>
              <th>Approval Status</th>
              <th>Date Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((tmpl) => (
              <tr key={tmpl.id}>
                <td><strong>{tmpl.name}</strong></td>
                <td><span className={styles.badge}>{tmpl.category}</span></td>
                <td>{tmpl.language.toUpperCase()}</td>
                <td style={{ maxWidth: "300px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {tmpl.bodyText}
                </td>
                <td>
                  <span 
                    className={styles.badge}
                    style={{
                      backgroundColor: tmpl.status === "APPROVED" ? "var(--success-container)" : "var(--warning-container)",
                      color: tmpl.status === "APPROVED" ? "var(--success)" : "var(--warning)"
                    }}
                  >
                    ● {tmpl.status}
                  </span>
                </td>
                <td>{new Date(tmpl.createdAt).toLocaleDateString()}</td>
                <td>
                  <button 
                    className={styles.dangerBtn}
                    onClick={() => handleDelete(tmpl.id)}
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }} className={styles.textMuted}>
                  No message templates configured. Click "Create Template" to add one!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
