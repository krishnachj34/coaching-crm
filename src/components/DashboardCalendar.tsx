"use client";

import React, { useState, useEffect } from "react";
import styles from "../app/page.module.css";
import modalStyles from "../app/students/page.module.css";

interface UnifiedEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  instructor: string;
  platform: string;
  link: string | null;
  extra: string | null;
}

export default function DashboardCalendar() {
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/dashboard/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Polling calendar events failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchEvents();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getEventStyle = (type: string) => {
    switch (type) {
      case "CLASS":
        return { borderLeft: "4px solid #3b82f6", background: "#eff6ff" }; // Blue
      case "DEMO_CLASS":
        return { borderLeft: "4px solid #10b981", background: "#ecfdf5" }; // Green
      case "WORKSHOP":
        return { borderLeft: "4px solid #8b5cf6", background: "#f5f3ff" }; // Purple
      case "WEBINAR":
        return { borderLeft: "4px solid #f59e0b", background: "#fffbeb" }; // Orange
      default:
        return { borderLeft: "4px solid #6b7280", background: "#f9fafb" }; // Gray
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "CLASS": return "#3b82f6";
      case "DEMO_CLASS": return "#10b981";
      case "WORKSHOP": return "#8b5cf6";
      case "WEBINAR": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  // Format date helper (gets day number, e.g. "12" or "09")
  const getDayNumber = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getDate().toString().padStart(2, "0");
  };

  const getMonthAbbr = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  };

  return (
    <div className={styles.scheduleCard} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ margin: 0 }}>Upcoming Schedules</h4>
        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse 1.5s infinite" }} />
          Live Synced
        </span>
      </div>

      {loading ? (
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>Loading active schedules...</p>
      ) : events.length === 0 ? (
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic", padding: "1rem 0" }}>No schedules listed for this month.</p>
      ) : (
        <div className={styles.scheduleList} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {events.slice(0, 5).map((evt) => (
            <div
              key={evt.id}
              className={styles.scheduleItem}
              style={{
                ...getEventStyle(evt.type),
                padding: "0.75rem",
                borderRadius: "var(--radius)",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                display: "flex",
                gap: "1rem",
                alignItems: "center"
              }}
              onClick={() => setSelectedEvent(evt)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateX(4px)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--surface-container-high)",
                  borderRadius: "var(--radius-sm)",
                  width: "48px",
                  height: "48px",
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: "0.6rem", fontWeight: "800", color: "var(--text-muted)" }}>
                  {getMonthAbbr(evt.date)}
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--foreground)", marginTop: "-2px" }}>
                  {getDayNumber(evt.date)}
                </span>
              </div>

              <div className={styles.scheduleDetails} style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: "700", fontSize: "0.85rem", color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {evt.title}
                </p>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.15rem" }}>
                  <span>🕒 {evt.time}</span>
                  <span>• {evt.instructor}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Event Details */}
      {selectedEvent && (
        <div className={modalStyles.modalOverlay} style={{ zIndex: 9999 }}>
          <div className={modalStyles.modalContent} style={{ maxWidth: "450px", padding: "1.5rem" }}>
            <div className={modalStyles.modalHeader} style={{ paddingBottom: "0.75rem", borderBottom: "1px solid var(--outline-variant)" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800" }}>Schedule Details</h3>
              <button onClick={() => setSelectedEvent(null)} className={modalStyles.closeModalButton}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.25rem", fontSize: "0.875rem" }}>
              <div>
                <span
                  style={{
                    display: "inline-flex",
                    padding: "0.25rem 0.625rem",
                    borderRadius: "99px",
                    fontSize: "0.7rem",
                    fontWeight: "800",
                    background: getBadgeColor(selectedEvent.type),
                    color: "#ffffff",
                    marginBottom: "0.5rem"
                  }}
                >
                  {selectedEvent.type}
                </span>
                <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "var(--foreground)" }}>
                  {selectedEvent.title}
                </h4>
              </div>

              <div style={{ background: "var(--surface-container-low)", padding: "1rem", borderRadius: "var(--radius)", display: "flex", flexDirection: "column", gap: "0.5rem", border: "1px solid var(--outline-variant)" }}>
                <div style={{ display: "flex", justifyContent: "between" }}>
                  <span style={{ color: "var(--text-muted)", width: "100px" }}>📅 Date:</span>
                  <strong style={{ color: "var(--foreground)" }}>{new Date(selectedEvent.date).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "between" }}>
                  <span style={{ color: "var(--text-muted)", width: "100px" }}>🕒 Time:</span>
                  <strong style={{ color: "var(--foreground)" }}>{selectedEvent.time}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "between" }}>
                  <span style={{ color: "var(--text-muted)", width: "100px" }}>👤 Instructor:</span>
                  <strong style={{ color: "var(--foreground)" }}>{selectedEvent.instructor}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "between" }}>
                  <span style={{ color: "var(--text-muted)", width: "100px" }}>📍 Platform:</span>
                  <strong style={{ color: "var(--foreground)" }}>{selectedEvent.platform} ({selectedEvent.extra})</strong>
                </div>
              </div>

              {selectedEvent.link && (
                <div style={{ marginTop: "0.5rem" }}>
                  <span style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "0.375rem" }}>Meeting Link:</span>
                  <a
                    href={selectedEvent.link}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "block",
                      padding: "0.625rem",
                      background: "var(--primary-light)",
                      color: "var(--primary)",
                      fontWeight: "700",
                      borderRadius: "var(--radius)",
                      textDecoration: "none",
                      textAlign: "center",
                      border: "1px solid var(--primary-fixed-dim)"
                    }}
                  >
                    Launch Online Class / Meeting
                  </a>
                </div>
              )}
            </div>

            <div className={modalStyles.modalFooter} style={{ marginTop: "1.5rem", paddingTop: "0.75rem", borderTop: "1px solid var(--outline-variant)" }}>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className={modalStyles.submitButton}
                style={{ width: "100%" }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
