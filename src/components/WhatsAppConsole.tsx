"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./WhatsAppConsole.module.css";
import {
  updateWhatsAppConfig,
  getWhatsAppChats,
  getWhatsAppMessages,
  sendDirectWhatsApp,
  simulateIncomingMessage,
} from "@/app/automation/actions";

interface ChatThread {
  phone: string;
  leadName: string;
  leadId: string | null;
  leadStatus: string | null;
  leadInterest: string | null;
  lastMessage: string;
  lastMessageTime: string;
  direction: "INCOMING" | "OUTGOING";
}

interface Message {
  id: string;
  phone: string;
  direction: string;
  messageType: string;
  content: string;
  status: string;
  createdAt: string;
  leadId: string | null;
}

interface WhatsAppConsoleProps {
  initialConfig: {
    botEnabled: boolean;
    botMode: string;
    systemPrompt: string;
    verifyToken: string;
    phoneNumberId: string | null;
    accessToken: string | null;
    welcomeMessage: string;
    fallbackMessage: string;
  };
  initialChats: ChatThread[];
  userRole: string;
}

export default function WhatsAppConsole({
  initialConfig,
  initialChats,
  userRole,
}: WhatsAppConsoleProps) {
  const [config, setConfig] = useState(initialConfig);
  const [chats, setChats] = useState<ChatThread[]>(initialChats);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"simulator" | "settings">("simulator");
  const [messageInput, setMessageInput] = useState("");

  // Simulator Form State
  const [simPhone, setSimPhone] = useState("919988776655");
  const [simName, setSimName] = useState("Raj Malhotra");
  const [simMessage, setSimMessage] = useState("Hi, I want to know about IELTS courses");

  // Config Form State
  const [botEnabled, setBotEnabled] = useState(config.botEnabled);
  const [botMode, setBotMode] = useState(config.botMode);
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt);
  const [welcomeMessage, setWelcomeMessage] = useState(config.welcomeMessage);
  const [fallbackMessage, setFallbackMessage] = useState(config.fallbackMessage);
  const [verifyToken, setVerifyToken] = useState(config.verifyToken);
  const [phoneNumberId, setPhoneNumberId] = useState(config.phoneNumberId || "");
  const [accessToken, setAccessToken] = useState(config.accessToken || "");

  const searchParams = useSearchParams();
  const phoneParam = searchParams ? searchParams.get("phone") : null;

  // Handle URL query parameter ?phone=xxx to auto-select/start new chat thread
  useEffect(() => {
    if (phoneParam) {
      const sanitized = phoneParam.replace(/[^0-9]/g, "");
      if (sanitized) {
        const found = chats.some((c) => c.phone === sanitized);
        if (!found) {
          // Add a temporary new thread so it appears in the sidebar list
          const tempThread: ChatThread = {
            phone: sanitized,
            leadName: `New Chat (+${sanitized.slice(-4)})`,
            leadId: null,
            leadStatus: "NEW",
            leadInterest: null,
            lastMessage: "No messages yet",
            lastMessageTime: new Date().toISOString(),
            direction: "OUTGOING",
          };
          setChats((prev) => [tempThread, ...prev]);
        }
        selectThread(sanitized);
      }
    }
  }, [phoneParam]);

  // UI state
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const chatHistoryRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat history to bottom
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  // Load message history when selecting a phone number
  const selectThread = async (phone: string) => {
    setSelectedPhone(phone);
    setIsLoadingMessages(true);
    try {
      const history = await getWhatsAppMessages(phone);
      setMessages(history);
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Poll chats periodically to get incoming simulation replies
  const refreshInbox = async () => {
    try {
      const updatedChats = await getWhatsAppChats();
      setChats(updatedChats);
    } catch (err) {
      console.error("Failed to refresh inbox", err);
    }
  };

  // Send a manual message
  const handleSendManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhone || !messageInput.trim()) return;

    const textToSend = messageInput.trim();
    setMessageInput("");

    // Optimistically add message
    const tempId = Math.random().toString();
    const optimisticMessage: Message = {
      id: tempId,
      phone: selectedPhone,
      direction: "OUTGOING",
      messageType: "text",
      content: textToSend,
      status: "SENDING",
      createdAt: new Date().toISOString(),
      leadId: null,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await sendDirectWhatsApp(selectedPhone, textToSend);
      if (response.success && response.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? (response.message as Message) : m))
        );
        refreshInbox();
      }
    } catch (err: any) {
      console.error("Failed to send message", err);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "FAILED" } : m))
      );
    }
  };

  // Run webhook simulator
  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simPhone.trim() || !simMessage.trim()) return;

    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await simulateIncomingMessage(
          simPhone.trim(),
          simName.trim(),
          simMessage.trim()
        );

        if (result.success) {
          setFeedback({
            type: "success",
            text: result.botReplied
              ? `Simulated incoming message! Bot replied: "${result.reply}"`
              : "Simulated incoming message! Chatbot did not reply (bot is disabled).",
          });

          // Refresh inbox list
          await refreshInbox();

          // If the simulated number is the one currently open, reload messages
          const cleanPhone = simPhone.replace(/[^0-9]/g, "");
          if (selectedPhone === cleanPhone) {
            const history = await getWhatsAppMessages(cleanPhone);
            setMessages(history);
          } else {
            // Auto-select the newly simulated thread so user can see it!
            setSelectedPhone(cleanPhone);
            const history = await getWhatsAppMessages(cleanPhone);
            setMessages(history);
          }
          
          // Clear simulator message field for convenience
          setSimMessage("");
        } else {
          setFeedback({ type: "error", text: "Simulation failed." });
        }
      } catch (err: any) {
        setFeedback({ type: "error", text: err.message || "Simulation failed." });
      }
    });
  };

  // Save Config Settings
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
    if (!isAdmin) {
      setFeedback({
        type: "error",
        text: "Permission Denied. Only Admins can save automation settings.",
      });
      return;
    }

    startTransition(async () => {
      try {
        const updated = await updateWhatsAppConfig({
          botEnabled,
          botMode,
          systemPrompt,
          welcomeMessage,
          fallbackMessage,
          verifyToken,
          phoneNumberId: phoneNumberId || null,
          accessToken: accessToken || null,
        });

        setConfig(updated as any);
        setFeedback({ type: "success", text: "Chatbot settings saved successfully!" });
      } catch (err: any) {
        setFeedback({ type: "error", text: err.message || "Failed to save settings." });
      }
    });
  };

  // Filter threads based on search input
  const filteredChats = chats.filter(
    (c) =>
      c.phone.includes(searchTerm) ||
      c.leadName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Active chat thread object
  const activeChat = chats.find((c) => c.phone === selectedPhone);

  return (
    <div className={styles.container}>
      {/* 1. Left Panel: Chats List */}
      <aside className={styles.inboxPanel}>
        <div className={styles.panelHeader}>
          <h2>Automation Inbox</h2>
          <div className={styles.searchWrapper}>
            <span className={`${styles.searchIcon} material-symbols-outlined`}>search</span>
            <input
              type="text"
              placeholder="Search chat or phone..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.inboxList}>
          {filteredChats.length === 0 ? (
            <div className={styles.emptyInbox}>
              <span className="material-symbols-outlined">forum</span>
              <p>No active conversations found.</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.phone}
                className={`${styles.inboxItem} ${
                  selectedPhone === chat.phone ? styles.inboxItemActive : ""
                }`}
                onClick={() => selectThread(chat.phone)}
              >
                <div className={styles.itemTop}>
                  <span className={styles.itemName}>{chat.leadName}</span>
                  <span className={styles.itemTime}>
                    {new Date(chat.lastMessageTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className={styles.itemBottom}>
                  <span className={styles.itemPreview}>
                    <span className={`${styles.previewIcon} material-symbols-outlined`}>
                      {chat.direction === "INCOMING" ? "call_received" : "call_made"}
                    </span>
                    {chat.lastMessage}
                  </span>
                  {chat.leadStatus && (
                    <span className={`${styles.statusBadge} ${styles["status" + chat.leadStatus]}`}>
                      {chat.leadStatus}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* 2. Middle Panel: Active Chat Thread */}
      <section className={styles.chatConsole}>
        {!selectedPhone ? (
          <div className={styles.chatWelcome}>
            <span className={`${styles.chatWelcomeIcon} material-symbols-outlined`}>smart_toy</span>
            <h3>Automation Chat Control</h3>
            <p>
              Select a WhatsApp conversation thread from the left menu to view, reply manually,
              or configure and test the auto-response automation bot.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Screen Header */}
            <div className={styles.chatHeader}>
              <div className={styles.headerInfo}>
                <h3>{activeChat?.leadName}</h3>
                <div className={styles.headerMeta}>
                  <span className={styles.headerPhone}>+{selectedPhone}</span>
                  {activeChat?.leadStatus && (
                    <span className={`${styles.statusBadge} ${styles["status" + activeChat.leadStatus]}`}>
                      {activeChat.leadStatus}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.headerActions}>
                {activeChat?.leadId && (
                  <a
                    href={`/leads?search=${selectedPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.viewLeadBtn}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>open_in_new</span>
                    Lead Profile
                  </a>
                )}
              </div>
            </div>

            {/* Chat Scrollback History */}
            <div className={styles.chatHistory} ref={chatHistoryRef}>
              {isLoadingMessages ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Loading chat history...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  No messages logged in this chat thread.
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`${styles.messageRow} ${
                      msg.direction === "INCOMING" ? styles.msgIncoming : styles.msgOutgoing
                    }`}
                  >
                    <div className={styles.bubble}>
                      <p>{msg.content}</p>
                      <span className={styles.bubbleTime}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {msg.status === "SENDING" && " ⏳"}
                        {msg.status === "FAILED" && " ⚠️"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Manual Sender Form */}
            <div className={styles.chatFooter}>
              <form onSubmit={handleSendManual} className={styles.footerForm}>
                <input
                  type="text"
                  placeholder="Type a manual reply via WhatsApp..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className={styles.chatInput}
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className={styles.sendBtn}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>send</span>
                  Send
                </button>
              </form>
            </div>
          </>
        )}
      </section>

      {/* 3. Right Panel: Control Console */}
      <aside className={styles.controlPanel}>
        <div className={styles.tabsHeader}>
          <button
            onClick={() => {
              setActiveTab("simulator");
              setFeedback(null);
            }}
            className={`${styles.tabBtn} ${activeTab === "simulator" ? styles.activeTabBtn : ""}`}
          >
            <span className="material-symbols-outlined">terminal</span>
            Local Simulator
          </button>
          <button
            onClick={() => {
              setActiveTab("settings");
              setFeedback(null);
            }}
            className={`${styles.tabBtn} ${activeTab === "settings" ? styles.activeTabBtn : ""}`}
          >
            <span className="material-symbols-outlined">settings_suggest</span>
            Bot Settings
          </button>
        </div>

        <div className={styles.tabContent}>
          {/* Feedback Toast */}
          {feedback && (
            <div
              className={`${styles.messageAlert} ${
                feedback.type === "success" ? styles.alertSuccess : styles.alertError
              }`}
            >
              <span className="material-symbols-outlined">
                {feedback.type === "success" ? "check_circle" : "error"}
              </span>
              <span>{feedback.text}</span>
            </div>
          )}

          {activeTab === "simulator" ? (
            /* SANDBOX SIMULATOR TAB */
            <div>
              <div className={styles.sectionTitle}>
                <span className="material-symbols-outlined">science</span>
                Webhook Sandbox
              </div>
              <div className={styles.simulatorInfo}>
                This simulator mimics Meta Webhook events. Submitting triggers the chatbot logic locally:
                queries courses/events, logs chats, and calls <strong>Gemini AI</strong>. Perfect for local dev without ngrok!
              </div>

              <form onSubmit={handleSimulate}>
                <div className={styles.formGroup}>
                  <label htmlFor="sim-phone">Sender Phone (Digits only)</label>
                  <input
                    id="sim-phone"
                    type="text"
                    required
                    className={styles.inputField}
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="sim-name">Sender Profile Name</label>
                  <input
                    id="sim-name"
                    type="text"
                    required
                    className={styles.inputField}
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="sim-msg">Inbound Message Body</label>
                  <textarea
                    id="sim-msg"
                    required
                    className={styles.textareaField}
                    value={simMessage}
                    onChange={(e) => setSimMessage(e.target.value)}
                    placeholder="Try 'courses', 'batches', or a natural question..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className={styles.simulateBtn}
                >
                  <span className="material-symbols-outlined">play_circle</span>
                  {isPending ? "Processing..." : "Simulate Inbound Msg"}
                </button>
              </form>

              {/* Lead detail quick view context if selected */}
              {selectedPhone && activeChat && (
                <div style={{ marginTop: "2rem" }}>
                  <div className={styles.sectionTitle}>
                    <span className="material-symbols-outlined">contact_page</span>
                    Lead Profile Context
                  </div>
                  <div className={styles.leadContextCard}>
                    <div className={styles.leadContextRow}>
                      <span className={styles.leadLabel}>Name:</span>
                      <span className={styles.leadVal}>{activeChat.leadName}</span>
                    </div>
                    <div className={styles.leadContextRow}>
                      <span className={styles.leadLabel}>Phone:</span>
                      <span className={styles.leadVal}>+{selectedPhone}</span>
                    </div>
                    <div className={styles.leadContextRow}>
                      <span className={styles.leadLabel}>Lead Status:</span>
                      <span className={`${styles.statusBadge} ${styles["status" + activeChat.leadStatus]}`}>
                        {activeChat.leadStatus || "NEW"}
                      </span>
                    </div>
                    <div className={styles.leadContextRow}>
                      <span className={styles.leadLabel}>Target Interest:</span>
                      <span className={styles.leadVal}>{activeChat.leadInterest || "Unassigned"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CONFIG SETTINGS TAB */
            <div>
              <div className={styles.sectionTitle}>
                <span className="material-symbols-outlined">robot_2</span>
                Automation Configuration
              </div>

              <form onSubmit={handleSaveConfig}>
                {/* Enable Switch */}
                <div className={styles.switchRow}>
                  <div className={styles.switchLabel}>
                    <span className={styles.switchTitle}>Auto-Response Bot</span>
                    <span className={styles.switchSubtitle}>Toggle WhatsApp chatbot auto-reply</span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={botEnabled}
                      onChange={(e) => setBotEnabled(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                {/* Bot Mode Select */}
                <div className={styles.formGroup}>
                  <label htmlFor="bot-mode">Bot Reply Intelligence</label>
                  <select
                    id="bot-mode"
                    className={styles.selectField}
                    value={botMode}
                    onChange={(e) => setBotMode(e.target.value)}
                  >
                    <option value="RULE_BASED">Rule-Based Parsing (Static Keywords)</option>
                    <option value="AI">AI Chatbot Agent (Gemini Flash)</option>
                  </select>
                </div>

                {botMode === "RULE_BASED" ? (
                  <>
                    <div className={styles.formGroup}>
                      <label htmlFor="welcome-msg">Welcome Message (Menu)</label>
                      <textarea
                        id="welcome-msg"
                        className={styles.textareaField}
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="fallback-msg">Fallback Message</label>
                      <textarea
                        id="fallback-msg"
                        className={styles.textareaField}
                        value={fallbackMessage}
                        onChange={(e) => setFallbackMessage(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <div className={styles.formGroup}>
                    <label htmlFor="sys-prompt">AI Bot System Instruction (Prompt)</label>
                    <textarea
                      id="sys-prompt"
                      className={styles.textareaField}
                      style={{ minHeight: "150px" }}
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                    />
                  </div>
                )}

                <div style={{ borderTop: "1px solid var(--outline-variant)", margin: "1.5rem 0" }} />

                <div className={styles.sectionTitle}>
                  <span className="material-symbols-outlined">api</span>
                  Meta Cloud Credentials
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="webhook-verify">Verify Token (Meta webhook handshake)</label>
                  <input
                    id="webhook-verify"
                    type="text"
                    className={styles.inputField}
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="phone-id">Meta Phone Number ID (Optional)</label>
                  <input
                    id="phone-id"
                    type="text"
                    className={styles.inputField}
                    value={phoneNumberId}
                    placeholder="e.g. 1045938475837"
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="access-token">Meta Graph Access Token (Optional)</label>
                  <textarea
                    id="access-token"
                    className={styles.textareaField}
                    placeholder="EAAGz..."
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className={styles.saveBtn}
                >
                  <span className="material-symbols-outlined">save</span>
                  {isPending ? "Saving..." : "Save Config Settings"}
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
