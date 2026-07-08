"use server";

import { db } from "@/utils/db";
import { verifyAuth } from "@/utils/auth";
import { processChatbotMessage } from "@/utils/chatbot";
import fs from "fs";
import path from "path";

// 1. Get Chatbot Settings
export async function getWhatsAppConfig() {
  await verifyAuth();

  let config = await db.whatsAppChatbotConfig.findUnique({
    where: { id: "default" },
  });

  if (!config) {
    config = await db.whatsAppChatbotConfig.create({
      data: { id: "default" },
    });
  }

  return config;
}

// 2. Update Chatbot Settings
export async function updateWhatsAppConfig(data: {
  botEnabled?: boolean;
  botMode?: string;
  systemPrompt?: string;
  verifyToken?: string;
  phoneNumberId?: string | null;
  accessToken?: string | null;
  welcomeMessage?: string;
  fallbackMessage?: string;
}) {
  const { profile } = await verifyAuth();

  // Restrict editing configuration to ADMIN or SUPER_ADMIN
  if (profile.role !== "ADMIN" && profile.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized. Only administrators can update automation settings.");
  }

  const updated = await db.whatsAppChatbotConfig.upsert({
    where: { id: "default" },
    update: data,
    create: {
      id: "default",
      ...data,
    },
  });

  return updated;
}

// 3. Get WhatsApp Inbox (List of chats/conversations)
export async function getWhatsAppChats() {
  await verifyAuth();

  // Retrieve all messages ordered by newest first
  const messages = await db.whatsAppMessage.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lead: {
        select: {
          id: true,
          name: true,
          status: true,
          interest: true,
        },
      },
    },
  });

  const chatMap = new Map();

  for (const msg of messages) {
    if (!chatMap.has(msg.phone)) {
      chatMap.set(msg.phone, {
        phone: msg.phone,
        leadName: msg.lead?.name || `WhatsApp User ${msg.phone.slice(-4)}`,
        leadId: msg.leadId,
        leadStatus: msg.lead?.status || null,
        leadInterest: msg.lead?.interest || null,
        lastMessage: msg.content,
        lastMessageTime: msg.createdAt.toISOString(),
        direction: msg.direction,
      });
    }
  }

  return Array.from(chatMap.values());
}

// 4. Get Chat Messages for a specific phone number
export async function getWhatsAppMessages(phone: string) {
  await verifyAuth();
  const sanitizedPhone = phone.replace(/[^0-9]/g, "");

  const messages = await db.whatsAppMessage.findMany({
    where: { phone: sanitizedPhone },
    orderBy: { createdAt: "asc" },
  });

  return messages.map(m => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));
}

// 5. Send manual message to a lead
export async function sendDirectWhatsApp(phone: string, content: string) {
  const { profile } = await verifyAuth();
  const sanitizedPhone = phone.replace(/[^0-9]/g, "");

  // Find or create lead
  let lead = await db.lead.findFirst({
    where: { phone: sanitizedPhone },
  });

  if (!lead) {
    let finalBranchId = null;
    const firstBranch = await db.branch.findFirst();
    if (firstBranch) {
      finalBranchId = firstBranch.id;
    }

    lead = await db.lead.create({
      data: {
        name: `WhatsApp User ${sanitizedPhone.slice(-4)}`,
        phone: sanitizedPhone,
        status: "NEW",
        source: "WHATSAPP",
        notes: "Auto-created from manual WhatsApp message session initiation.",
        branchId: finalBranchId,
      },
    });
  }

  // Create message record
  const msg = await db.whatsAppMessage.create({
    data: {
      phone: sanitizedPhone,
      direction: "OUTGOING",
      content,
      leadId: lead.id,
      status: "DELIVERED",
    },
  });

  // Log to public file
  try {
    const logsDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFilePath = path.join(logsDir, "whatsapp_logs.txt");
    const logMessage = `[${new Date().toISOString()}] MANUAL SEND by: ${profile.name} to: ${sanitizedPhone} (Lead: ${lead.name}) | Msg: ${content}\n`;
    fs.appendFileSync(logFilePath, logMessage, "utf8");
  } catch (err) {
    console.error("Failed to write manual send WhatsApp logs", err);
  }

  // Fetch Meta config
  const config = await db.whatsAppChatbotConfig.findUnique({
    where: { id: "default" },
  });

  if (config?.accessToken && config?.phoneNumberId) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.accessToken}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: sanitizedPhone,
            type: "text",
            text: { body: content },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error(`WhatsApp manual Send API Error (${response.status}): ${errText}`);
      }
    } catch (apiError) {
      console.error("Failed to send manual WhatsApp message via Meta API:", apiError);
    }
  }

  return {
    success: true,
    message: {
      ...msg,
      createdAt: msg.createdAt.toISOString(),
    },
  };
}

// 6. Local testing webhook simulator
export async function simulateIncomingMessage(phone: string, name: string, content: string) {
  await verifyAuth();
  
  // Call unified processor
  const result = await processChatbotMessage({
    phone,
    name,
    content,
  });

  return result;
}
