"use client";

import React, { useState, useTransition } from "react";
import styles from "../app/leads/page.module.css";
import { updateLeadStatus, deleteLead } from "@/app/leads/actions";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  interest: string | null;
  status: string;
  notes: string | null;
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
      (lead.email && lead.email.toLowerCase().includes(search.toLowerCase()));

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
          <option value="CONTACTED">Contacted</option>
          <option value="ENROLLED">Enrolled</option>
          <option value="LOST">Lost</option>
        </select>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact Details</th>
            <th>Course Interest</th>
            <th>Status</th>
            <th>Notes</th>
            <th>Registered</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredLeads.length === 0 ? (
            <tr>
              <td colSpan={7} className={styles.emptyCell}>
                No leads found matching your criteria.
              </td>
            </tr>
          ) : (
            filteredLeads.map((lead) => (
              <tr key={lead.id}>
                <td className={styles.leadName}>{lead.name}</td>
                <td>
                  <div className={styles.contactDetails}>
                    <span>📞 {lead.phone}</span>
                    {lead.email && <span className={styles.emailText}>✉️ {lead.email}</span>}
                  </div>
                </td>
                <td>{lead.interest || <span className={styles.noneText}>None</span>}</td>
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
                        : styles.statusNew
                    }`}
                  >
                    <option value="NEW">New</option>
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
                  <button
                    disabled={isPending}
                    onClick={() => handleDelete(lead.id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
