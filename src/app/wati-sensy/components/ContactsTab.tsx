"use client";

import React, { useState, useTransition } from "react";
import styles from "../styles/styles.module.css";
import { updateContactAttributes, saveSmartList, deleteSmartList } from "../actions";

interface ContactsTabProps {
  realLeads: any[];
  realStudents: any[];
  chatMetadata: any;
  smartLists?: any[];
  contactAttributes?: any;
}

export default function ContactsTab({ 
  realLeads, 
  realStudents, 
  chatMetadata,
  smartLists = [],
  contactAttributes = {}
}: ContactsTabProps) {
  const [activeSegment, setActiveSegment] = useState<string>("ALL"); // ALL, LEADS, STUDENTS, MOCK, SMART:smartId
  const [lists, setLists] = useState<any[]>(smartLists);
  const [attributes, setAttributes] = useState<any>(contactAttributes);

  const [csvText, setCsvText] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [search, setSearch] = useState("");

  // Smart list inputs
  const [showListForm, setShowListForm] = useState(false);
  const [listName, setListName] = useState("");
  const [listRuleKey, setListRuleKey] = useState("tag"); // tag, attribute
  const [listRuleField, setListRuleField] = useState("imported_list"); // tag name or attribute name
  const [listRuleVal, setListRuleVal] = useState(""); // attribute value (if attribute type)

  // Attribute editing modal
  const [editContact, setEditContact] = useState<any | null>(null);
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrVal, setNewAttrVal] = useState("");

  const [isPending, startTransition] = useTransition();

  const mockContacts = React.useMemo(() => {
    const list: any[] = [];
    Object.entries(chatMetadata).forEach(([phone, meta]: [string, any]) => {
      const inLeads = realLeads.some((l) => l.phone.replace(/[^0-9]/g, "") === phone);
      const inStudents = realStudents.some((s) => s.phone.replace(/[^0-9]/g, "") === phone);

      if (!inLeads && !inStudents) {
        list.push({
          id: `mock_${phone}`,
          name: `Simulated Contact (${phone.slice(-4)})`,
          phone: phone,
          email: `${phone}@sandbox.com`,
          type: "MOCK_SANDBOX",
          branch: "Marketing Sandbox",
          tags: meta.tags || [],
          createdAt: new Date().toISOString()
        });
      }
    });
    return list;
  }, [chatMetadata, realLeads, realStudents]);

  const allContacts = React.useMemo(() => {
    const leads = realLeads.map((l) => {
      const cleanPhone = l.phone.replace(/[^0-9]/g, "");
      const meta = chatMetadata[cleanPhone] || { tags: [] };
      return {
        id: l.id,
        name: l.name,
        phone: l.phone,
        email: l.email || "No Email",
        type: "LEAD",
        branch: l.branch?.name || "General",
        tags: meta.tags || [],
        createdAt: l.createdAt
      };
    });

    const students = realStudents.map((s) => {
      const cleanPhone = s.phone.replace(/[^0-9]/g, "");
      const meta = chatMetadata[cleanPhone] || { tags: [] };
      return {
        id: s.id,
        name: s.name,
        phone: s.phone,
        email: s.email || "No Email",
        type: "STUDENT",
        branch: s.branch?.name || "General",
        tags: meta.tags || [],
        createdAt: s.createdAt
      };
    });

    return [...leads, ...students, ...mockContacts];
  }, [realLeads, realStudents, mockContacts, chatMetadata]);

  // Handle Smart List Creation
  const handleCreateSmartList = () => {
    if (!listName.trim() || !listRuleField.trim()) return;

    const payload: any = {
      name: listName.trim(),
      rules: {}
    };

    if (listRuleKey === "tag") {
      payload.rules.tag = listRuleField.trim();
    } else {
      payload.rules.attribute = listRuleField.trim();
      payload.rules.value = listRuleVal.trim();
    }

    startTransition(async () => {
      try {
        const result = await saveSmartList(payload);
        if (result.success) {
          setLists(result.smartLists);
          setShowListForm(false);
          setListName("");
          setListRuleField("");
          setListRuleVal("");
        }
      } catch (err) {
        console.error("Failed to save smart list:", err);
      }
    });
  };

  const handleDeleteSmartList = (id: string) => {
    if (!confirm("Delete this smart list segment?")) return;
    startTransition(async () => {
      const result = await deleteSmartList(id);
      if (result.success) {
        setLists(result.smartLists);
        setActiveSegment("ALL");
      }
    });
  };

  // Attributes operations
  const handleSaveAttribute = () => {
    if (!editContact || !newAttrKey.trim() || !newAttrVal.trim()) return;

    const phone = editContact.phone.replace(/[^0-9]/g, "");
    const updatedAttrs = {
      ...(attributes[phone] || {}),
      [newAttrKey.trim()]: newAttrVal.trim()
    };

    startTransition(async () => {
      try {
        const result = await updateContactAttributes(phone, updatedAttrs);
        if (result.success) {
          setAttributes(result.contactAttributes);
          setNewAttrKey("");
          setNewAttrVal("");
          // Update details reference
          setEditContact((prev: any) => ({
            ...prev,
            attrs: updatedAttrs
          }));
        }
      } catch (err) {
        console.error("Failed to update attributes:", err);
      }
    });
  };

  const handleRemoveAttribute = (key: string) => {
    if (!editContact) return;
    const phone = editContact.phone.replace(/[^0-9]/g, "");
    
    const updatedAttrs = { ...(attributes[phone] || {}) };
    delete updatedAttrs[key];

    startTransition(async () => {
      try {
        const result = await updateContactAttributes(phone, updatedAttrs);
        if (result.success) {
          setAttributes(result.contactAttributes);
          setEditContact((prev: any) => ({
            ...prev,
            attrs: updatedAttrs
          }));
        }
      } catch (err) {
        console.error("Failed to remove attribute:", err);
      }
    });
  };

  // CSV Bulk Mock Import
  const handleCSVImport = () => {
    if (!csvText.trim()) return;
    const lines = csvText.split("\n");
    let count = 0;

    startTransition(async () => {
      try {
        const { updateChatMetadata } = await import("../actions");
        for (const line of lines) {
          const parts = line.split(",");
          if (parts.length >= 2) {
            const name = parts[0].trim();
            const phone = parts[1].trim().replace(/[^0-9]/g, "");
            
            if (phone.length >= 10) {
              await updateChatMetadata(phone, { tags: ["imported_list"] });
              count++;
            }
          }
        }
        setImportMessage(`Successfully imported ${count} test contacts!`);
        setCsvText("");
        window.location.reload();
      } catch (err) {
        console.error("Import error:", err);
        setImportMessage("Failed to process CSV file.");
      }
    });
  };

  // Filter contacts
  const filtered = allContacts.filter((c) => {
    const cleanSearch = search.toLowerCase();
    const matchesSearch = 
      c.name.toLowerCase().includes(cleanSearch) ||
      c.phone.includes(cleanSearch) ||
      c.email.toLowerCase().includes(cleanSearch) ||
      c.tags.some((t: string) => t.toLowerCase().includes(cleanSearch));

    if (!matchesSearch) return false;

    // Segment selectors
    if (activeSegment === "LEADS") return c.type === "LEAD";
    if (activeSegment === "STUDENTS") return c.type === "STUDENT";
    if (activeSegment === "MOCK") return c.type === "MOCK_SANDBOX";

    if (activeSegment.startsWith("SMART:")) {
      const smartId = activeSegment.replace("SMART:", "");
      const smart = lists.find(s => s.id === smartId);
      if (smart) {
        const rule = smart.rules;
        if (rule.tag) {
          return c.tags.includes(rule.tag);
        }
        if (rule.attribute) {
          const phone = c.phone.replace(/[^0-9]/g, "");
          const attrs = attributes[phone] || {};
          return attrs[rule.attribute] === rule.value;
        }
      }
    }

    return true;
  });

  return (
    <div>
      <div className={styles.flexBetween} style={{ marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Wati Smart Contacts Manager</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
            Inspect leads/students, customize database segment tags, and create custom smart list groups.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        {/* Left Column: Filter Segments & Smart List Creator */}
        <div style={{ width: "260px" }}>
          <div className={styles.card} style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Segments</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div 
                className={`${styles.cannedItem} ${activeSegment === "ALL" ? styles.activeFilterBtn : ""}`}
                style={{ padding: "0.4rem 0.75rem", cursor: "pointer", borderRadius: "6px" }}
                onClick={() => setActiveSegment("ALL")}
              >
                All Contacts ({allContacts.length})
              </div>
              <div 
                className={`${styles.cannedItem} ${activeSegment === "LEADS" ? styles.activeFilterBtn : ""}`}
                style={{ padding: "0.4rem 0.75rem", cursor: "pointer", borderRadius: "6px" }}
                onClick={() => setActiveSegment("LEADS")}
              >
                CRM Leads ({realLeads.length})
              </div>
              <div 
                className={`${styles.cannedItem} ${activeSegment === "STUDENTS" ? styles.activeFilterBtn : ""}`}
                style={{ padding: "0.4rem 0.75rem", cursor: "pointer", borderRadius: "6px" }}
                onClick={() => setActiveSegment("STUDENTS")}
              >
                Enrolled Students ({realStudents.length})
              </div>
              <div 
                className={`${styles.cannedItem} ${activeSegment === "MOCK" ? styles.activeFilterBtn : ""}`}
                style={{ padding: "0.4rem 0.75rem", cursor: "pointer", borderRadius: "6px" }}
                onClick={() => setActiveSegment("MOCK")}
              >
                Mock Sandbox ({mockContacts.length})
              </div>
            </div>
          </div>

          {/* Smart list creator */}
          <div className={styles.card}>
            <div className={styles.flexBetween} style={{ marginBottom: "0.75rem" }}>
              <h4 style={{ fontWeight: "bold" }}>Smart Lists</h4>
              <button 
                style={{ border: "none", background: "none", color: "var(--primary)", cursor: "pointer", fontSize: "0.75rem" }}
                onClick={() => setShowListForm(!showListForm)}
              >
                {showListForm ? "Cancel" : "+ Smart List"}
              </button>
            </div>

            {showListForm && (
              <div style={{ background: "var(--surface-container)", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <input 
                  type="text" 
                  placeholder="Smart List Name" 
                  value={listName} 
                  onChange={(e) => setListName(e.target.value)}
                  style={{ fontSize: "0.75rem", padding: "0.25rem" }}
                />
                <select value={listRuleKey} onChange={(e) => setListRuleKey(e.target.value)} style={{ fontSize: "0.75rem", padding: "0.25rem" }}>
                  <option value="tag">Matches Tag</option>
                  <option value="attribute">Matches Custom Attribute</option>
                </select>
                <input 
                  type="text" 
                  placeholder={listRuleKey === "tag" ? "Tag (e.g. Hot Lead)" : "Attribute Field (e.g. target_band)"}
                  value={listRuleField}
                  onChange={(e) => setListRuleField(e.target.value)}
                  style={{ fontSize: "0.75rem", padding: "0.25rem" }}
                />
                {listRuleKey === "attribute" && (
                  <input 
                    type="text" 
                    placeholder="Attribute Value (e.g. 8.0)"
                    value={listRuleVal}
                    onChange={(e) => setListRuleVal(e.target.value)}
                    style={{ fontSize: "0.75rem", padding: "0.25rem" }}
                  />
                )}
                <button onClick={handleCreateSmartList} style={{ fontSize: "0.75rem", padding: "0.3rem", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  Create Segment Group
                </button>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {lists.map(list => (
                <div 
                  key={list.id} 
                  className={`${styles.cannedItem} ${activeSegment === `SMART:${list.id}` ? styles.activeFilterBtn : ""}`}
                  style={{ padding: "0.4rem 0.5rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onClick={() => setActiveSegment(`SMART:${list.id}`)}
                >
                  <span style={{ fontSize: "0.75rem" }}>📁 {list.name}</span>
                  <button 
                    style={{ border: "none", background: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.8rem" }}
                    onClick={(e) => { e.stopPropagation(); handleDeleteSmartList(list.id); }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: List Contacts Table */}
        <div style={{ flex: 1.5, minWidth: "350px" }}>
          <div className={styles.flexBetween} style={{ marginBottom: "0.75rem" }}>
            <h4 style={{ fontWeight: "bold" }}>List Contacts</h4>
            <div className={styles.searchBox} style={{ width: "200px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>search</span>
              <input type="text" placeholder="Search name/tags..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th>Segment</th>
                  <th>Custom Attributes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const phone = c.phone.replace(/[^0-9]/g, "");
                  const attrs = attributes[phone] || {};
                  
                  return (
                    <tr key={c.id}>
                      <td><strong>{c.name}</strong></td>
                      <td>+{c.phone}</td>
                      <td><span className={styles.badge}>{c.type}</span></td>
                      <td style={{ fontSize: "0.75rem" }}>
                        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                          {Object.entries(attrs).map(([k, v]: [string, any]) => (
                            <span key={k} className={styles.tagMini} style={{ backgroundColor: "#eef2ff", color: "#4f46e5" }}>
                              {k}:{v}
                            </span>
                          ))}
                          {Object.keys(attrs).length === 0 && (
                            <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No fields</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button 
                          className={styles.secondaryBtn} 
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                          onClick={() => setEditContact({ ...c, attrs })}
                        >
                          ✏️ Attributes
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: CSV Importer */}
        <div style={{ width: "240px" }} className={styles.card}>
          <h4 style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>CSV Bulk Importer</h4>
          <textarea 
            placeholder="Aman,919000000001&#10;Priya,919000000002"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            style={{ width: "100%", height: "80px", fontSize: "0.75rem", padding: "0.4rem", marginBottom: "0.5rem", fontFamily: "monospace" }}
          />
          <button className={styles.primaryBtn} style={{ width: "100%", justifyContent: "center" }} onClick={handleCSVImport} disabled={isPending}>
            Import Contacts List
          </button>
          {importMessage && (
            <p style={{ fontSize: "0.75rem", color: "var(--primary)", marginTop: "0.5rem", fontWeight: "bold" }}>{importMessage}</p>
          )}
        </div>
      </div>

      {/* Edit Attributes Modal */}
      {editContact && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className={styles.card} style={{ width: "420px" }}>
            <div className={styles.flexBetween} style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontWeight: "bold" }}>Custom Attributes: {editContact.name}</h3>
              <button 
                style={{ border: "none", background: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--foreground)" }} 
                onClick={() => setEditContact(null)}
              >
                ×
              </button>
            </div>
            
            {/* List existing */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
              {Object.entries(editContact.attrs || {}).map(([key, val]: [string, any]) => (
                <div key={key} className={styles.flexBetween} style={{ padding: "0.4rem", background: "var(--surface-container)", borderRadius: "4px" }}>
                  <span style={{ fontSize: "0.8rem" }}><strong>{key}</strong>: {val}</span>
                  <button 
                    style={{ border: "none", background: "none", color: "var(--danger)", cursor: "pointer", fontWeight: "bold" }}
                    onClick={() => handleRemoveAttribute(key)}
                  >
                    ×
                  </button>
                </div>
              ))}
              {Object.keys(editContact.attrs || {}).length === 0 && (
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>No custom attributes mapped yet.</p>
              )}
            </div>

            {/* Form to add */}
            <div style={{ borderTop: "1px solid var(--outline-variant)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <input 
                type="text" 
                placeholder="Attribute Key (e.g. target_band)" 
                value={newAttrKey} 
                onChange={(e) => setNewAttrKey(e.target.value)}
                style={{ fontSize: "0.8rem", padding: "0.3rem" }}
              />
              <input 
                type="text" 
                placeholder="Value (e.g. 8.5)" 
                value={newAttrVal} 
                onChange={(e) => setNewAttrVal(e.target.value)}
                style={{ fontSize: "0.8rem", padding: "0.3rem" }}
              />
              <button className={styles.primaryBtn} onClick={handleSaveAttribute} disabled={isPending} style={{ width: "100%", justifyContent: "center" }}>
                Add Custom Attribute Field
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
