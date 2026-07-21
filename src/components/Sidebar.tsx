"use client";

import React, { useState } from "react";
import styles from "./Sidebar.module.css";
import { logout } from "@/app/login/actions";
import InstituteGatewayModal from "./InstituteGatewayModal";

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

  const [activeInstituteMeta, setActiveInstituteMeta] = useState<any>(null);
  const [activeInstituteId, setActiveInstituteId] = useState<string>("ALL");
  const [gatewayOpen, setGatewayOpen] = useState(false);

  React.useEffect(() => {
    async function fetchInstitute() {
      try {
        const { getCurrentInstituteContext } = await import("@/app/instituteActions");
        const ctx = await getCurrentInstituteContext();
        setActiveInstituteMeta(ctx.metadata);
        setActiveInstituteId(ctx.activeInstituteId);
      } catch (e) {
        console.error("Error loading institute in sidebar:", e);
      }
    }
    fetchInstitute();
  }, []);

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
    // Marketing Suite Sandbox. Delete the `/wati-sensy` folder and this item to remove completely.
    { name: "Wati / AISensy Suite", path: "/wati-sensy", active: currentPhase === 99, icon: "hub" },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className={styles.mobileHeader}>
        <button onClick={() => setIsOpen(true)} className={styles.menuToggleBtn} aria-label="Open Menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className={styles.mobileLogoArea} onClick={() => setGatewayOpen(true)} style={{ cursor: "pointer" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "1.5rem", color: activeInstituteMeta?.primaryColor || "#4f46e5" }}>
            {activeInstituteMeta?.icon || "domain"}
          </span>
          <h2 className={styles.mobileLogoTitle}>{activeInstituteMeta?.shortName || "Foreign Language Wala"}</h2>
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

        {/* Logo & Institute Gateway Launcher */}
        <div 
          className={styles.logoArea}
          onClick={() => window.location.href = "/portal-select"}
          style={{ cursor: "pointer", transition: "transform 0.2s" }}
          title="Click to Return to 2-Box Chooser Landing Page"
        >
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: activeInstituteMeta?.gradient || "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            flexShrink: 0
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.5rem" }}>
              {activeInstituteMeta?.icon || "translate"}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className={styles.logoTitle} style={{ fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {activeInstituteMeta?.name || "Foreign Language Wala"}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <span className={styles.logoSubtitle} style={{ color: activeInstituteMeta?.primaryColor || "#4f46e5", fontWeight: "700" }}>
                {activeInstituteMeta?.badge || "Admissions CRM"}
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: "0.9rem", color: "#64748b" }}>
                published_with_changes
              </span>
            </div>
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

      <InstituteGatewayModal
        isOpen={gatewayOpen}
        onClose={() => setGatewayOpen(false)}
        currentActive={activeInstituteId as any}
      />
    </>
  );
}
