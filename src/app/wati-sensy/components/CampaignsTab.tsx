"use client";

import React, { useState, useTransition } from "react";
import styles from "../styles/styles.module.css";
import { launchCampaign, saveDripSequence, deleteDripSequence, enrollContactInDrip } from "../actions";

interface CampaignsTabProps {
  initialCampaigns: any[];
  templates: any[];
  chatMetadata: any;
  dripSequences?: any[];
}

export default function CampaignsTab({ 
  initialCampaigns, 
  templates, 
  chatMetadata,
  dripSequences = []
}: CampaignsTabProps) {
  const [campaigns, setCampaigns] = useState<any[]>(initialCampaigns);
  const [drips, setDrips] = useState<any[]>(dripSequences);
  
  const [activeSubTab, setActiveSubTab] = useState("broadcasts"); // broadcasts, drips
  const [showWizard, setShowWizard] = useState(false);
  const [campName, setCampName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("ALL_LEADS");
  
  // Audits modal
  const [auditCampaign, setAuditCampaign] = useState<any | null>(null);

  // Drip Sequence Builder inputs
  const [showDripForm, setShowDripForm] = useState(false);
  const [dripName, setDripName] = useState("");
  const [dripSteps, setDripSteps] = useState<any[]>([]);

  // Drip Enroll inputs
  const [dripEnrollPhone, setDripEnrollPhone] = useState("");
  const [selectedDripId, setSelectedDripId] = useState("");

  const [isPending, startTransition] = useTransition();

  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    Object.values(chatMetadata).forEach((meta: any) => {
      if (meta.tags) {
        meta.tags.forEach((tag: string) => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  }, [chatMetadata]);

  const activeTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleLaunch = () => {
    if (!campName.trim() || !selectedTemplateId) return;

    startTransition(async () => {
      try {
        const result = await launchCampaign(campName.trim(), selectedTemplateId, selectedSegment);
        if (result.success) {
          setCampaigns(result.campaigns);
          setShowWizard(false);
          setCampName("");
          setSelectedTemplateId("");
        }
      } catch (err) {
        console.error("Failed to launch campaign:", err);
      }
    });
  };

  // Drip builder actions
  const handleAddDripStep = () => {
    if (templates.length === 0) return;
    setDripSteps([
      ...dripSteps,
      { id: "step_" + Date.now(), templateId: templates[0].id, delayDays: dripSteps.length + 1, description: "Nudge message" }
    ]);
  };

  const handleRemoveDripStep = (id: string) => {
    setDripSteps(dripSteps.filter(s => s.id !== id));
  };

  const handleDripStepChange = (id: string, field: string, value: any) => {
    setDripSteps(
      dripSteps.map(s => s.id === id ? { ...s, [field]: value } : s)
    );
  };

  const handleSaveDrip = () => {
    if (!dripName.trim() || dripSteps.length === 0) return;
    
    const payload = {
      name: dripName.trim(),
      active: true,
      steps: dripSteps
    };

    startTransition(async () => {
      try {
        const result = await saveDripSequence(payload);
        if (result.success) {
          setDrips(result.dripSequences);
          setShowDripForm(false);
          setDripName("");
          setDripSteps([]);
        }
      } catch (err) {
        console.error("Failed to save drip sequence:", err);
      }
    });
  };

  const handleEnrollInDrip = () => {
    if (!dripEnrollPhone.trim() || !selectedDripId) return;

    startTransition(async () => {
      try {
        const result = await enrollContactInDrip(dripEnrollPhone, selectedDripId);
        if (result.success) {
          setDrips(result.dripSequences);
          setDripEnrollPhone("");
          alert("Contact enrolled in Drip Marketing sequence successfully!");
        }
      } catch (err) {
        console.error("Failed to enroll contact:", err);
      }
    });
  };

  const handleDeleteDrip = (id: string) => {
    if (!confirm("Delete this drip nurturing sequence?")) return;
    startTransition(async () => {
      const result = await deleteDripSequence(id);
      if (result.success) {
        setDrips(result.dripSequences);
      }
    });
  };

  const totalKPIs = React.useMemo(() => {
    let sent = 0;
    let delivered = 0;
    let read = 0;
    let replied = 0;
    let clicked = 0;

    campaigns.forEach((c) => {
      sent += c.sentCount || 0;
      delivered += c.deliveredCount || 0;
      read += c.readCount || 0;
      replied += c.repliedCount || 0;
      clicked += c.clickedCount || 0;
    });

    const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 100;
    const readRate = delivered > 0 ? Math.round((read / delivered) * 100) : 0;
    const replyRate = read > 0 ? Math.round((replied / read) * 100) : 0;

    return { sent, delivered, read, replied, clicked, deliveryRate, readRate, replyRate };
  }, [campaigns]);

  return (
    <div>
      <div className={styles.flexBetween} style={{ marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Broadcasts &amp; Nurturing Suite</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
            Configure template broadcasts or setup drip automation flows to nudge contacts.
          </p>
        </div>
      </div>

      {/* Sub tabs */}
      <div className={styles.filterTabs} style={{ marginBottom: "1.5rem", maxWidth: "350px" }}>
        <button 
          className={`${styles.filterBtn} ${activeSubTab === "broadcasts" ? styles.activeFilterBtn : ""}`}
          onClick={() => setActiveSubTab("broadcasts")}
        >
          One-Time Broadcasts
        </button>
        <button 
          className={`${styles.filterBtn} ${activeSubTab === "drips" ? styles.activeFilterBtn : ""}`}
          onClick={() => setActiveSubTab("drips")}
        >
          Drip sequences ({drips.length})
        </button>
      </div>

      {/* TAB CONTENT: Broadcasts */}
      {activeSubTab === "broadcasts" && (
        <>
          {/* KPI Cards */}
          <div className={styles.kpiGrid}>
            <div className={styles.card}>
              <span className={styles.kpiLabel}>Total Campaigns Sent</span>
              <h3 className={styles.kpiVal}>{totalKPIs.sent}</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--success)" }}>
                Delivered Rate: {totalKPIs.deliveryRate}%
              </span>
            </div>
            <div className={styles.card}>
              <span className={styles.kpiLabel}>Open Rate (Read)</span>
              <h3 className={styles.kpiVal}>{totalKPIs.readRate}%</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {totalKPIs.read} Unique readers
              </span>
            </div>
            <div className={styles.card}>
              <span className={styles.kpiLabel}>Replies Received</span>
              <h3 className={styles.kpiVal}>{totalKPIs.replied}</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--success)" }}>
                Reply engagement: {totalKPIs.replyRate}%
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <button className={styles.primaryBtn} onClick={() => {
              setShowWizard(!showWizard);
              if (templates.length > 0 && !selectedTemplateId) {
                setSelectedTemplateId(templates[0].id);
              }
            }}>
              <span className="material-symbols-outlined">add</span>
              <span>Launch Campaign Broadcast</span>
            </button>
          </div>

          {showWizard && (
            <div className={styles.broadcastWizard}>
              <h3 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "1rem" }}>
                🚀 Launch Broadcast Campaign
              </h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Campaign Name</label>
                  <input type="text" placeholder="IELTS Demo Invite" value={campName} onChange={(e) => setCampName(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Target Segment</label>
                  <select value={selectedSegment} onChange={(e) => setSelectedSegment(e.target.value)}>
                    <option value="ALL_LEADS">All Leads</option>
                    <option value="ENROLLED_STUDENTS">Enrolled Students</option>
                    {allTags.map(tag => (
                      <option key={tag} value={`TAG:${tag}`}>Tag: {tag}</option>
                    ))}
                    <option value="SMART:smart_1">Smart List: Target Band 8.0+</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Select Template</label>
                  <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                    {templates.map(tmpl => (
                      <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeTemplate && (
                <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginTop: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: "0.85rem", fontWeight: "700" }}>Variables Preview</h4>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {"{{1}}"} will auto-map to client name. Other variables are parsed automatically.
                    </p>
                  </div>
                  <div style={{ width: "320px" }}>
                    <div className={styles.whatsappPreview}>
                      <div className={styles.previewBubble}>
                        {activeTemplate.headerText && <div className={styles.previewHeader}>{activeTemplate.headerText}</div>}
                        <div className={styles.previewBody}>{activeTemplate.bodyText.replace("{{1}}", "Aman")}</div>
                        {activeTemplate.footerText && <div className={styles.previewFooter}>{activeTemplate.footerText}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button className={styles.primaryBtn} onClick={handleLaunch} disabled={isPending}>
                  Send Broadcast
                </button>
                <button className={styles.secondaryBtn} onClick={() => setShowWizard(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* List Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Segment</th>
                  <th>Sent</th>
                  <th>Delivered</th>
                  <th>Read</th>
                  <th>Replies</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((camp) => (
                  <tr key={camp.id}>
                    <td><strong>{camp.name}</strong></td>
                    <td><span className={styles.badge}>{camp.targetSegment}</span></td>
                    <td>{camp.sentCount}</td>
                    <td>{camp.deliveredCount}</td>
                    <td>{camp.readCount}</td>
                    <td>{camp.repliedCount}</td>
                    <td>
                      <button 
                        className={styles.secondaryBtn}
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                        onClick={() => setAuditCampaign(camp)}
                      >
                        🔍 Recipient Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recipient Audit Log Modal */}
          {auditCampaign && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
              <div className={styles.card} style={{ width: "650px", maxHeight: "80vh", overflowY: "auto", position: "relative" }}>
                <div className={styles.flexBetween} style={{ marginBottom: "1rem" }}>
                  <h3 style={{ fontWeight: "bold" }}>Campaign Recipients Audit: {auditCampaign.name}</h3>
                  <button 
                    style={{ border: "none", background: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--foreground)" }} 
                    onClick={() => setAuditCampaign(null)}
                  >
                    ×
                  </button>
                </div>
                
                <div className={styles.tableWrapper} style={{ marginTop: 0 }}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Recipient Name</th>
                        <th>Phone</th>
                        <th>Delivery Status</th>
                        <th>Timestamp Log</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(auditCampaign.recipients || []).map((rec: any, idx: number) => (
                        <tr key={idx}>
                          <td>{rec.name}</td>
                          <td>+{rec.phone}</td>
                          <td>
                            <span 
                              className={styles.badge}
                              style={{
                                backgroundColor: rec.status === "READ" ? "#d1fae5" : rec.status === "DELIVERED" ? "#e0f2fe" : "#f1f5f9",
                                color: rec.status === "READ" ? "#065f46" : rec.status === "DELIVERED" ? "#0369a1" : "#475569"
                              }}
                            >
                              {rec.status}
                            </span>
                          </td>
                          <td>{new Date(rec.time).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB CONTENT: Drips */}
      {activeSubTab === "drips" && (
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          {/* Enroll sidebar */}
          <div style={{ width: "280px" }} className={styles.card}>
            <h4 style={{ fontWeight: "bold", marginBottom: "1rem" }}>Enroll Lead in Nurturing</h4>
            <div className={styles.formGroup} style={{ marginBottom: "1rem" }}>
              <label>Select Sequence</label>
              <select value={selectedDripId} onChange={(e) => setSelectedDripId(e.target.value)}>
                <option value="">Choose Drip...</option>
                {drips.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup} style={{ marginBottom: "1.25rem" }}>
              <label>Contact Phone Number</label>
              <input type="text" placeholder="919876543210" value={dripEnrollPhone} onChange={(e) => setDripEnrollPhone(e.target.value)} />
            </div>
            <button className={styles.primaryBtn} style={{ width: "100%", justifyContent: "center" }} onClick={handleEnrollInDrip} disabled={isPending}>
              Enroll Contact
            </button>
          </div>

          {/* Drip List Workspace */}
          <div style={{ flex: 1, minWidth: "350px" }}>
            <div className={styles.flexBetween} style={{ marginBottom: "1rem" }}>
              <h4 style={{ fontWeight: "bold" }}>Nurturing Sequences Creator</h4>
              <button className={styles.secondaryBtn} onClick={() => {
                setShowDripForm(!showDripForm);
                if (templates.length > 0) setDripSteps([{ id: "step_1", templateId: templates[0].id, delayDays: 1, description: "Day 1 Follow up" }]);
              }}>
                {showDripForm ? "Cancel Builder" : "Create Sequence"}
              </button>
            </div>

            {showDripForm && (
              <div className={styles.broadcastWizard}>
                <div className={styles.formGroup} style={{ marginBottom: "1rem" }}>
                  <label>Sequence Name</label>
                  <input type="text" placeholder="e.g. Inactive Leads Drip" value={dripName} onChange={(e) => setDripName(e.target.value)} />
                </div>
                
                <h5 style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Steps Timeline</h5>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {dripSteps.map((step, idx) => (
                    <div key={step.id} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Step {idx + 1}:</span>
                      <select 
                        value={step.templateId}
                        onChange={(e) => handleDripStepChange(step.id, "templateId", e.target.value)}
                        style={{ fontSize: "0.75rem", padding: "0.25rem" }}
                      >
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <input 
                        type="number" 
                        placeholder="Delay (Days)"
                        value={step.delayDays}
                        onChange={(e) => handleDripStepChange(step.id, "delayDays", parseInt(e.target.value) || 0)}
                        style={{ width: "80px", fontSize: "0.75rem", padding: "0.25rem" }}
                      />
                      <input 
                        type="text" 
                        placeholder="Description"
                        value={step.description}
                        onChange={(e) => handleDripStepChange(step.id, "description", e.target.value)}
                        style={{ flex: 1, fontSize: "0.75rem", padding: "0.25rem" }}
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveDripStep(step.id)}
                        style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "1.2rem" }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={handleAddDripStep}
                    style={{ fontSize: "0.75rem", padding: "0.25rem", cursor: "pointer", border: "1px dashed var(--outline)", background: "transparent" }}
                  >
                    + Add Time Delay Step
                  </button>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
                  <button className={styles.primaryBtn} onClick={handleSaveDrip} disabled={isPending}>
                    Save Drip Sequence
                  </button>
                  <button className={styles.secondaryBtn} onClick={() => setShowDripForm(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {drips.map((d) => (
                <div key={d.id} className={styles.card}>
                  <div className={styles.flexBetween} style={{ marginBottom: "0.5rem" }}>
                    <strong>{d.name}</strong>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <span className={styles.badge}>{d.active ? "● ACTIVE" : "● PAUSED"}</span>
                      <button 
                        style={{ border: "none", background: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.8rem" }}
                        onClick={() => handleDeleteDrip(d.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", margin: "0.5rem 0" }}>
                      {d.steps?.map((step: any, sIdx: number) => {
                        const t = templates.find((tmp) => tmp.id === step.templateId);
                        return (
                          <div key={step.id}>
                            Step {sIdx + 1}: Send <strong>{t ? t.name : "Custom"}</strong> after <strong>{step.delayDays} day(s)</strong> ({step.description})
                          </div>
                        );
                      })}
                    </div>
                    <strong>Active Enrollments: {d.enrollments?.length || 0} Contacts</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
