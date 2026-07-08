import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { processChatbotMessage } from "@/utils/chatbot";

// GET: Meta Webhook Handshake Verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  let dbVerifyToken = "whatsapp_bot_verify_token";
  try {
    const config = await db.whatsAppChatbotConfig.findUnique({
      where: { id: "default" },
    });
    if (config && config.verifyToken) {
      dbVerifyToken = config.verifyToken;
    }
  } catch (err) {
    console.error("Failed to read WhatsApp verify token from database:", err);
  }

  if (mode === "subscribe" && token === dbVerifyToken) {
    console.log("WhatsApp Webhook Subscription Handshake Verified.");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// POST: Process incoming WhatsApp events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received WhatsApp Webhook Payload:", JSON.stringify(body));

    let phone = "";
    let name = "";
    let content = "";

    // 1. Check if it's a standard Meta Cloud API WhatsApp message payload
    if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const messageObj = body.entry[0].changes[0].value.messages[0];
      const contactObj = body.entry[0].changes[0].value.contacts?.[0];

      phone = messageObj.from; // Sender WhatsApp phone number
      name = contactObj?.profile?.name || `WhatsApp User ${phone.slice(-4)}`;
      
      if (messageObj.type === "text") {
        content = messageObj.text?.body || "";
      } else if (messageObj.type === "interactive") {
        const interactive = messageObj.interactive;
        if (interactive?.type === "list_reply") {
          content = interactive.list_reply?.title || "";
        } else if (interactive?.type === "button_reply") {
          content = interactive.button_reply?.title || "";
        } else {
          content = `[Interactive type: ${interactive?.type}]`;
        }
      } else {
        content = `[Received media/unsupported message type: ${messageObj.type}]`;
      }
    } 
    // 2. Fallback to simplified direct payload format for custom gateways/testing
    else if (body.phone && body.content) {
      phone = body.phone;
      name = body.name || `Test User ${phone.slice(-4)}`;
      content = body.content;
    }

    if (!phone || !content) {
      return NextResponse.json(
        { error: "Invalid webhook payload. Missing phone or content." },
        { status: 400 }
      );
    }

    // Call unified chatbot processor
    const result = await processChatbotMessage({
      phone,
      name,
      content,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("WhatsApp webhook processing error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error occurred" },
      { status: 500 }
    );
  }
}
