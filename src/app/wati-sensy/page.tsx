import React from "react";
import { verifyAuth } from "@/utils/auth";
import { db } from "@/utils/db";
import { getMarketingData, getInboxChats } from "./actions";
import { serializePrisma } from "@/utils/serialize";
import WatiDashboard from "./components/WatiDashboard";

export const dynamic = "force-dynamic";

export default async function WatiSensyPage() {
  // 1. Verify User Authentication
  const { profile } = await verifyAuth();

  // 2. Fetch CRM Leads and Students from Prisma
  const rawLeads = await db.lead.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { branch: true }
  });

  const rawStudents = await db.student.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { branch: true }
  });

  // 3. Fetch Bot settings from CRM Config
  let rawConfig = await db.whatsAppChatbotConfig.findUnique({
    where: { id: "default" },
  });

  if (!rawConfig) {
    rawConfig = await db.whatsAppChatbotConfig.create({
      data: { id: "default" },
    });
  }

  // 4. Fetch local JSON Database contents and chat history
  const marketingData = await getMarketingData();
  const rawChats = await getInboxChats();

  // 5. Serialize Prisma decimal/date objects for Next.js client-side compatibility
  const leads = serializePrisma(rawLeads);
  const students = serializePrisma(rawStudents);
  const config = serializePrisma(rawConfig);
  const chats = serializePrisma(rawChats);

  return (
    <WatiDashboard 
      config={config}
      chats={chats}
      campaigns={marketingData.campaigns}
      templates={marketingData.templates}
      cannedReplies={marketingData.cannedReplies}
      chatbotRules={marketingData.chatbotRules}
      chatMetadata={marketingData.chatMetadata}
      leads={leads}
      students={students}
      flows={marketingData.flows}
      dripSequences={marketingData.dripSequences}
      smartLists={marketingData.smartLists}
      contactAttributes={marketingData.contactAttributes}
    />
  );
}
