"use client";

import React, { useState, useTransition } from "react";
import styles from "../app/leads/page.module.css";
import { updateLeadStatus, deleteLead, updateLeadFollowUp } from "@/app/leads/actions";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  interest: string | null;
  status: string;
  notes: string | null;
  source: string;
  trialStartDate: Date | string | null;
  trialEndDate: Date | string | null;
  nextFollowUp?: Date | string | null;
  followUpNotes?: string | null;
  createdAt: Date;
}

interface LeadTableProps {
  initialLeads: Lead[];
}

export default function LeadTable({ initialLeads }: LeadTableProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Scheduling state
  const [schedulingLead, setSchedulingLead] = useState<Lead | null>(null);
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [schedNotes, setSchedNotes] = useState("");

  const handleScheduleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingLead) return;

    startTransition(async () => {
      const res = await updateLeadFollowUp(
        schedulingLead.id,
        schedDate || null,
        schedTime || null,
        schedNotes || null
      );
      if (res.success) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === schedulingLead.id
              ? {
                  ...lead,
                  nextFollowUp: schedDate
                    ? new Date(`${schedDate}T${schedTime || "00:00"}`)
                    : null,
                  followUpNotes: schedNotes || null,
                }
              : lead
          )
        );
        setSchedulingLead(null);
      } else {
        alert(res.error || "Failed to update follow-up.");
      }
    });
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updateLeadStatus(id, newStatus);
      if (res.success) {
        setLeads((prev) =>
          prev.map((lead) => (lead.id === id ? { ...lead, status: newStatus } : lead))
        );
      } else {
        alert(res.error || "Failed to update status.");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    startTransition(async () => {
      const res = await deleteLead(id);
      if (res.success) {
        setLeads((prev) => prev.filter((lead) => lead.id !== id));
      } else {
        alert(res.error || "Failed to delete lead.");
      }
    });
  };

  // Sync leads if parent server component passes new list
  React.useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search) ||
      (lead.email && lead.email.toLowerCase().includes(search.toLowerCase())) ||
      (lead.source && lead.source.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search leads by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="ALL">All Statuses</option>
          <option value="NEW">New</option>
          <option value="TRIAL">Trial / Demo</option>
          <option value="CONTACTED">Contacted</option>
          <option value="ENROLLED">Enrolled</option>
          <option value="LOST">Lost</option>
        </select>
      </div>

      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact Details</th>
              <th>Source</th>
              <th>Course Interest</th>
              <th>Trial Period</th>
              <th>Next Call</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={10} className={styles.emptyCell}>
                  No leads found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td className={styles.leadName}>{lead.name}</td>
                  <td>
                    <div className={styles.contactDetails}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>📞 {lead.phone}</span>
                        <a
                          href={`/automation?phone=${lead.phone.replace(/[^0-9]/g, "")}`}
                          title="Open WhatsApp Chat"
                          style={{ display: "flex", alignItems: "center", color: "#25D366", textDecoration: "none" }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "1.15rem", cursor: "pointer" }}>chat</span>
                        </a>
                      </div>
                      {lead.email && <span className={styles.emailText}>✉️ {lead.email}</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.sourceBadge} ${
                      lead.source === "FACEBOOK_ADS" || lead.source === "INSTAGRAM_ADS"
                        ? styles.sourceSocial
                        : lead.source === "LINKEDIN_ADS"
                        ? styles.sourceLinkedin
                        : lead.source === "TRIAL_CLASS" || lead.source === "SEMINAR"
                        ? styles.sourceEvent
                        : styles.sourceManual
                    }`}>
                      {lead.source.replace("_", " ")}
                    </span>
                  </td>
                  <td>{lead.interest || <span className={styles.noneText}>None</span>}</td>
                  <td>
                    {lead.trialStartDate ? (
                      <div className={styles.trialPeriod}>
                        <span>{new Date(lead.trialStartDate).toLocaleDateString()}</span>
                        {lead.trialEndDate && (
                          <>
                            <span className={styles.trialSeparator}>to</span>
                            <span>{new Date(lead.trialEndDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className={styles.noneText}>-</span>
                    )}
                  </td>
                  <td>
                    {lead.nextFollowUp ? (
                      <div className={styles.trialPeriod}>
                        <span style={{ color: "#db2777", fontWeight: "700" }}>
                          📅 {new Date(lead.nextFollowUp).toLocaleDateString()}
                        </span>
                        <span style={{ fontSize: "0.75rem", display: "block", color: "var(--text-muted)", marginTop: "2px" }}>
                          🕒 {new Date(lead.nextFollowUp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {lead.followUpNotes && (
                          <div style={{ fontSize: "0.7rem", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px", marginTop: "2px", color: "var(--text-muted)" }} title={lead.followUpNotes}>
                            "{lead.followUpNotes}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className={styles.noneText}>-</span>
                    )}
                  </td>
                  <td>
                    <select
                      disabled={isPending}
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className={`${styles.statusDropdown} ${
                        lead.status === "ENROLLED"
                          ? styles.statusEnrolled
                          : lead.status === "CONTACTED"
                          ? styles.statusContacted
                          : lead.status === "LOST"
                          ? styles.statusLost
                          : lead.status === "TRIAL"
                          ? styles.statusTrial
                          : styles.statusNew
                      }`}
                    >
                      <option value="NEW">New</option>
                      <option value="TRIAL">Trial</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="ENROLLED">Enrolled</option>
                      <option value="LOST">Lost</option>
                    </select>
                  </td>
                  <td className={styles.notesCell} title={lead.notes || ""}>
                    {lead.notes || <span className={styles.noneText}>-</span>}
                  </td>
                  <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.375rem", flexDirection: "column" }}>
                      <button
                        disabled={isPending}
                        onClick={() => {
                          setSchedulingLead(lead);
                          if (lead.nextFollowUp) {
                            const d = new Date(lead.nextFollowUp);
                            const year = d.getFullYear();
                            const month = (d.getMonth() + 1).toString().padStart(2, '0');
                            const day = d.getDate().toString().padStart(2, '0');
                            setSchedDate(`${year}-${month}-${day}`);
                            setSchedTime(d.toTimeString().split(" ")[0].slice(0, 5));
                          } else {
                            setSchedDate("");
                            setSchedTime("");
                          }
                          setSchedNotes(lead.followUpNotes || "");
                        }}
                        className={styles.addLeadBtn}
                        style={{ padding: "0.375rem 0.5rem", fontSize: "0.75rem", background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary-fixed-dim)", cursor: "pointer", width: "100%", whiteSpace: "nowrap" }}
                      >
                        Schedule Call
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => handleDelete(lead.id)}
                        className={styles.deleteButton}
                        style={{ width: "100%" }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Scheduling Modal */}
      {schedulingLead && (
        <div className={styles.modalOverlay} style={{ zIndex: 9999 }}>
          <div className={styles.modalContent} style={{ maxWidth: "450px" }}>
            <div className={styles.modalHeader}>
              <h3>Schedule Call / Follow-up</h3>
              <button onClick={() => setSchedulingLead(null)} className={styles.closeModalButton}>
                ✕
              </button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Set follow-up details for <strong>{schedulingLead.name}</strong> ({schedulingLead.phone})
            </p>
            <form onSubmit={handleScheduleSave} className={styles.form}>
              <div className={styles.formGroupDouble}>
                <div className={styles.formGroup}>
                  <label htmlFor="sched-date">Date *</label>
                  <input
                    id="sched-date"
                    type="date"
                    required
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className={styles.modalInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="sched-time">Time</label>
                  <input
                    id="sched-time"
                    type="time"
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    className={styles.modalInput}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="sched-notes">Follow-up Notes</label>
                <textarea
                  id="sched-notes"
                  rows={3}
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                  placeholder="e.g. Call to confirm attendance on demo class, discuss fee structure..."
                  className={styles.modalTextarea}
                />
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => {
                    // Quick clear scheduler
                    setSchedDate("");
                    setSchedTime("");
                    setSchedNotes("");
                  }}
                  className={styles.cancelButton}
                  style={{ marginRight: "auto" }}
                >
                  Clear Fields
                </button>
                <button
                  type="button"
                  onClick={() => setSchedulingLead(null)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={styles.submitButton}
                >
                  {isPending ? "Saving..." : "Save Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
