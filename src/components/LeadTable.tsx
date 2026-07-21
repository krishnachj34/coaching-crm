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
  // Merged Wati Meta
  assignedOperator?: string;
  tags?: string[];
  attributes?: any;
  leadScore?: number;
}

interface LeadTableProps {
  initialLeads: Lead[];
}

const KANBAN_COLUMNS = [
  { id: "NEW", title: "🆕 New" },
  { id: "CONTACTED", title: "📞 Contacted" },
  { id: "TRIAL", title: "📝 Trial / Demo" },
  { id: "ENROLLED", title: "🎓 Enrolled" },
  { id: "LOST", title: "❌ Lost" }
];

export default function LeadTable({ initialLeads }: LeadTableProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Scheduling standard modal state (fallback/historical compatibility)
  const [schedulingLead, setSchedulingLead] = useState<Lead | null>(null);
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [schedNotes, setSchedNotes] = useState("");

  // Quick Log Interaction Drawer state
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [drawerStatus, setDrawerStatus] = useState("");
  const [drawerNotes, setDrawerNotes] = useState("");
  const [drawerNextCallDate, setDrawerNextCallDate] = useState("");
  const [drawerNextCallTime, setDrawerNextCallTime] = useState("");
  const [drawerCallNotes, setDrawerCallNotes] = useState("");
  const [drawerTrialStart, setDrawerTrialStart] = useState("");
  const [drawerTrialEnd, setDrawerTrialEnd] = useState("");

  // Sync leads if parent server component passes new list
  React.useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

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

  const handleMoveStatus = (leadId: string, currentStatus: string, direction: "next" | "prev") => {
    const statuses = ["NEW", "CONTACTED", "TRIAL", "ENROLLED", "LOST"];
    const idx = statuses.indexOf(currentStatus);
    if (idx === -1) return;

    let newIdx = idx;
    if (direction === "next" && idx < statuses.length - 1) newIdx++;
    if (direction === "prev" && idx > 0) newIdx--;

    if (newIdx !== idx) {
      handleStatusChange(leadId, statuses[newIdx]);
    }
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

  // Quick Log Drawer Save
  const handleDrawerSave = () => {
    if (!drawerLead) return;

    startTransition(async () => {
      try {
        // 1. Update Status
        if (drawerStatus !== drawerLead.status) {
          await updateLeadStatus(drawerLead.id, drawerStatus);
        }

        // 2. Update Follow up call parameters
        await updateLeadFollowUp(
          drawerLead.id,
          drawerNextCallDate || null,
          drawerNextCallTime || null,
          drawerCallNotes || null
        );

        // 3. Update notes/trials details
        const { updateLeadDetails } = await import("@/app/leads/actions");
        const updatedNotes = drawerNotes.trim();
        const trialStart = drawerTrialStart ? new Date(drawerTrialStart) : null;
        const trialEnd = drawerTrialEnd ? new Date(drawerTrialEnd) : null;

        const updateData: any = {
          notes: updatedNotes || null,
          trialStartDate: trialStart,
          trialEndDate: trialEnd
        };

        const res = await updateLeadDetails(drawerLead.id, updateData);
        if (res.success) {
          setLeads((prev) =>
            prev.map((l) =>
              l.id === drawerLead.id
                ? {
                    ...l,
                    status: drawerStatus,
                    notes: updatedNotes || null,
                    trialStartDate: trialStart,
                    trialEndDate: trialEnd,
                    nextFollowUp: drawerNextCallDate
                      ? new Date(`${drawerNextCallDate}T${drawerNextCallTime || "00:00"}`)
                      : null,
                    followUpNotes: drawerCallNotes || null
                  }
                : l
            )
          );
          setDrawerLead(null);
        } else {
          alert(res.error || "Failed to save details");
        }
      } catch (err) {
        console.error("Failed to log call outcome:", err);
      }
    });
  };

  const openQuickLogDrawer = (lead: Lead) => {
    setDrawerLead(lead);
    setDrawerStatus(lead.status);
    setDrawerNotes(lead.notes || "");
    setDrawerCallNotes(lead.followUpNotes || "");

    if (lead.nextFollowUp) {
      const d = new Date(lead.nextFollowUp);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      setDrawerNextCallDate(`${year}-${month}-${day}`);
      setDrawerNextCallTime(d.toTimeString().split(" ")[0].slice(0, 5));
    } else {
      setDrawerNextCallDate("");
      setDrawerNextCallTime("");
    }

    if (lead.trialStartDate) {
      const d = new Date(lead.trialStartDate);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      setDrawerTrialStart(`${year}-${month}-${day}`);
    } else {
      setDrawerTrialStart("");
    }

    if (lead.trialEndDate) {
      const d = new Date(lead.trialEndDate);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      setDrawerTrialEnd(`${year}-${month}-${day}`);
    } else {
      setDrawerTrialEnd("");
    }
  };

  // Helper: Lead Score Priority Badge
  const renderPriorityBadge = (score: number = 0) => {
    if (score >= 50) return <span className={`${styles.priorityBadge} ${styles.hot}`}>🔥 Hot ({score})</span>;
    if (score >= 20) return <span className={`${styles.priorityBadge} ${styles.warm}`}>⚡ Warm ({score})</span>;
    return <span className={`${styles.priorityBadge} ${styles.cold}`}>❄️ Cold ({score})</span>;
  };

  // Helper: Call Alert Badge
  const renderCallAlertBadge = (dateStr?: Date | string | null) => {
    if (!dateStr) return <span className={`${styles.callBadge} ${styles.noCall}`}>No Call Scheduled</span>;
    const d = new Date(dateStr);
    const today = new Date();

    const isSameDay =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    if (isSameDay) {
      return <span className={`${styles.callBadge} ${styles.dueToday}`}>🟧 Due Today</span>;
    }
    if (d.getTime() < today.getTime()) {
      return <span className={`${styles.callBadge} ${styles.overdue}`}>🟥 Overdue</span>;
    }
    return <span className={`${styles.callBadge} ${styles.scheduled}`}>🟩 Scheduled</span>;
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search) ||
      (lead.email && lead.email.toLowerCase().includes(search.toLowerCase())) ||
      (lead.source && lead.source.toLowerCase().includes(search.toLowerCase())) ||
      (lead.tags && lead.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())));

    const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.tableWrapper}>
      {/* Search and Filters + View Toggle */}
      <div className={styles.filterBar} style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", flex: 1, minWidth: "250px" }}>
          <input
            type="text"
            placeholder="Search leads by name, email, phone or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
            disabled={viewMode === "kanban"}
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="TRIAL">Trial / Demo</option>
            <option value="CONTACTED">Contacted</option>
            <option value="ENROLLED">Enrolled</option>
            <option value="LOST">Lost</option>
          </select>
        </div>

        {/* View Toggle Mode */}
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${viewMode === "table" ? styles.activeToggleBtn : ""}`}
            onClick={() => setViewMode("table")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>table_rows</span>
            <span>List Table</span>
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${viewMode === "kanban" ? styles.activeToggleBtn : ""}`}
            onClick={() => {
              setViewMode("kanban");
              setStatusFilter("ALL");
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>view_week</span>
            <span>Kanban Pipeline</span>
          </button>
        </div>
      </div>

      {/* RENDER TABLE VIEW */}
      {viewMode === "table" ? (
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name &amp; Priority</th>
                <th>Contact Details</th>
                <th>Source</th>
                <th>Assigned Counselor</th>
                <th>Next Call Alert</th>
                <th>Status</th>
                <th>Notes &amp; Tags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyCell}>
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <span className={styles.leadName}>{lead.name}</span>
                        <div>{renderPriorityBadge(lead.leadScore)}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.contactDetails}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span>📞 {lead.phone}</span>
                          <a
                            href={`/wati-sensy?phone=${lead.phone.replace(/[^0-9]/g, "")}`}
                            title="Open Wati Sandbox Inbox"
                            style={{ display: "flex", alignItems: "center", color: "#10b981", textDecoration: "none" }}
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
                    <td>
                      <span className={styles.leadName} style={{ fontWeight: 500 }}>
                        🧑‍💻 {lead.assignedOperator || "Unassigned"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {renderCallAlertBadge(lead.nextFollowUp)}
                        {lead.nextFollowUp && (
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            {new Date(lead.nextFollowUp).toLocaleDateString()}
                          </span>
                        )}
                      </div>
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
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxWidth: "200px" }}>
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.8rem" }}>
                          {lead.notes || <span className={styles.noneText}>No notes</span>}
                        </span>
                        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                          {lead.tags?.map((t) => (
                            <span key={t} className={styles.priorityBadge} style={{ backgroundColor: "#e0f2fe", color: "#0369a1", fontSize: "0.6rem" }}>
                              🏷️ {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        <button
                          onClick={() => openQuickLogDrawer(lead)}
                          className={styles.addLeadBtn}
                          style={{ padding: "0.35rem 0.5rem", fontSize: "0.75rem", background: "var(--secondary-container)", color: "var(--on-secondary-container)", border: "1px solid var(--outline-variant)", cursor: "pointer" }}
                        >
                          Log Call
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className={styles.addLeadBtn}
                          style={{ padding: "0.35rem 0.5rem", fontSize: "0.75rem", background: "var(--error-container)", color: "var(--danger)", border: "1px solid #fecaca", cursor: "pointer" }}
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
      ) : (
        /* RENDER KANBAN PIPELINE VIEW */
        <div className={styles.kanbanBoard}>
          {KANBAN_COLUMNS.map((col) => {
            const colLeads = filteredLeads.filter((l) => l.status === col.id);
            return (
              <div key={col.id} className={styles.kanbanColumn}>
                <div className={styles.columnHeader}>
                  <h3>{col.title}</h3>
                  <span>{colLeads.length}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto", maxHeight: "65vh" }}>
                  {colLeads.map((lead) => (
                    <div key={lead.id} className={styles.kanbanCard}>
                      <div className={styles.cardHeader}>
                        <h4>{lead.name}</h4>
                        {renderPriorityBadge(lead.leadScore)}
                      </div>

                      <div className={styles.cardBody}>
                        <div>📞 +{lead.phone}</div>
                        {lead.interest && <div>🎓 {lead.interest}</div>}
                        <div>🧑‍💻 {lead.assignedOperator || "Unassigned"}</div>
                        <div style={{ marginTop: "0.25rem" }}>
                          {renderCallAlertBadge(lead.nextFollowUp)}
                        </div>
                      </div>

                      <div className={styles.cardFooter}>
                        {/* Direction Status arrows */}
                        <div style={{ display: "flex", gap: "0.25rem" }}>
                          <button
                            className={styles.cardActionBtn}
                            title="Move back status"
                            onClick={() => handleMoveStatus(lead.id, lead.status, "prev")}
                            disabled={lead.status === "NEW" || isPending}
                            style={{ opacity: lead.status === "NEW" ? 0.3 : 1 }}
                          >
                            ←
                          </button>
                          <button
                            className={styles.cardActionBtn}
                            title="Move forward status"
                            onClick={() => handleMoveStatus(lead.id, lead.status, "next")}
                            disabled={lead.status === "LOST" || isPending}
                            style={{ opacity: lead.status === "LOST" ? 0.3 : 1 }}
                          >
                            →
                          </button>
                        </div>

                        <div className={styles.cardActions}>
                          <button
                            className={styles.addLeadBtn}
                            style={{ padding: "0.3rem 0.5rem", fontSize: "0.7rem", background: "var(--primary-light)", color: "var(--primary)", border: "none", cursor: "pointer" }}
                            onClick={() => openQuickLogDrawer(lead)}
                          >
                            Log Call
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {colLeads.length === 0 && (
                    <div style={{ padding: "2.5rem 1rem", textAlign: "center", fontStyle: "italic", fontSize: "0.75rem", color: "var(--text-muted)", background: "var(--surface)", border: "1px dashed var(--outline-variant)", borderRadius: "8px" }}>
                      Empty column
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK LOG DRAWER */}
      {drawerLead && (
        <>
          <div className={styles.drawerOverlay} onClick={() => setDrawerLead(null)} />
          <div className={styles.drawerContent}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800" }}>📞 Quick Call Log: {drawerLead.name}</h3>
              <button
                style={{ border: "none", background: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--foreground)" }}
                onClick={() => setDrawerLead(null)}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1, overflowY: "auto" }}>
              <div className={styles.formGroup}>
                <label style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Lead Pipeline Status</label>
                <select value={drawerStatus} onChange={(e) => setDrawerStatus(e.target.value)}>
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="TRIAL">Trial / Demo</option>
                  <option value="ENROLLED">Enrolled</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Lead Notes / Comments</label>
                <textarea
                  value={drawerNotes}
                  onChange={(e) => setDrawerNotes(e.target.value)}
                  style={{ height: "80px", fontSize: "0.8rem" }}
                  placeholder="e.g. Student targets IELTS 7.5 for Canada express entry..."
                />
              </div>

              <div style={{ borderTop: "1px solid var(--outline-variant)", paddingTop: "1rem" }}>
                <h4 style={{ fontSize: "0.85rem", fontWeight: "800", marginBottom: "0.75rem" }}>Schedule Follow-up Appointment</h4>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.75rem" }}>Date</label>
                    <input type="date" value={drawerNextCallDate} onChange={(e) => setDrawerNextCallDate(e.target.value)} />
                  </div>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.75rem" }}>Time</label>
                    <input type="time" value={drawerNextCallTime} onChange={(e) => setDrawerNextCallTime(e.target.value)} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label style={{ fontSize: "0.75rem" }}>Call Agenda / Objectives</label>
                  <input
                    type="text"
                    placeholder="e.g. Follow up on fee structure negotiation"
                    value={drawerCallNotes}
                    onChange={(e) => setDrawerCallNotes(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--outline-variant)", paddingTop: "1rem" }}>
                <h4 style={{ fontSize: "0.85rem", fontWeight: "800", marginBottom: "0.75rem" }}>Trial Class Bookings</h4>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.75rem" }}>Trial Start</label>
                    <input type="date" value={drawerTrialStart} onChange={(e) => setDrawerTrialStart(e.target.value)} />
                  </div>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.75rem" }}>Trial End</label>
                    <input type="date" value={drawerTrialEnd} onChange={(e) => setDrawerTrialEnd(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid var(--outline-variant)", paddingTop: "1rem" }}>
              <button
                className={styles.submitButton}
                onClick={handleDrawerSave}
                disabled={isPending}
                style={{ flex: 1, justifyContent: "center" }}
              >
                {isPending ? "Saving..." : "Save Log details"}
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => setDrawerLead(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* COMPATIBILITY APPOINTMENT MODAL */}
      {schedulingLead && (
        <div className={styles.modalOverlay} style={{ zIndex: 9999 }}>
          <div className={styles.modalContent} style={{ maxWidth: "450px" }}>
            <h3 className={styles.modalTitle}>Schedule Call: {schedulingLead.name}</h3>
            <form onSubmit={handleScheduleSave} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.modalLabel}>Date</label>
                <input
                  type="date"
                  className={styles.modalInput}
                  required
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.modalLabel}>Time</label>
                <input
                  type="time"
                  className={styles.modalInput}
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.modalLabel}>Follow-up Agenda</label>
                <textarea
                  className={styles.modalTextarea}
                  placeholder="Call to discuss IELTS pricing details..."
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setSchedulingLead(null)} className={styles.cancelButton}>Cancel</button>
                <button type="submit" disabled={isPending} className={styles.submitButton}>
                  {isPending ? "Scheduling..." : "Schedule Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
