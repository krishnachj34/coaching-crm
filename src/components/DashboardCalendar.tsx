"use client";

import React, { useState, useEffect, useTransition } from "react";
import styles from "../app/page.module.css";
import modalStyles from "../app/students/page.module.css";
import calendarStyles from "./DashboardCalendar.module.css";
import { completeLeadFollowUp } from "@/app/leads/actions";

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
  leadPhone?: string;
  leadEmail?: string;
  leadStatus?: string;
}

export default function DashboardCalendar() {
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null);
  
  // New States for Proper CRM Calendar Grid
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isPending, startTransition] = useTransition();

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

  const handleMarkCompleted = async (eventId: string) => {
    if (!confirm("Are you sure you want to mark this follow-up as completed? This will archive the call notes and clear the schedule from the calendar.")) {
      return;
    }

    startTransition(async () => {
      const res = await completeLeadFollowUp(eventId);
      if (res.success) {
        setSelectedEvent(null);
        await fetchEvents();
      } else {
        alert(res.error || "Failed to complete follow-up.");
      }
    });
  };

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
      case "LEAD_FOLLOWUP":
        return { borderLeft: "4px solid #ec4899", background: "#fdf2f8" }; // Pink
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
      case "LEAD_FOLLOWUP": return "#ec4899";
      default: return "#6b7280";
    }
  };

  // Date utilities
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getMonthData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const startDay = new Date(year, month, 1).getDay(); // 0 is Sunday

    const prevMonthData = [];
    const prevMonthEnd = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      prevMonthData.push({
        day: prevMonthEnd - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthEnd - i)
      });
    }

    const currentMonthData = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthData.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }

    const totalRendered = prevMonthData.length + currentMonthData.length;
    const remainingDays = 42 - totalRendered; // 6 rows of 7 days
    const nextMonthData = [];
    for (let i = 1; i <= remainingDays; i++) {
      nextMonthData.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }

    return [...prevMonthData, ...currentMonthData, ...nextMonthData];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(evt => {
      const d = new Date(evt.date);
      return d.getDate() === date.getDate() &&
             d.getMonth() === date.getMonth() &&
             d.getFullYear() === date.getFullYear();
    });
  };

  const changeMonth = (offset: number) => {
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(nextDate);
  };

  const setToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const formatMonthYear = () => {
    return currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  };

  const getDayNumber = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getDate().toString().padStart(2, "0");
  };

  const getMonthAbbr = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  };

  const selectedDayEvents = getEventsForDay(selectedDate);
  const calendarCells = getMonthData();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className={calendarStyles.calendarContainer}>
      {/* Calendar Header with title & View Toggles */}
      <div className={calendarStyles.calendarHeader}>
        <h4 className={calendarStyles.calendarTitle}>
          <span>📅</span> CRM Calendar
        </h4>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem", marginRight: "0.25rem" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse 1.5s infinite" }} />
            Live Synced
          </span>
          <div className={calendarStyles.viewToggle}>
            <button
              onClick={() => setViewMode("GRID")}
              className={`${calendarStyles.toggleBtn} ${viewMode === "GRID" ? calendarStyles.activeToggle : ""}`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              className={`${calendarStyles.toggleBtn} ${viewMode === "LIST" ? calendarStyles.activeToggle : ""}`}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {viewMode === "GRID" ? (
        // ── GRID VIEW ──
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Navigation Controls */}
          <div className={calendarStyles.navSection}>
            <span className={calendarStyles.monthLabel}>{formatMonthYear()}</span>
            <div className={calendarStyles.navBtnGroup}>
              <button onClick={() => changeMonth(-1)} className={calendarStyles.navBtn}>&lt;</button>
              <button onClick={setToday} className={calendarStyles.todayBtn}>Today</button>
              <button onClick={() => changeMonth(1)} className={calendarStyles.navBtn}>&gt;</button>
            </div>
          </div>

          {/* Monthly Day Grid */}
          <div className={calendarStyles.gridContainer}>
            <div className={calendarStyles.weekdayHeader}>
              {weekDays.map(day => (
                <div key={day} className={calendarStyles.weekday}>{day}</div>
              ))}
            </div>
            <div className={calendarStyles.daysGrid}>
              {calendarCells.map((cell, idx) => {
                const dayEvents = getEventsForDay(cell.date);
                const isCellToday = isToday(cell.date);
                const isCellSelected = isSelected(cell.date);

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(cell.date)}
                    className={`${calendarStyles.dayCell} ${
                      !cell.isCurrentMonth ? calendarStyles.outsideDay : ""
                    } ${isCellToday ? calendarStyles.todayCell : ""} ${
                      isCellSelected ? calendarStyles.selectedCell : ""
                    }`}
                  >
                    <span className={calendarStyles.dayNumber}>{cell.day}</span>
                    {dayEvents.length > 0 && (
                      <div className={calendarStyles.dotsContainer}>
                        {dayEvents.slice(0, 3).map(evt => (
                          <span
                            key={evt.id}
                            className={`${calendarStyles.eventDot} ${calendarStyles[`dot_${evt.type}`]}`}
                            title={evt.title}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span style={{ fontSize: "0.55rem", fontWeight: "800", color: "var(--text-muted)", lineHeight: 1 }}>+</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Event List */}
          <div className={calendarStyles.dayEventsSection}>
            <h5 className={calendarStyles.dayEventsHeader}>
              🔍 Events on {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </h5>
            <div className={calendarStyles.dayEventsList}>
              {selectedDayEvents.length === 0 ? (
                <p className={calendarStyles.noEventsMsg}>No items scheduled for this day.</p>
              ) : (
                selectedDayEvents.map(evt => (
                  <div
                    key={evt.id}
                    className={styles.scheduleItem}
                    style={{
                      ...getEventStyle(evt.type),
                      padding: "0.625rem 0.75rem",
                      borderRadius: "var(--radius)",
                      cursor: "pointer",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      display: "flex",
                      gap: "0.75rem",
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: "700", fontSize: "0.8rem", color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {evt.title}
                      </p>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem", marginTop: "0.1rem" }}>
                        <span>🕒 {evt.time}</span>
                        <span>• {evt.instructor}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        // ── LIST VIEW ──
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {loading ? (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>Loading schedules...</p>
          ) : events.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic", padding: "1rem 0" }}>No upcoming schedules.</p>
          ) : (
            <div className={styles.scheduleList} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {events.slice(0, 8).map((evt) => (
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
        </div>
      )}

      {/* Modal for Event Details */}
      {selectedEvent && (
        <div className={modalStyles.modalOverlay} style={{ zIndex: 9999 }}>
          <div className={modalStyles.modalContent} style={{ maxWidth: "450px", padding: "1.5rem" }}>
            <div className={modalStyles.modalHeader} style={{ paddingBottom: "0.75rem", borderBottom: "1px solid var(--outline-variant)" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800" }}>CRM Event Details</h3>
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
                    marginBottom: "0.5rem",
                    textTransform: "uppercase"
                  }}
                >
                  {selectedEvent.type.replace("_", " ")}
                </span>
                <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "var(--foreground)" }}>
                  {selectedEvent.title}
                </h4>
              </div>

              <div style={{ background: "var(--surface-container-low)", padding: "1rem", borderRadius: "var(--radius)", display: "flex", flexDirection: "column", gap: "0.5rem", border: "1px solid var(--outline-variant)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", width: "100px" }}>📅 Date:</span>
                  <strong style={{ color: "var(--foreground)" }}>
                    {new Date(selectedEvent.date).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", width: "100px" }}>🕒 Time:</span>
                  <strong style={{ color: "var(--foreground)" }}>{selectedEvent.time}</strong>
                </div>
                {selectedEvent.type === "LEAD_FOLLOWUP" ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)", width: "100px" }}>📞 Phone:</span>
                      <strong style={{ color: "var(--foreground)" }}>{selectedEvent.leadPhone}</strong>
                    </div>
                    {selectedEvent.leadEmail && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-muted)", width: "100px" }}>✉️ Email:</span>
                        <strong style={{ color: "var(--foreground)" }}>{selectedEvent.leadEmail}</strong>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)", width: "100px" }}>🏷️ Status:</span>
                      <strong style={{ color: "var(--foreground)" }}>
                        <span className={`${styles.statusTag} ${
                          selectedEvent.leadStatus === "ENROLLED"
                            ? styles.statusTagEnrolled
                            : ""
                        }`} style={{ padding: "0.15rem 0.5rem" }}>
                          {selectedEvent.leadStatus}
                        </span>
                      </strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)", width: "100px" }}>👤 Instructor:</span>
                      <strong style={{ color: "var(--foreground)" }}>{selectedEvent.instructor}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)", width: "100px" }}>📍 Platform:</span>
                      <strong style={{ color: "var(--foreground)" }}>{selectedEvent.platform}</strong>
                    </div>
                  </>
                )}
              </div>

              {/* Lead Details Notes vs Meeting Link */}
              {selectedEvent.type === "LEAD_FOLLOWUP" ? (
                <div style={{ background: "var(--primary-light)", padding: "1rem", borderRadius: "var(--radius)", border: "1px dashed var(--primary-fixed-dim)" }}>
                  <span style={{ display: "block", fontSize: "0.75rem", fontWeight: "800", color: "var(--primary)", marginBottom: "0.25rem" }}>Follow-up Task Details:</span>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--foreground)", fontStyle: "italic", lineHeight: 1.4 }}>
                    "{selectedEvent.extra}"
                  </p>
                </div>
              ) : (
                selectedEvent.extra && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", padding: "0 0.5rem" }}>
                    <span>Details:</span>
                    <strong>{selectedEvent.extra}</strong>
                  </div>
                )
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                {selectedEvent.type === "LEAD_FOLLOWUP" ? (
                  <>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <a
                        href={`tel:${selectedEvent.leadPhone}`}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.25rem",
                          padding: "0.625rem",
                          background: "var(--primary)",
                          color: "#ffffff",
                          fontWeight: "700",
                          borderRadius: "var(--radius)",
                          textAlign: "center"
                        }}
                      >
                        📞 Call Lead
                      </a>
                      {selectedEvent.leadEmail && (
                        <a
                          href={`mailto:${selectedEvent.leadEmail}`}
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.25rem",
                            padding: "0.625rem",
                            background: "var(--surface-container-high)",
                            color: "var(--foreground)",
                            fontWeight: "700",
                            borderRadius: "var(--radius)",
                            textAlign: "center",
                            border: "1px solid var(--outline-variant)"
                          }}
                        >
                          ✉️ Email Lead
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleMarkCompleted(selectedEvent.id)}
                      style={{
                        width: "100%",
                        padding: "0.625rem",
                        background: "#10b981",
                        color: "#ffffff",
                        fontWeight: "700",
                        border: "none",
                        borderRadius: "var(--radius)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.25rem"
                      }}
                    >
                      {isPending ? "Updating..." : "✓ Mark Completed"}
                    </button>
                  </>
                ) : (
                  selectedEvent.link && (
                    <div>
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
                  )
                )}
              </div>
            </div>

            <div className={modalStyles.modalFooter} style={{ marginTop: "1.25rem", paddingTop: "0.75rem", borderTop: "1px solid var(--outline-variant)" }}>
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
