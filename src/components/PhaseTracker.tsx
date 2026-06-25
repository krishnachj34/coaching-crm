import React from "react";
import styles from "../app/page.module.css";

interface Phase {
  number: number;
  name: string;
  desc: string;
  status: "completed" | "active" | "pending";
}

interface PhaseTrackerProps {
  phases: Phase[];
}

export default function PhaseTracker({ phases }: PhaseTrackerProps) {
  return (
    <div className={styles.infoSection}>
      <h2>Project Phase Tracker</h2>
      <p>This tracking system outlines the project roadmap. The active phase is fully functional and ready for dev work.</p>
      <div className={styles.phasesList}>
        {phases.map((phase) => {
          let itemClass = styles.phaseItem;
          let indicatorClass = styles.phaseIndicator;

          if (phase.status === "completed") {
            itemClass += ` ${styles.phaseItemCompleted}`;
            indicatorClass += ` ${styles.phaseIndicatorCompleted}`;
          } else if (phase.status === "active") {
            itemClass += ` ${styles.phaseItemActive}`;
            indicatorClass += ` ${styles.phaseIndicatorActive}`;
          } else {
            itemClass += ` ${styles.phaseItemPending}`;
            indicatorClass += ` ${styles.phaseIndicatorPending}`;
          }

          return (
            <div key={phase.number} className={itemClass}>
              <span className={indicatorClass}>{phase.status}</span>
              <span className={styles.phaseName}>
                Phase {phase.number}: {phase.name}
              </span>
              <span className={styles.phaseDesc}>{phase.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
