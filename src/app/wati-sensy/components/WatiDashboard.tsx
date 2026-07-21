"use client";

import React, { useState } from "react";
import styles from "../styles/styles.module.css";
import InboxTab from "./InboxTab";
import CampaignsTab from "./CampaignsTab";
import TemplatesTab from "./TemplatesTab";
import ChatbotTab from "./ChatbotTab";
import ContactsTab from "./ContactsTab";
import AnalyticsTab from "./AnalyticsTab";

interface WatiDashboardProps {
  config: any;
  chats: any[];
  campaigns: any[];
  templates: any[];
  cannedReplies: any[];
  chatbotRules: any[];
  chatMetadata: any;
  leads: any[];
  students: any[];
  flows?: any[];
  dripSequences?: any[];
  smartLists?: any[];
  contactAttributes?: any;
}

export default function WatiDashboard({
  config,
  chats,
  campaigns,
  templates,
  cannedReplies,
  chatbotRules,
  chatMetadata,
  leads,
  students,
  flows = [],
  dripSequences = [],
  smartLists = [],
  contactAttributes = {},
}: WatiDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>("inbox");

  const renderTabContent = () => {
    switch (activeTab) {
      case "inbox":
        return <InboxTab initialChats={chats} cannedReplies={cannedReplies} />;
      case "campaigns":
        return (
          <CampaignsTab 
            initialCampaigns={campaigns} 
            templates={templates} 
            chatMetadata={chatMetadata} 
            dripSequences={dripSequences}
          />
        );
      case "templates":
        return <TemplatesTab initialTemplates={templates} />;
      case "chatbot":
        return (
          <ChatbotTab 
            initialConfig={config} 
            initialRules={chatbotRules} 
            initialCanned={cannedReplies} 
            initialFlows={flows}
          />
        );
      case "contacts":
        return (
          <ContactsTab 
            realLeads={leads} 
            realStudents={students} 
            chatMetadata={chatMetadata} 
            smartLists={smartLists}
            contactAttributes={contactAttributes}
          />
        );
      case "analytics":
        return <AnalyticsTab campaigns={campaigns} chatsCount={chats.length} />;
      default:
        return <InboxTab initialChats={chats} cannedReplies={cannedReplies} />;
    }
  };

  const menuItems = [
    { id: "inbox", label: "Shared Inbox", icon: "forum" },
    { id: "campaigns", label: "Broadcasts & Drips", icon: "campaign" },
    { id: "templates", label: "Template Manager", icon: "drafts" },
    { id: "chatbot", label: "Flows & Chatbots", icon: "account_tree" },
    { id: "contacts", label: "Smart Segments", icon: "contact_page" },
    { id: "analytics", label: "SLA & Analytics", icon: "analytics" },
  ];

  return (
    <div className={styles.container}>
      {/* Test Navigation Bar */}
      <aside className={styles.navbar}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <span className="material-symbols-outlined">hub</span>
          </div>
          <div>
            <h2 className={styles.logoTitle}>AISensy / Wati</h2>
            <span className={styles.logoSubtitle}>Enterprise Sandbox Suite</span>
          </div>
        </div>

        <nav className={styles.navMenu}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`${styles.navItem} ${activeTab === item.id ? styles.activeNavItem : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className={`${styles.navIcon} material-symbols-outlined`}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <a href="/" className={styles.secondaryBtn} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.5rem", borderRadius: "8px", textDecoration: "none", fontSize: "0.85rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>arrow_back</span>
            <span>Back to Main CRM</span>
          </a>
          <div className={styles.navFooter}>
            <span>Enterprise Suite v2.0</span>
          </div>
        </div>
      </aside>

      {/* Main tab content */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <h1>Wati &amp; AISensy Workspace</h1>
            <p>Professional Sandbox Mode — Enterprise features fully simulated</p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.badge}>Status: Enterprise Sandbox</span>
          </div>
        </header>

        <section className={styles.tabBody}>
          {renderTabContent()}
        </section>
      </main>
    </div>
  );
}
