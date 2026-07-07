"use client";

import React, { useState } from "react";
import styles from "./Sidebar.module.css";
import { logout } from "@/app/login/actions";

interface SidebarProps {
  currentPhase: number;
}

export default function Sidebar({ currentPhase }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuItems = [
    { name: "Dashboard",       path: "/",              active: currentPhase === 1 || currentPhase === 10, icon: "dashboard" },
    { name: "Staff Manager",   path: "/staff",         active: currentPhase === 2, icon: "manage_accounts" },
    { name: "Academics",       path: "/academics",     active: currentPhase === 3, icon: "school" },
    { name: "Student Manager", path: "/students",      active: currentPhase === 5, icon: "group" },
    { name: "Exam Manager",    path: "/exams",         active: currentPhase === 7, icon: "quiz" },
    { name: "Lead Manager",    path: "/leads",         active: currentPhase === 8, icon: "person_search" },
    { name: "Fees Manager",    path: "/fees",          active: currentPhase === 9, icon: "payments" },
    { name: "Attendance",      path: "/attendance",    active: currentPhase === 11, icon: "calendar_month" },
    { name: "Reports",         path: "/reports",       active: currentPhase === 12, icon: "trending_up" },
    { name: "Activity Log",    path: "/activity-log",  active: currentPhase === 13, icon: "history" },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className={styles.mobileHeader}>
        <button onClick={() => setIsOpen(true)} className={styles.menuToggleBtn} aria-label="Open Menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className={styles.mobileLogoArea}>
          <div className={styles.mobileLogoIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.1rem", color: "#fff" }}>school</span>
          </div>
          <h2 className={styles.mobileLogoTitle}>Coaching CRM</h2>
        </div>
        <div style={{ width: "40px" }} />
      </div>

      {/* Backdrop */}
      {isOpen && <div className={styles.backdrop} onClick={() => setIsOpen(false)} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
        {/* Mobile Close Button */}
        <button onClick={() => setIsOpen(false)} className={styles.closeMenuBtn} aria-label="Close Menu">
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Logo */}
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.4rem", color: "#fff" }}>school</span>
          </div>
          <div>
            <h2 className={styles.logoTitle}>Coaching CRM</h2>
            <span className={styles.logoSubtitle}>Linguist Dashboard</span>
          </div>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.path}
              className={`${styles.navItem} ${item.active ? styles.activeNavItem : ""}`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span className={`${styles.navIcon} material-symbols-outlined`}>{item.icon}</span>
              <span className={styles.navLabel}>{item.name}</span>
              {item.active && <span className={styles.activeIndicator} />}
            </a>
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.profileBlock}>
            <div className={styles.profileAvatar}>
              <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>person</span>
            </div>
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>Admin User</p>
              <p className={styles.profileRole}>Director</p>
            </div>
          </div>
          <form action={logout}>
            <button type="submit" className={styles.logoutButton}>
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>logout</span>
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
