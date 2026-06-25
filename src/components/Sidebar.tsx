import React from "react";
import styles from "../app/page.module.css";
import { logout } from "@/app/login/actions";

interface SidebarProps {
  currentPhase: number;
}

export default function Sidebar({ currentPhase }: SidebarProps) {
  const menuItems = [
    { name: "Dashboard", path: "/", active: currentPhase === 1 || currentPhase === 10, icon: "dashboard" },
    { name: "Leads", path: "/leads", active: currentPhase === 4, icon: "person_search" },
    { name: "Students", path: "/students", active: currentPhase === 5, icon: "school" },
    { name: "Fees", path: "/fees", active: currentPhase === 6, icon: "payments" },
    { name: "Attendance", path: "/attendance", active: currentPhase === 7, icon: "calendar_month" },
    { name: "Reports", path: "/reports", active: currentPhase === 8, icon: "trending_up" },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <h2 className={styles.logoTitle}>Coaching CRM</h2>
        <span className={styles.logoSubtitle}>Linguist CRM Dashboard</span>
      </div>
      <nav className={styles.nav}>
        {menuItems.map((item, index) => {
          let className = styles.navItem;
          if (item.active) {
            className += ` ${styles.activeNavItem}`;
          }
          return (
            <a key={index} href={item.path} className={className}>
              {item.icon && (
                <span className="material-symbols-outlined" style={{ fontSize: "1.2rem" }}>
                  {item.icon}
                </span>
              )}
              <span>{item.name}</span>
            </a>
          );
        })}
      </nav>
      
      <div className={styles.sidebarFooter}>
        <div className={styles.profileBlock}>
          <div className={styles.profileAvatar}>
            <span className="material-symbols-outlined">person</span>
          </div>
          <div className={styles.profileInfo}>
            <p className={styles.profileName}>Admin User</p>
            <p className={styles.profileRole}>Director</p>
          </div>
        </div>
        
        <form action={logout}>
          <button type="submit" className={styles.logoutButton}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>
              logout
            </span>
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

