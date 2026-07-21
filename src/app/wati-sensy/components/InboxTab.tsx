"use client";

import React, { useState, useEffect, useTransition } from "react";
import styles from "../styles/styles.module.css";
import { 
  getChatDetails, 
  sendInboxMessage, 
  addInternalNote, 
  updateChatMetadata, 
  simulateIncomingWebhook 
} from "../actions";

interface InboxTabProps {
  initialChats: any[];
  cannedReplies: any[];
}

const OPERATORS = ["Unassigned", "Admin", "Counsellor", "IELTS Instructor", "Receptionist", "Solved"];

export default function InboxTab({ initialChats, cannedReplies }: InboxTabProps) {
  const [chats, setChats] = useState<any[]>(initialChats);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [chatDetail, setChatDetail] = useState<any | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("ALL"); // ALL, ACTIVE, PENDING, SOLVED
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Message Input
  const [textInput, setTextInput] = useState<string>("");
  
  // Tag Editor
  const [newTagInput, setNewTagInput] = useState<string>("");

  // Webhook Simulator Inputs
  const [simPhone, setSimPhone] = useState<string>("919876543210");
  const [simName, setSimName] = useState<string>("Jane Doe");
  const [simMsg, setSimMsg] = useState<string>("hi"); // Default to flow trigger keyword "hi"

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (selectedPhone) {
      loadChatDetails(selectedPhone);
    } else {
      setChatDetail(null);
    }
  }, [selectedPhone]);

  const loadChatDetails = async (phone: string) => {
    try {
      const details = await getChatDetails(phone);
      setChatDetail(details);
    } catch (err) {
      console.error("Failed to load chat details:", err);
    }
  };

  const handleSend = () => {
    if (!selectedPhone || !textInput.trim()) return;
    
    const messageContent = textInput.trim();
    setTextInput("");

    startTransition(async () => {
      try {
        const result = await sendInboxMessage(selectedPhone, messageContent);
        if (result.success) {
          await loadChatDetails(selectedPhone);
          await refreshThreads();
        }
      } catch (err) {
        console.error("Failed to send message:", err);
      }
    });
  };

  const handleCannedClick = (text: string) => {
    setTextInput(text);
  };

  const handleAddNote = () => {
    if (!selectedPhone || !textInput.trim()) return;
    
    const noteContent = textInput.trim();
    setTextInput("");

    startTransition(async () => {
      try {
        const result = await addInternalNote(selectedPhone, noteContent);
        if (result.success) {
          await loadChatDetails(selectedPhone);
          await refreshThreads();
        }
      } catch (err) {
        console.error("Failed to add note:", err);
      }
    });
  };

  const handleOperatorChange = (operator: string) => {
    if (!selectedPhone) return;

    startTransition(async () => {
      try {
        const result = await updateChatMetadata(selectedPhone, { assignedOperator: operator });
        if (result.success) {
          setChatDetail((prev: any) => prev ? { ...prev, assignedOperator: operator } : null);
          await refreshThreads();
        }
      } catch (err) {
        console.error("Failed to update operator:", err);
      }
    });
  };

  const handleAddTag = () => {
    if (!selectedPhone || !newTagInput.trim() || !chatDetail) return;
    const cleanTag = newTagInput.trim();
    if (chatDetail.tags.includes(cleanTag)) return;

    const updatedTags = [...chatDetail.tags, cleanTag];
    setNewTagInput("");

    startTransition(async () => {
      try {
        const result = await updateChatMetadata(selectedPhone, { tags: updatedTags });
        if (result.success) {
          setChatDetail((prev: any) => prev ? { ...prev, tags: updatedTags } : null);
          await refreshThreads();
        }
      } catch (err) {
        console.error("Failed to add tag:", err);
      }
    });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedPhone || !chatDetail) return;
    
    const updatedTags = chatDetail.tags.filter((t: string) => t !== tagToRemove);

    startTransition(async () => {
      try {
        const result = await updateChatMetadata(selectedPhone, { tags: updatedTags });
        if (result.success) {
          setChatDetail((prev: any) => prev ? { ...prev, tags: updatedTags } : null);
          await refreshThreads();
        }
      } catch (err) {
        console.error("Failed to remove tag:", err);
      }
    });
  };

  const handleSimulateWebhook = () => {
    if (!simPhone.trim() || !simMsg.trim()) return;

    startTransition(async () => {
      try {
        const result = await simulateIncomingWebhook(simPhone, simName, simMsg);
        if (result.success) {
          setSimMsg("");
          setSelectedPhone(simPhone);
          await loadChatDetails(simPhone);
          await refreshThreads();
        }
      } catch (err) {
        console.error("Failed to simulate incoming message:", err);
      }
    });
  };

  const refreshThreads = async () => {
    const { getInboxChats } = await import("../actions");
    const updated = await getInboxChats();
    setChats(updated);
  };

  // Filter threads
  const filteredChats = chats.filter((c) => {
    const matchesSearch = 
      c.phone.includes(searchQuery) || 
      c.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === "ACTIVE") {
      return c.assignedOperator !== "Unassigned" && c.assignedOperator !== "Solved";
    }
    if (activeFilter === "PENDING") {
      return c.assignedOperator === "Unassigned";
    }
    if (activeFilter === "SOLVED") {
      return c.assignedOperator === "Solved";
    }

    return true;
  });

  return (
    <div className={styles.inboxLayout}>
      {/* Pane 1: Chat List */}
      <div className={styles.chatListPanel}>
        <div className={styles.chatListHeader}>
          <div className={styles.searchBox}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>search</span>
            <input 
              type="text" 
              placeholder="Search phone, name or content..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.filterTabs}>
            <button 
              className={`${styles.filterBtn} ${activeFilter === "ALL" ? styles.activeFilterBtn : ""}`}
              onClick={() => setActiveFilter("ALL")}
            >
              All
            </button>
            <button 
              className={`${styles.filterBtn} ${activeFilter === "ACTIVE" ? styles.activeFilterBtn : ""}`}
              onClick={() => setActiveFilter("ACTIVE")}
            >
              Active
            </button>
            <button 
              className={`${styles.filterBtn} ${activeFilter === "PENDING" ? styles.activeFilterBtn : ""}`}
              onClick={() => setActiveFilter("PENDING")}
            >
              Pending
            </button>
            <button 
              className={`${styles.filterBtn} ${activeFilter === "SOLVED" ? styles.activeFilterBtn : ""}`}
              onClick={() => setActiveFilter("SOLVED")}
            >
              Solved
            </button>
          </div>
        </div>

        <div className={styles.chatList}>
          {filteredChats.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center" }} className={styles.textMuted}>
              No chats found. Use Webhook Simulator below to add test messages!
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isSlaBreached = chat.direction === "INCOMING" && chat.assignedOperator !== "Solved";
              
              return (
                <div 
                  key={chat.phone} 
                  className={`${styles.chatItem} ${selectedPhone === chat.phone ? styles.activeChatItem : ""}`}
                  onClick={() => setSelectedPhone(chat.phone)}
                >
                  <div className={styles.chatItemHeader}>
                    <span className={styles.chatName}>{chat.leadName}</span>
                    <span className={styles.chatTime}>
                      {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={styles.chatBody}>{chat.lastMessage}</p>
                  
                  {/* SLA Warning trigger */}
                  {isSlaBreached && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--danger)", fontSize: "0.7rem", fontWeight: "bold", margin: "0.25rem 0" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "0.9rem" }}>timer</span>
                      <span>SLA Alert: Unanswered Client Query</span>
                    </div>
                  )}

                  <div className={styles.chatBadges}>
                    <span className={`${styles.tagMini} ${styles.operatorTag}`}>
                      🧑‍💻 {chat.assignedOperator}
                    </span>
                    {chat.tags.map((tag: string) => (
                      <span key={tag} className={styles.tagMini}>🏷️ {tag}</span>
                    ))}
                    {chat.internalNotesCount > 0 && (
                      <span className={styles.tagMini} style={{ backgroundColor: "#fef3c7", color: "#b45309" }}>
                        📝 {chat.internalNotesCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Webhook incoming simulator */}
        <div className={styles.simulatorBlock}>
          <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.5rem", color: "var(--primary)" }}>
            ⚡ Meta Webhook Simulator
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              <input 
                type="text" 
                placeholder="Phone (e.g. 919876543210)" 
                style={{ flex: 1, fontSize: "0.75rem", padding: "0.25rem", border: "1px solid var(--outline-variant)", borderRadius: "4px", backgroundColor: "var(--surface)", color: "var(--foreground)" }} 
                value={simPhone}
                onChange={(e) => setSimPhone(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="Name" 
                style={{ flex: 1, fontSize: "0.75rem", padding: "0.25rem", border: "1px solid var(--outline-variant)", borderRadius: "4px", backgroundColor: "var(--surface)", color: "var(--foreground)" }} 
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
              />
            </div>
            <textarea 
              placeholder="Incoming message or dialog flow trigger (e.g. 'start')" 
              style={{ fontSize: "0.75rem", padding: "0.25rem", border: "1px solid var(--outline-variant)", borderRadius: "4px", height: "40px", resize: "none", backgroundColor: "var(--surface)", color: "var(--foreground)" }} 
              value={simMsg}
              onChange={(e) => setSimMsg(e.target.value)}
            />
            <button 
              onClick={handleSimulateWebhook}
              disabled={isPending}
              style={{ padding: "0.3rem", fontSize: "0.7rem", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
            >
              {isPending ? "Simulating..." : "Trigger Incoming Webhook Message"}
            </button>
          </div>
        </div>
      </div>

      {/* Pane 2: Chat Window */}
      <div className={styles.chatPane}>
        {chatDetail ? (
          <>
            <div className={styles.chatPaneHeader}>
              <div className={styles.headerContactInfo}>
                <h3>{chatDetail.contactInfo?.name}</h3>
                <p>+{chatDetail.phone} | {chatDetail.contactInfo?.branch} | {chatDetail.contactInfo?.type}</p>
              </div>
              <div className={styles.operatorAssign}>
                <span>Workflow Status:</span>
                <select 
                  value={chatDetail.assignedOperator}
                  onChange={(e) => handleOperatorChange(e.target.value)}
                >
                  {OPERATORS.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.messagesThread}>
              {chatDetail.messages?.map((msg: any) => {
                const isIncoming = msg.direction === "INCOMING";
                const isTemplate = msg.messageType === "template";
                
                return (
                  <div 
                    key={msg.id} 
                    className={`${styles.msgRow} ${isIncoming ? styles.msgIncoming : styles.msgOutgoing}`}
                  >
                    <div className={styles.bubble}>
                      {isTemplate && (
                        <div style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "0.25rem", marginBottom: "0.25rem", fontSize: "0.7rem", fontWeight: "bold", color: "#128c7e" }}>
                          📢 Broadcast Template
                        </div>
                      )}
                      <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                      <div className={styles.bubbleMeta}>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {!isIncoming && (
                          <span className="material-symbols-outlined" style={{ fontSize: "0.9rem", color: msg.status === "READ" ? "#34b7f1" : "inherit" }}>
                            {msg.status === "READ" ? "done_all" : msg.status === "DELIVERED" ? "done_all" : "done"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Injected Yellow Internal Notes */}
              {chatDetail.internalNotes?.map((note: any) => (
                <div key={note.id} className={`${styles.msgRow} ${styles.noteBubble}`}>
                  <div className={styles.bubble}>
                    <p style={{ margin: 0 }}>
                      {note.content.includes("CSAT Rating") ? "⭐ CSAT SURVEY NOTE:" : "🔒 Internal Agent Note:"} {note.content}
                    </p>
                    <div className={styles.bubbleMeta}>
                      <span>by {note.author} | {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.inputArea}>
              {/* Quick Replies Panel */}
              <div className={styles.cannedPanel}>
                <span style={{ fontSize: "0.75rem", alignSelf: "center", color: "var(--text-muted)", fontWeight: "600", marginRight: "0.25rem" }}>
                  Quick:
                </span>
                {cannedReplies.map((reply) => (
                  <button 
                    key={reply.id} 
                    className={styles.cannedItem}
                    onClick={() => handleCannedClick(reply.text)}
                    title={reply.text}
                  >
                    {reply.shortcut}
                  </button>
                ))}
              </div>

              <div className={styles.textInputRow}>
                <textarea 
                  placeholder="Type a manual message (or add a private counselor note below)..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
                <button 
                  className={styles.sendBtn}
                  onClick={handleSend}
                  title="Send WhatsApp Message"
                  disabled={isPending}
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
                <button 
                  className={styles.noteBtn}
                  onClick={handleAddNote}
                  title="Add Internal Staff Note"
                  disabled={isPending}
                >
                  <span className="material-symbols-outlined">lock</span>
                  <span>Add Note</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem", color: "var(--text-muted)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "4rem", marginBottom: "1rem", color: "var(--primary)" }}>chat</span>
            <h3>No Conversation Selected</h3>
            <p style={{ fontSize: "0.85rem", textAlign: "center", maxWidth: "400px" }}>
              Select a conversation from the left thread view to read message logs, reply, tag leads, assign operators, or add private staff notes.
            </p>
          </div>
        )}
      </div>

      {/* Pane 3: Contact Details Inspector */}
      {chatDetail && chatDetail.contactInfo && (
        <div className={styles.contactDetailPanel}>
          <div className={styles.detailHeader}>
            <div className={styles.avatarLarge}>
              <span className="material-symbols-outlined">person</span>
            </div>
            <h4>{chatDetail.contactInfo.name}</h4>
            <span>Status: <strong>{chatDetail.contactInfo.status}</strong></span>
          </div>

          <div className={styles.detailSection}>
            <h5>CRM Contact Info</h5>
            <div className={styles.infoRow}>
              <span>Phone</span>
              <strong>+{chatDetail.phone}</strong>
            </div>
            {chatDetail.contactInfo.email && (
              <div className={styles.infoRow}>
                <span>Email</span>
                <strong>{chatDetail.contactInfo.email}</strong>
              </div>
            )}
            <div className={styles.infoRow}>
              <span>Branch</span>
              <strong>{chatDetail.contactInfo.branch}</strong>
            </div>
          </div>

          {/* Render Contact Attributes */}
          <div className={styles.detailSection}>
            <h5>Custom Attributes</h5>
            {Object.entries(chatDetail.attributes || {}).map(([k, v]: [string, any]) => (
              <div key={k} className={styles.infoRow}>
                <span>{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
            {Object.keys(chatDetail.attributes || {}).length === 0 && (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                No custom attributes set.
              </span>
            )}
          </div>

          <div className={styles.detailSection}>
            <h5>Contact Tags</h5>
            <div className={styles.tagEditor}>
              {chatDetail.tags?.map((tag: string) => (
                <span key={tag} className={styles.tagBadge}>
                  {tag}
                  <button className={styles.removeTagBtn} onClick={() => handleRemoveTag(tag)}>×</button>
                </span>
              ))}
            </div>
            <div className={styles.addTagRow}>
              <input 
                type="text" 
                placeholder="New tag..." 
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <button onClick={handleAddTag}>Add</button>
            </div>
          </div>

          <div className={styles.detailSection}>
            <h5>Staff Log notes ({chatDetail.internalNotes?.length || 0})</h5>
            <div className={styles.notesList}>
              {chatDetail.internalNotes?.map((note: any) => (
                <div key={note.id} className={styles.noteItem}>
                  <p style={{ margin: 0 }}>{note.content}</p>
                  <div className={styles.noteItemMeta}>
                    <span>{note.author}</span>
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
