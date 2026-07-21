import fs from "fs";
import path from "path";
import { db } from "@/utils/db";

interface WhatsAppPayload {
  phone: string;
  templateName: string;
  variables: string[];
}

/**
 * Sends an automated WhatsApp notification.
 * In development / local testing, it logs the message details to a file in the workspace
 * so the user can easily see what was triggered without needing a paid API account.
 */
export async function sendWhatsAppNotification({ phone, templateName, variables }: WhatsAppPayload) {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const sanitizedPhone = phone.replace(/[^0-9]/g, "");

  const logMessage = `[${new Date().toISOString()}] To: ${sanitizedPhone} | Template: ${templateName} | Variables: [${variables.join(", ")}]\n`;

  // Always log to workspace for easy local verification
  try {
    const logsDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFilePath = path.join(logsDir, "whatsapp_logs.txt");
    fs.appendFileSync(logFilePath, logMessage, "utf8");
    console.log(`WhatsApp Notification Logged: ${logMessage.trim()}`);
  } catch (err) {
    console.error("Failed to write WhatsApp logs to file", err);
  }

  // Parse Wati DB to sync welcome templates with visual flows
  let welcomeMessageContent = `Hello! Welcome to Foreign Language Wala. Which course would you like to prepare for?\n\n1. IELTS Preparation\n2. German Language Course\n3. French Language Course\n4. Talk with Executive`;
  
  try {
    const dbPath = path.join(process.cwd(), "src", "app", "wati-sensy", "db.json");
    if (fs.existsSync(dbPath)) {
      const dbState = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      
      if (!dbState.activeUserStates) dbState.activeUserStates = {};
      
      // Auto-enroll new lead in default admissions chatbot flow when welcome template is sent
      if (templateName === "lead_generation_welcome" || templateName === "free_trial_welcome") {
        const defaultFlow = dbState.flows?.find((f: any) => f.id === "flow_1") || dbState.flows?.[0];
        if (defaultFlow) {
          const rootNode = defaultFlow.nodes?.find((n: any) => n.id === defaultFlow.startNodeId);
          if (rootNode) {
            welcomeMessageContent = (rootNode.text || welcomeMessageContent).replace("{{1}}", variables[0] || "there");
          }
          dbState.activeUserStates[sanitizedPhone] = {
            flowId: defaultFlow.id,
            currentNodeId: defaultFlow.startNodeId || "root"
          };
          fs.writeFileSync(dbPath, JSON.stringify(dbState, null, 2), "utf8");
        }
      }
    }
  } catch (err) {
    console.error("Failed to sync template welcome trigger with chatbot flow state:", err);
  }

  // Save the outgoing message log to database (Prisma) so it registers in Wati Inbox
  try {
    const matchingLead = await db.lead.findFirst({
      where: {
        phone: { contains: sanitizedPhone.slice(-10) }
      }
    });

    const bodyText = templateName === "lead_generation_welcome" || templateName === "free_trial_welcome" 
      ? welcomeMessageContent
      : `Template notification: [${templateName}]. Params: ${variables.join(", ")}`;

    await db.whatsAppMessage.create({
      data: {
        phone: sanitizedPhone,
        direction: "OUTGOING",
        messageType: "template",
        content: bodyText,
        status: "READ",
        leadId: matchingLead?.id || null
      }
    });
  } catch (dbErr) {
    console.error("Failed to save automated WhatsApp template log to database:", dbErr);
  }

  // If Meta API credentials exist in database, send template message via Meta
  try {
    const config = await db.whatsAppChatbotConfig.findUnique({
      where: { id: "default" },
    });

    if (config?.accessToken && config?.phoneNumberId) {
      const res = await fetch(
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
            type: "template",
            template: {
              name: templateName,
              language: {
                code: "en_US",
              },
              components: [
                {
                  type: "body",
                  parameters: variables.map((v) => ({
                    type: "text",
                    text: v,
                  })),
                },
              ],
            },
          }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Meta Template Send API Error (${res.status}): ${errText}`);
      } else {
        console.log(`Successfully sent Meta Template message to +${sanitizedPhone}`);
      }
    }
  } catch (metaErr) {
    console.error("Failed to send Meta WhatsApp template:", metaErr);
  }

  // If external service is configured, call it
  if (apiUrl && apiToken) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          receiver: sanitizedPhone,
          template: templateName,
          params: variables,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`WhatsApp Provider API Error (${response.status}): ${errText}`);
        return { success: false, error: errText };
      }

      return { success: true, providerResponse: await response.json() };
    } catch (apiError: any) {
      console.error("WhatsApp Provider connection failed:", apiError);
      return { success: false, error: apiError?.message || "Connection failed" };
    }
  }

  return { success: true, message: "Logged locally (API credentials not configured)" };
}
