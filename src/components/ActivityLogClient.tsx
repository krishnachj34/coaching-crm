"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import styles from "../app/activity-log/page.module.css";
import tableStyles from "../app/attendance/page.module.css"; // Reuse table responsive styles
import { createManualLog } from "@/app/activity-log/actions";

interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  actionType: string;
  module: string;
  entityId: string | null;
  description: string;
  createdAt: Date | string;
}

interface ActivityLogClientProps {
  initialLogs: LogEntry[];
  errorMsg?: string;
}

export default function ActivityLogClient({ initialLogs, errorMsg }: ActivityLogClientProps) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Manual Log Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [module, setModule] = useState("GENERAL");
  const [actionType, setActionType] = useState("MANUAL");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  React.useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATED":
        return styles.badgeCreated;
      case "UPDATED":
        return styles.badgeUpdated;
      case "DELETED":
        return styles.badgeDeleted;
      case "LOGIN":
        return styles.badgeLogin;
      case "LOGOUT":
        return styles.badgeLogout;
      case "COMPLETED_TASK":
        return styles.badgeCompleted;
      case "MANUAL":
        return styles.badgeManual;
      case "MEETING":
        return styles.badgeMeeting;
      case "PHONE_CALL":
        return styles.badgePhone;
      case "NOTE":
        return styles.badgeNote;
      default:
        return styles.badgeDefault;
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!description) {
      setFormError("Log description/remark is required.");
      return;
    }

    setIsPending(true);
    const formData = new FormData();
    formData.append("description", description);
    formData.append("module", module);
    formData.append("actionType", actionType);

    const res = await createManualLog(formData);
    setIsPending(false);

    if (res.error) {
      setFormError(res.error);
    } else if (res.log) {
      setLogs((prev) => [res.log as LogEntry, ...prev]);
      setIsAddOpen(false);
      setDescription("");
      setModule("GENERAL");
      setActionType("MANUAL");
    }
  };

  const filteredLogs = logs.filter((log) => {
    // 1. Search filter
    const searchLower = search.toLowerCase();
    const matchesSearch =
      log.userName.toLowerCase().includes(searchLower) ||
      log.description.toLowerCase().includes(searchLower);
    if (!matchesSearch) return false;

    // 2. Action Filter
    if (actionFilter !== "ALL" && log.actionType !== actionFilter) {
      return false;
    }

    // 3. Module Filter
    if (moduleFilter !== "ALL" && log.module !== moduleFilter) {
      return false;
    }

    // 4. Date range filter
    const logDate = new Date(log.createdAt);
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (logDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (logDate > end) return false;
    }

    return true;
  });

  return (
    <div className={styles.container}>
      <Sidebar currentPhase={13} />

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1>Activity Log Audit Trail</h1>
            <p>Monitor system-wide user actions, credential access, and module modifications.</p>
          </div>
          <button onClick={() => setIsAddOpen(true)} className={styles.addManualButton}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.2rem" }}>add</span>
            Add Manual Entry
          </button>
        </header>

        {errorMsg && (
          <div className={styles.errorAlert}>
            {errorMsg}
          </div>
        )}

        {/* Filter Toolbar */}
        <div className={styles.filterToolbar}>
          <div className={styles.searchBox}>
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Search user or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.filterItem}>
              <label>Action</label>
              <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                <option value="ALL">All Actions</option>
                <option value="CREATED">Created</option>
                <option value="UPDATED">Updated</option>
                <option value="DELETED">Deleted</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="MANUAL">Manual Log</option>
                <option value="MEETING">Meeting</option>
                <option value="PHONE_CALL">Phone Call</option>
                <option value="NOTE">Internal Note</option>
                <option value="COMPLETED_TASK">Completed Task</option>
              </select>
            </div>

            <div className={styles.filterItem}>
              <label>Module</label>
              <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
                <option value="ALL">All Modules</option>
                <option value="GENERAL">General / Manual</option>
                <option value="LEADS">Leads</option>
                <option value="STUDENTS">Students</option>
                <option value="ATTENDANCE">Attendance</option>
                <option value="STAFF">Staff</option>
                <option value="FEES">Fees</option>
                <option value="EXAMS">Exams</option>
                <option value="ACADEMICS">Academics</option>
                <option value="AUTH">Authentication</option>
              </select>
            </div>

            <div className={styles.filterItem}>
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className={styles.filterItem}>
              <label>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User / Operator</th>
                <th>Action Type</th>
                <th>Affected Module</th>
                <th>Summary / Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    No activity log records found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className={styles.timeCell}>
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{log.userName}</span>
                        <span className={styles.userRole}>{log.userRole}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.actionBadge} ${getActionColor(log.actionType)}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td>
                      <span className={styles.moduleBadge}>{log.module}</span>
                    </td>
                    <td className={styles.descriptionCell}>
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MANUAL LOG POPUP MODAL */}
        {isAddOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>Add Manual Activity Log</h3>
                <button onClick={() => setIsAddOpen(false)} className={styles.closeModalButton}>✕</button>
              </div>

              {formError && <div className={styles.errorAlert} style={{ marginBottom: "1rem" }}>{formError}</div>}

              <form onSubmit={handleManualSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Select Module / Feature Area *</label>
                  <select
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    className={styles.modalSelect}
                  >
                    <option value="GENERAL">General Notes / Remarks</option>
                    <option value="LEADS">Leads Manager</option>
                    <option value="STUDENTS">Students Manager</option>
                    <option value="ATTENDANCE">Attendance Tracker</option>
                    <option value="STAFF">Staff Manager</option>
                    <option value="FEES">Fees Ledger</option>
                    <option value="EXAMS">Exams Manager</option>
                    <option value="ACADEMICS">Academics & Timings</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Activity Action Type *</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className={styles.modalSelect}
                  >
                    <option value="MANUAL">Manual log (General)</option>
                    <option value="MEETING">Student / Parent Meeting</option>
                    <option value="PHONE_CALL">Phone Call</option>
                    <option value="NOTE">Internal Note / Remarks</option>
                    <option value="COMPLETED_TASK">Completed Task</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Log Remark Details *</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write what manual action or remark you want to log..."
                    className={styles.modalTextarea}
                  />
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className={styles.cancelButton}
                    disabled={isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isPending}
                  >
                    {isPending ? "Saving..." : "Save Entry"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
