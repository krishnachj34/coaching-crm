import React from "react";
import styles from "./Sidebar.module.css";
import { logout } from "@/app/login/actions";

interface SidebarProps {
  currentPhase: number;
}

export default function Sidebar({ currentPhase }: SidebarProps) {
  const menuItems = [
    { name: "Dashboard",  path: "/",          active: currentPhase === 1 || currentPhase === 10, icon: "dashboard" },
    { name: "Leads",      path: "/leads",      active: currentPhase === 4, icon: "person_search" },
    { name: "Students",   path: "/students",   active: currentPhase === 5, icon: "school" },
    { name: "Fees",       path: "/fees",       active: currentPhase === 6, icon: "payments" },
    { name: "Attendance", path: "/attendance", active: currentPhase === 7, icon: "calendar_month" },
    { name: "Reports",    path: "/reports",    active: currentPhase === 8, icon: "trending_up" },
  ];

  return (
    <aside className={styles.sidebar}>
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
  );
}
