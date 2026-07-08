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

  const logMessage = `[${new Date().toISOString()}] To: ${phone} | Template: ${templateName} | Variables: [${variables.join(", ")}]\n`;

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

  // If Meta API credentials exist in database, send template message via Meta
  try {
    const config = await db.whatsAppChatbotConfig.findUnique({
      where: { id: "default" },
    });

    if (config?.accessToken && config?.phoneNumberId) {
      const sanitizedPhone = phone.replace(/[^0-9]/g, "");
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
      // Example payload structure standard for providers like Wati or custom gateways
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          receiver: phone,
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
