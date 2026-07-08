import React, { Suspense } from "react";
import { verifyAuth } from "@/utils/auth";
import Sidebar from "@/components/Sidebar";
import WhatsAppConsole from "@/components/WhatsAppConsole";
import { getWhatsAppConfig, getWhatsAppChats } from "./actions";
import { serializePrisma } from "@/utils/serialize";

export const dynamic = "force-dynamic";

export default async function AutomationPage() {
  const { profile } = await verifyAuth();
  
  // Fetch settings and inbox conversations
  const rawConfig = await getWhatsAppConfig();
  const rawChats = await getWhatsAppChats();

  const config = serializePrisma(rawConfig);
  const chats = serializePrisma(rawChats);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--background)" }}>
      {/* Navigation Sidebar */}
      <Sidebar currentPhase={14} />

      {/* Main Content Dashboard */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Suspense fallback={<div style={{ padding: "2rem", color: "var(--text-muted)" }}>Loading WhatsApp console...</div>}>
          <WhatsAppConsole 
            initialConfig={config} 
            initialChats={chats} 
            userRole={profile.role}
          />
        </Suspense>
      </main>
    </div>
  );
}
