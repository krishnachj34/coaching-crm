"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import styles from "../app/assistant/assistant.module.css";
import { askAssistant } from "@/app/assistant/actions";

interface Message {
  role: "user" | "model";
  parts: string;
}

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      parts: "Hello! I am your CRM Assistant. Ask me anything about leads, students, fees, or attendance stats!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const bodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat body on new messages
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isPending]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add User Message Locally
    const userMessage: Message = { role: "user", parts: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // 2. Submit Action
    startTransition(async () => {
      // Send chat history and current input
      const reply = await askAssistant(messages, text);
      
      const assistantMessage: Message = {
        role: "model",
        parts: reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    });
  };

  const handleSuggestion = (text: string) => {
    handleSend(text);
  };

  const handleClear = () => {
    setMessages([
      {
        role: "model",
        parts: "Chat history cleared. Ask me anything about your coaching dashboard data!",
      },
    ]);
  };

  const suggestions = [
    "Show lead conversion stats",
    "Summarize course revenues",
    "What is the attendance rate?",
  ];

  return (
    <div className={styles.floatingWrapper}>
      {/* 1. Chat Panel */}
      {isOpen && (
        <div className={styles.chatPanel}>
          <header className={styles.panelHeader}>
            <h3>CRM AI Co-pilot</h3>
            <div className={styles.headerActions}>
              <button onClick={handleClear} className={styles.clearBtn}>
                Clear
              </button>
              <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                ✕
              </button>
            </div>
          </header>

          <div ref={bodyRef} className={styles.chatBody}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${styles.messageItem} ${
                  msg.role === "user" ? styles.userMessage : styles.modelMessage
                }`}
              >
                {/* Parse simple markdown bold text in messages for readability */}
                {msg.parts.split("\n").map((line, idx) => (
                  <p key={idx} style={{ marginBottom: "0.25rem" }}>
                    {line.split("**").map((chunk, cIdx) =>
                      cIdx % 2 === 1 ? <strong key={cIdx}>{chunk}</strong> : chunk
                    )}
                  </p>
                ))}
              </div>
            ))}

            {isPending && (
              <div className={`${styles.messageItem} ${styles.modelMessage} ${styles.loadingBubble}`}>
                Assistant is thinking...
              </div>
            )}
          </div>

          {/* Preset Suggestions */}
          <div className={styles.suggestionRow}>
            {suggestions.map((text, idx) => (
              <button
                key={idx}
                disabled={isPending}
                onClick={() => handleSuggestion(text)}
                className={styles.suggestionBtn}
              >
                {text}
              </button>
            ))}
          </div>

          {/* Footer Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className={styles.chatFooter}
          >
            <input
              type="text"
              disabled={isPending}
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={styles.chatInput}
            />
            <button type="submit" disabled={isPending || !input.trim()} className={styles.sendBtn}>
              Send
            </button>
          </form>
        </div>
      )}

      {/* 2. Toggle Floating Action Button */}
      <button onClick={() => setIsOpen((prev) => !prev)} className={styles.toggleBtn}>
        <span>💬</span>
        <span>{isOpen ? "Close Assistant" : "AI Co-pilot"}</span>
      </button>
    </div>
  );
}
