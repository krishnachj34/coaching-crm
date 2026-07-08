"use client";

import React, { useState } from "react";
import styles from "./Sidebar.module.css";
import { logout } from "@/app/login/actions";

interface SidebarProps {
  currentPhase: number;
}

export default function Sidebar({ currentPhase }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const [theme, setTheme] = useState("light");

  React.useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      setTheme(saved);
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const menuItems = [
    { name: "Dashboard",       path: "/",              active: currentPhase === 1 || currentPhase === 10, icon: "dashboard" },
    { name: "Lead Manager",    path: "/leads",         active: currentPhase === 8, icon: "person_search" },
    { name: "Staff Manager",   path: "/staff",         active: currentPhase === 2, icon: "manage_accounts" },
    { name: "Academics",       path: "/academics",     active: currentPhase === 3, icon: "school" },
    { name: "Student Manager", path: "/students",      active: currentPhase === 5, icon: "group" },
    { name: "Fees Manager",    path: "/fees",          active: currentPhase === 9, icon: "payments" },
    { name: "Attendance",      path: "/attendance",    active: currentPhase === 11, icon: "calendar_month" },
    { name: "Reports",         path: "/reports",       active: currentPhase === 12, icon: "trending_up" },
    { name: "Activity Log",    path: "/activity-log",  active: currentPhase === 13, icon: "history" },
    { name: "Automation",      path: "/automation",    active: currentPhase === 14, icon: "smart_toy" },
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
          {/* Theme Toggler */}
          <div 
            onClick={toggleTheme}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.75rem", 
              padding: "0.5rem 0.75rem", 
              borderRadius: "8px", 
              cursor: "pointer", 
              background: "var(--surface-container, #f1f5f9)",
              marginBottom: "1rem",
              fontSize: "0.85rem",
              fontWeight: "600",
              color: "var(--on-surface)",
              transition: "all 0.2s"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "1.2rem", color: theme === "dark" ? "#f59e0b" : "#4f46e5" }}>
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </div>

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
