"use client";

import React from "react";
import styles from "../styles/styles.module.css";

interface AnalyticsTabProps {
  campaigns: any[];
  chatsCount: number;
}

export default function AnalyticsTab({ campaigns, chatsCount }: AnalyticsTabProps) {
  // Aggregate campaign stats
  const aggregateStats = React.useMemo(() => {
    let totalSent = 0;
    let totalDelivered = 0;
    let totalRead = 0;
    let totalReplies = 0;

    campaigns.forEach((c) => {
      totalSent += c.sentCount || 0;
      totalDelivered += c.deliveredCount || 0;
      totalRead += c.readCount || 0;
      totalReplies += c.repliedCount || 0;
    });

    return { totalSent, totalDelivered, totalRead, totalReplies };
  }, [campaigns]);

  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "1.5rem" }}>
        Marketing &amp; Team SLA Analytics
      </h2>

      {/* KPI Row */}
      <div className={styles.kpiGrid}>
        <div className={styles.card}>
          <span className={styles.kpiLabel}>Inbox Conversations</span>
          <h3 className={styles.kpiVal}>{chatsCount}</h3>
          <span style={{ fontSize: "0.75rem", color: "var(--success)", fontWeight: "bold" }}>
            🧑‍💻 3 Active Agents Online
          </span>
        </div>
        <div className={styles.card}>
          <span className={styles.kpiLabel}>Total Outgoing Broadcasts</span>
          <h3 className={styles.kpiVal}>{aggregateStats.totalSent}</h3>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Across {campaigns.length} campaigns
          </span>
        </div>
        <div className={styles.card}>
          <span className={styles.kpiLabel}>Average Counselor Response Time</span>
          <h3 className={styles.kpiVal}>4.2 Min</h3>
          <span style={{ fontSize: "0.75rem", color: "var(--success)", fontWeight: "bold" }}>
            ⚡ Under SLA target (15m)
          </span>
        </div>
        <div className={styles.card}>
          <span className={styles.kpiLabel}>Chatbot Resolution Rate</span>
          <h3 className={styles.kpiVal}>72%</h3>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Resolved without counselor escalation
          </span>
        </div>
      </div>

      <div className={styles.chartRow}>
        {/* SVG Chart 1: Message Trends */}
        <div className={styles.card} style={{ height: "300px" }}>
          <div className={styles.chartTitle}>
            <span>Message Volumes (Last 7 Days)</span>
            <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", fontWeight: "normal" }}>
              <span>
                <span className={styles.legendDot} style={{ backgroundColor: "var(--primary)" }}></span>
                Broadcast Out
              </span>
              <span>
                <span className={styles.legendDot} style={{ backgroundColor: "var(--secondary)" }}></span>
                Replies In
              </span>
            </div>
          </div>
          <div style={{ height: "200px", width: "100%", position: "relative" }}>
            <svg viewBox="0 0 500 180" width="100%" height="100%">
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="var(--outline-variant)" strokeWidth="0.5" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="var(--outline-variant)" strokeWidth="0.5" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="var(--outline-variant)" strokeWidth="0.5" />
              <line x1="0" y1="170" x2="500" y2="170" stroke="var(--outline-variant)" strokeWidth="1" />

              {/* Data Lines */}
              {/* Broadcast Out (Primary color) */}
              <path 
                d="M 20 120 L 100 80 L 180 150 L 260 50 L 340 110 L 420 40 L 480 90" 
                fill="none" 
                stroke="var(--primary)" 
                strokeWidth="3" 
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Replies In (Secondary color) */}
              <path 
                d="M 20 160 L 100 140 L 180 165 L 260 110 L 340 145 L 420 90 L 480 135" 
                fill="none" 
                stroke="var(--secondary)" 
                strokeWidth="3" 
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              <circle cx="420" cy="40" r="5" fill="var(--primary)" />
              <circle cx="420" cy="90" r="5" fill="var(--secondary)" />

              {/* Labels */}
              <text x="20" y="178" fontSize="8" fill="var(--text-muted)">Jul 3</text>
              <text x="100" y="178" fontSize="8" fill="var(--text-muted)">Jul 4</text>
              <text x="180" y="178" fontSize="8" fill="var(--text-muted)">Jul 5</text>
              <text x="260" y="178" fontSize="8" fill="var(--text-muted)">Jul 6</text>
              <text x="340" y="178" fontSize="8" fill="var(--text-muted)">Jul 7</text>
              <text x="420" y="178" fontSize="8" fill="var(--text-muted)">Jul 8</text>
              <text x="480" y="178" fontSize="8" fill="var(--text-muted)">Today</text>
            </svg>
          </div>
        </div>

        {/* SVG Chart 2: Agent Workload Resolution */}
        <div className={styles.card} style={{ height: "300px" }}>
          <div className={styles.chartTitle}>
            <span>Operator Resolution Performance</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            {/* Operator 1 */}
            <div>
              <div className={styles.flexBetween} style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                <span>Counsellor (Admissions Lead)</span>
                <strong>42 Chats Solved</strong>
              </div>
              <div style={{ height: "8px", width: "100%", backgroundColor: "var(--surface-container)", borderRadius: "4px" }}>
                <div style={{ height: "100%", width: "85%", backgroundColor: "var(--primary)", borderRadius: "4px" }}></div>
              </div>
            </div>
            {/* Operator 2 */}
            <div>
              <div className={styles.flexBetween} style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                <span>Admin Manager</span>
                <strong>18 Chats Solved</strong>
              </div>
              <div style={{ height: "8px", width: "100%", backgroundColor: "var(--surface-container)", borderRadius: "4px" }}>
                <div style={{ height: "100%", width: "45%", backgroundColor: "var(--secondary)", borderRadius: "4px" }}></div>
              </div>
            </div>
            {/* Operator 3 */}
            <div>
              <div className={styles.flexBetween} style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                <span>Receptionist Desk</span>
                <strong>12 Chats Solved</strong>
              </div>
              <div style={{ height: "8px", width: "100%", backgroundColor: "var(--surface-container)", borderRadius: "4px" }}>
                <div style={{ height: "100%", width: "30%", backgroundColor: "var(--tertiary)", borderRadius: "4px" }}></div>
              </div>
            </div>
            {/* Chatbot auto-solved */}
            <div>
              <div className={styles.flexBetween} style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                <span>🤖 Chatbot (Auto-rules)</span>
                <strong>88 Enquiries Solved</strong>
              </div>
              <div style={{ height: "8px", width: "100%", backgroundColor: "var(--surface-container)", borderRadius: "4px" }}>
                <div style={{ height: "100%", width: "95%", backgroundColor: "var(--success)", borderRadius: "4px" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
