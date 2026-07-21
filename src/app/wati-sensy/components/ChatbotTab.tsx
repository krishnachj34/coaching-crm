"use client";

import React, { useState, useTransition } from "react";
import styles from "../styles/styles.module.css";
import { 
  saveChatbotRule, 
  deleteChatbotRule, 
  saveCannedReply, 
  deleteCannedReply,
  saveFlow,
  deleteFlow,
  toggleFlowActive
} from "../actions";

interface ChatbotTabProps {
  initialConfig: any;
  initialRules: any[];
  initialCanned: any[];
  initialFlows?: any[];
}

export default function ChatbotTab({ 
  initialConfig, 
  initialRules, 
  initialCanned,
  initialFlows = []
}: ChatbotTabProps) {
  // DB Config
  const [botEnabled, setBotEnabled] = useState(initialConfig.botEnabled);
  const [botMode, setBotMode] = useState(initialConfig.botMode || "RULE_BASED");
  const [systemPrompt, setSystemPrompt] = useState(initialConfig.systemPrompt || "");
  const [welcomeMessage, setWelcomeMessage] = useState(initialConfig.welcomeMessage || "");
  const [fallbackMessage, setFallbackMessage] = useState(initialConfig.fallbackMessage || "");

  // Local state
  const [rules, setRules] = useState<any[]>(initialRules);
  const [canned, setCanned] = useState<any[]>(initialCanned);
  const [flows, setFlows] = useState<any[]>(initialFlows);

  const [activeBuilderSubTab, setActiveBuilderSubTab] = useState<string>("rules"); // rules, flows, canned

  // Keyword Rule Inputs
  const [ruleTrigger, setRuleTrigger] = useState("");
  const [ruleResponse, setRuleResponse] = useState("");
  const [editRuleId, setEditRuleId] = useState<string | null>(null);

  // Canned Reply Inputs
  const [cannedShortcut, setCannedShortcut] = useState("");
  const [cannedText, setCannedText] = useState("");
  const [editCannedId, setEditCannedId] = useState<string | null>(null);

  // Flow Builder Inputs
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [flowName, setFlowName] = useState("");
  const [flowTrigger, setFlowTrigger] = useState("");
  const [flowNodes, setFlowNodes] = useState<any[]>([]);

  // Node Editor Inputs
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [nodeType, setNodeType] = useState<string>("MESSAGE");
  const [nodeText, setNodeText] = useState("");
  const [nodeNextId, setNodeNextId] = useState("");
  const [nodeOperator, setNodeOperator] = useState("Counsellor");
  const [nodeBranches, setNodeBranches] = useState<any[]>([]);

  const [isPending, startTransition] = useTransition();

  const handleUpdateConfig = () => {
    startTransition(async () => {
      try {
        const { updateWhatsAppConfig } = await import("@/app/automation/actions");
        await updateWhatsAppConfig({
          botEnabled,
          botMode,
          systemPrompt,
          welcomeMessage,
          fallbackMessage
        });
        alert("CRM WhatsApp Chatbot database parameters updated!");
      } catch (err) {
        console.error("Failed to update bot config:", err);
      }
    });
  };

  const handleSaveRule = () => {
    if (!ruleTrigger.trim() || !ruleResponse.trim()) return;
    startTransition(async () => {
      const result = await saveChatbotRule({
        id: editRuleId || undefined,
        trigger: ruleTrigger.trim(),
        response: ruleResponse.trim(),
        active: true
      });
      if (result.success) {
        setRules(result.chatbotRules);
        setRuleTrigger("");
        setRuleResponse("");
        setEditRuleId(null);
      }
    });
  };

  const handleSaveCanned = () => {
    if (!cannedShortcut.trim() || !cannedText.trim()) return;
    startTransition(async () => {
      const result = await saveCannedReply({
        id: editCannedId || undefined,
        shortcut: cannedShortcut.trim(),
        text: cannedText.trim()
      });
      if (result.success) {
        setCanned(result.cannedReplies);
        setCannedShortcut("");
        setCannedText("");
        setEditCannedId(null);
      }
    });
  };
  const handleDeleteRule = (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    startTransition(async () => {
      const result = await deleteChatbotRule(id);
      if (result.success) {
        setRules(result.chatbotRules);
      }
    });
  };

  const handleDeleteCanned = (id: string) => {
    if (!confirm("Are you sure you want to delete this canned reply?")) return;
    startTransition(async () => {
      const result = await deleteCannedReply(id);
      if (result.success) {
        setCanned(result.cannedReplies);
      }
    });
  };

  // Flow Builder Mechanics
  const handleSelectFlow = (flow: any) => {
    setSelectedFlowId(flow.id);
    setFlowName(flow.name);
    setFlowTrigger(flow.trigger);
    setFlowNodes(flow.nodes || []);
    // Reset Node editor
    setEditingNodeId(null);
  };

  const handleCreateNewFlow = () => {
    setSelectedFlowId(null);
    setFlowName("New Interaction Flow");
    setFlowTrigger("enroll");
    setFlowNodes([
      { id: "node_root", type: "MESSAGE", text: "Welcome! Choose 1 or 2", nextNodeId: "node_branch" },
      { id: "node_branch", type: "BRANCH", branches: { "1": "node_courses", "2": "node_agent" } },
      { id: "node_courses", type: "MESSAGE", text: "Here is course info...", nextNodeId: null },
      { id: "node_agent", type: "ROUTE", operator: "Counsellor", text: "Routing to agent...", nextNodeId: null }
    ]);
  };

  const handleSaveFlowWorkspace = () => {
    if (!flowName.trim() || !flowTrigger.trim() || flowNodes.length === 0) return;
    const payload = {
      id: selectedFlowId || undefined,
      name: flowName.trim(),
      trigger: flowTrigger.trim().toLowerCase(),
      startNodeId: flowNodes[0]?.id || "node_root",
      nodes: flowNodes,
      active: true
    };
    startTransition(async () => {
      const result = await saveFlow(payload);
      if (result.success) {
        setFlows(result.flows);
        alert("Dialog Flow saved successfully!");
      }
    });
  };

  const handleEditNode = (node: any) => {
    setEditingNodeId(node.id);
    setNodeType(node.type);
    setNodeText(node.text || "");
    setNodeNextId(node.nextNodeId || "");
    setNodeOperator(node.operator || "Counsellor");
    
    // Map branches object to array for key editing
    if (node.type === "BRANCH" && node.branches) {
      setNodeBranches(
        Object.entries(node.branches).map(([key, val]) => ({ key, val }))
      );
    } else {
      setNodeBranches([]);
    }
  };

  const handleSaveNode = () => {
    if (!editingNodeId) return;

    let updatedNode: any = {
      id: editingNodeId,
      type: nodeType
    };

    if (nodeType === "MESSAGE") {
      updatedNode.text = nodeText;
      updatedNode.nextNodeId = nodeNextId || null;
    } else if (nodeType === "ROUTE") {
      updatedNode.operator = nodeOperator;
      updatedNode.text = nodeText;
      updatedNode.nextNodeId = null;
    } else if (nodeType === "BRANCH") {
      const branchMap: any = {};
      nodeBranches.forEach(b => {
        if (b.key.trim() && b.val.trim()) {
          branchMap[b.key.trim()] = b.val.trim();
        }
      });
      updatedNode.branches = branchMap;
      updatedNode.text = nodeText;
    }

    setFlowNodes(flowNodes.map(n => n.id === editingNodeId ? updatedNode : n));
    setEditingNodeId(null);
  };

  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "1.5rem" }}>
        Chatbot &amp; Interactive Flow Builder
      </h2>

      {/* Global Config switch */}
      <div className={styles.card} style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "1rem", color: "var(--primary)" }}>
          🤖 Chatbot Core Engine Config
        </h3>
        
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
          <div style={{ flex: 1, minWidth: "250px", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className={styles.toggleSwitch} onClick={() => setBotEnabled(!botEnabled)}>
              <span className="material-symbols-outlined" style={{ color: botEnabled ? "var(--success)" : "var(--text-muted)", fontSize: "1.8rem" }}>
                {botEnabled ? "toggle_on" : "toggle_off"}
              </span>
              <div>
                <strong>Active Live Bot Responses</strong>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
                  Toggle chatbot processing for incoming webhook simulator inputs.
                </span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Chatbot Core Engine Mode</label>
              <select value={botMode} onChange={(e) => setBotMode(e.target.value)}>
                <option value="RULE_BASED">Rule-Based / Flows (Flows, triggers, and fallback)</option>
                <option value="AI">AI Agent Mode (AI response heuristics simulator)</option>
              </select>
            </div>
          </div>

          <div style={{ flex: 1.5, minWidth: "300px" }}>
            {botMode === "AI" ? (
              <div className={styles.formGroup}>
                <label>AI System Instructions Prompt</label>
                <textarea 
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  style={{ height: "80px" }}
                  placeholder="You are counselor at IELTS..."
                />
              </div>
            ) : (
              <div style={{ display: "flex", gap: "1rem" }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Welcome Message</label>
                  <input 
                    type="text" 
                    value={welcomeMessage} 
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Fallback Message</label>
                  <input 
                    type="text" 
                    value={fallbackMessage} 
                    onChange={(e) => setFallbackMessage(e.target.value)}
                  />
                </div>
              </div>
            )}
            <button 
              className={styles.primaryBtn} 
              onClick={handleUpdateConfig} 
              disabled={isPending}
              style={{ marginTop: "1rem", float: "right" }}
            >
              Update Chatbot Engine
            </button>
          </div>
        </div>
      </div>

      {/* Sub tabs for builder type */}
      <div className={styles.filterTabs} style={{ marginBottom: "1.5rem", maxWidth: "450px" }}>
        <button 
          className={`${styles.filterBtn} ${activeBuilderSubTab === "rules" ? styles.activeFilterBtn : ""}`}
          onClick={() => setActiveBuilderSubTab("rules")}
        >
          Keyword Rules
        </button>
        <button 
          className={`${styles.filterBtn} ${activeBuilderSubTab === "flows" ? styles.activeFilterBtn : ""}`}
          onClick={() => setActiveBuilderSubTab("flows")}
        >
          Dialog Flow Builder (Wati Visual Tree)
        </button>
        <button 
          className={`${styles.filterBtn} ${activeBuilderSubTab === "canned" ? styles.activeFilterBtn : ""}`}
          onClick={() => setActiveBuilderSubTab("canned")}
        >
          Canned Replies
        </button>
      </div>

      {/* TAB content: Rules */}
      {activeBuilderSubTab === "rules" && (
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "250px" }} className={styles.card}>
            <h4 style={{ fontWeight: "bold", marginBottom: "1rem" }}>Add Keyword Rule</h4>
            <div className={styles.formGroup} style={{ marginBottom: "1rem" }}>
              <label>Keyword Trigger</label>
              <input 
                type="text" 
                placeholder="e.g. syllabus" 
                value={ruleTrigger}
                onChange={(e) => setRuleTrigger(e.target.value)}
              />
            </div>
            <div className={styles.formGroup} style={{ marginBottom: "1rem" }}>
              <label>Bot Response</label>
              <textarea 
                placeholder="Write the auto-reply content..."
                value={ruleResponse}
                onChange={(e) => setRuleResponse(e.target.value)}
                style={{ height: "60px" }}
              />
            </div>
            <button className={styles.primaryBtn} onClick={handleSaveRule} disabled={isPending}>
              Save Keyword Rule
            </button>
          </div>

          <div style={{ flex: 2, minWidth: "350px" }} className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Trigger Keyword</th>
                  <th>Auto Response</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.trigger}</strong></td>
                    <td>{r.response}</td>
                    <td>
                      <button 
                        style={{ border: "none", background: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.8rem" }}
                        onClick={() => handleDeleteRule(r.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB content: Dialog Flow Builder (Interactive flow sheets) */}
      {activeBuilderSubTab === "flows" && (
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          {/* List of flows on left */}
          <div style={{ width: "260px" }} className={styles.card}>
            <div className={styles.flexBetween} style={{ marginBottom: "1rem" }}>
              <h4 style={{ fontWeight: "bold" }}>Dialog Trees</h4>
              <button 
                onClick={handleCreateNewFlow}
                style={{ border: "none", background: "none", color: "var(--primary)", cursor: "pointer", fontSize: "0.8rem" }}
              >
                + Create Flow
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {flows.map((f) => (
                <div 
                  key={f.id}
                  onClick={() => handleSelectFlow(f)}
                  className={styles.cannedItem}
                  style={{
                    padding: "0.5rem",
                    textAlign: "left",
                    backgroundColor: selectedFlowId === f.id ? "var(--primary-light)" : "var(--surface-container-low)"
                  }}
                >
                  <strong>{f.name}</strong>
                  <span style={{ fontSize: "0.65rem", display: "block", color: "var(--text-muted)" }}>
                    Trigger keyword: <strong>"{f.trigger}"</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Flow Workspace Editor */}
          {flowNodes.length > 0 ? (
            <div style={{ flex: 1, minWidth: "300px" }} className={styles.card}>
              <div className={styles.flexBetween} style={{ marginBottom: "1rem" }}>
                <input 
                  type="text"
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  style={{ fontSize: "1rem", fontWeight: "bold", border: "none", borderBottom: "1px solid var(--outline-variant)", outline: "none", backgroundColor: "transparent", color: "var(--foreground)" }}
                />
                <div className={styles.flexGap}>
                  <div className={styles.formGroup} style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>Trigger word:</label>
                    <input 
                      type="text" 
                      value={flowTrigger} 
                      onChange={(e) => setFlowTrigger(e.target.value)}
                      style={{ fontSize: "0.75rem", padding: "0.2rem", width: "90px", border: "1px solid var(--outline-variant)" }}
                    />
                  </div>
                  <button className={styles.primaryBtn} onClick={handleSaveFlowWorkspace} disabled={isPending}>
                    Save Tree Flow
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1.5rem" }}>
                {/* Nodes list builder */}
                <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <h5 style={{ fontWeight: "bold" }}>Flow Steps Flowchart</h5>
                  <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {flowNodes.map((node) => (
                      <div 
                        key={node.id} 
                        onClick={() => handleEditNode(node)}
                        className={styles.ruleRow}
                        style={{
                          cursor: "pointer",
                          borderColor: editingNodeId === node.id ? "var(--primary)" : "var(--outline-variant)",
                          backgroundColor: editingNodeId === node.id ? "var(--primary-light)" : "var(--surface)"
                        }}
                      >
                        <div className={styles.flexBetween}>
                          <strong>Node ID: {node.id}</strong>
                          <span className={styles.badge} style={{ fontSize: "0.65rem" }}>{node.type}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.75rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {node.type === "BRANCH" ? `Branches: ${Object.keys(node.branches || {}).join(", ")}` : node.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Node Detail editor */}
                {editingNodeId && (
                  <div style={{ flex: 1.5, background: "var(--surface-container)", padding: "1rem", borderRadius: "8px" }}>
                    <h5 style={{ fontWeight: "bold", marginBottom: "0.75rem" }}>Edit Step {editingNodeId}</h5>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <div className={styles.formGroup}>
                        <label>Node Step Type</label>
                        <select value={nodeType} onChange={(e) => setNodeType(e.target.value)}>
                          <option value="MESSAGE">Message Box</option>
                          <option value="BRANCH">User Option Branching</option>
                          <option value="ROUTE">Route to Counselor</option>
                        </select>
                      </div>

                      {nodeType !== "BRANCH" ? (
                        <div className={styles.formGroup}>
                          <label>Bot Message Content</label>
                          <textarea 
                            value={nodeText} 
                            onChange={(e) => setNodeText(e.target.value)} 
                            style={{ height: "60px", fontSize: "0.8rem" }}
                          />
                        </div>
                      ) : (
                        <div className={styles.formGroup}>
                          <label>Branching Instructions Text</label>
                          <textarea 
                            value={nodeText} 
                            onChange={(e) => setNodeText(e.target.value)} 
                            style={{ height: "50px", fontSize: "0.8rem" }}
                          />
                        </div>
                      )}

                      {nodeType === "MESSAGE" && (
                        <div className={styles.formGroup}>
                          <label>Next Step Node ID</label>
                          <select value={nodeNextId} onChange={(e) => setNodeNextId(e.target.value)}>
                            <option value="">End Flow</option>
                            {flowNodes.filter(n => n.id !== editingNodeId).map(n => (
                              <option key={n.id} value={n.id}>{n.id} ({n.type})</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {nodeType === "ROUTE" && (
                        <div className={styles.formGroup}>
                          <label>Target Counselor Department</label>
                          <select value={nodeOperator} onChange={(e) => setNodeOperator(e.target.value)}>
                            <option value="Counsellor">Admissions Counselor</option>
                            <option value="Admin">Admin Office</option>
                            <option value="Receptionist">Front Desk</option>
                          </select>
                        </div>
                      )}

                      {nodeType === "BRANCH" && (
                        <div>
                          <label style={{ fontSize: "0.8rem", fontWeight: "bold", display: "block", marginBottom: "0.25rem" }}>Choices Routing Mapping</label>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                            {nodeBranches.map((b, idx) => (
                              <div key={idx} style={{ display: "flex", gap: "0.25rem" }}>
                                <input 
                                  type="text" 
                                  placeholder="Option key" 
                                  value={b.key} 
                                  onChange={(e) => {
                                    setNodeBranches(nodeBranches.map((item, i) => i === idx ? { ...item, key: e.target.value } : item));
                                  }}
                                  style={{ flex: 1, fontSize: "0.75rem" }}
                                />
                                <select 
                                  value={b.val}
                                  onChange={(e) => {
                                    setNodeBranches(nodeBranches.map((item, i) => i === idx ? { ...item, val: e.target.value } : item));
                                  }}
                                  style={{ flex: 1.5, fontSize: "0.75rem" }}
                                >
                                  <option value="">Select Destination</option>
                                  {flowNodes.filter(n => n.id !== editingNodeId).map(n => (
                                    <option key={n.id} value={n.id}>{n.id} ({n.type})</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                            <button 
                              type="button" 
                              onClick={() => setNodeBranches([...nodeBranches, { key: "", val: "" }])}
                              style={{ fontSize: "0.7rem", padding: "0.25rem", cursor: "pointer", border: "1px dashed var(--outline)" }}
                            >
                              + Add Route Choice
                            </button>
                          </div>
                        </div>
                      )}

                      <button className={styles.primaryBtn} onClick={handleSaveNode} style={{ padding: "0.4rem", fontSize: "0.8rem", width: "100%" }}>
                        Save Step Node
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }} className={styles.card}>
              <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "var(--primary)" }}>account_tree</span>
              <h3>No Flow Tree Workspace Loaded</h3>
              <p style={{ fontSize: "0.8rem" }}>Select an existing dialogue template on the left or construct a new flow tree.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB content: Canned */}
      {activeBuilderSubTab === "canned" && (
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "250px" }} className={styles.card}>
            <h4 style={{ fontWeight: "bold", marginBottom: "1rem" }}>Add Quick Shortcut</h4>
            <div className={styles.formGroup} style={{ marginBottom: "1rem" }}>
              <label>Shortcut Keyword (e.g. /info)</label>
              <input 
                type="text" 
                placeholder="/shortcut" 
                value={cannedShortcut}
                onChange={(e) => setCannedShortcut(e.target.value)}
              />
            </div>
            <div className={styles.formGroup} style={{ marginBottom: "1rem" }}>
              <label>Shortcode Expansion Text</label>
              <textarea 
                placeholder="Expand text..."
                value={cannedText}
                onChange={(e) => setCannedText(e.target.value)}
                style={{ height: "60px" }}
              />
            </div>
            <button className={styles.primaryBtn} onClick={handleSaveCanned} disabled={isPending}>
              Save Quick Canned Reply
            </button>
          </div>

          <div style={{ flex: 2, minWidth: "350px" }} className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Shortcut</th>
                  <th>Message Expanded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {canned.map((c) => (
                  <tr key={c.id}>
                    <td><span className={styles.badge}>{c.shortcut}</span></td>
                    <td>{c.text}</td>
                    <td>
                      <button 
                        style={{ border: "none", background: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.8rem" }}
                        onClick={() => handleDeleteCanned(c.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
