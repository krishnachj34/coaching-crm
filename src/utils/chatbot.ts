import { db } from "@/utils/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

// Process incoming WhatsApp message
export async function processChatbotMessage({
  phone,
  name,
  content,
}: {
  phone: string;
  name: string;
  content: string;
}) {
  // 1. Sanitize phone
  const sanitizedPhone = phone.replace(/[^0-9]/g, "");

  // 2. Fetch configuration or create default
  let config = await db.whatsAppChatbotConfig.findUnique({
    where: { id: "default" },
  });
  if (!config) {
    config = await db.whatsAppChatbotConfig.create({
      data: { id: "default" },
    });
  }

  // 3. Find or create lead
  let lead = await db.lead.findFirst({
    where: { phone: sanitizedPhone },
  });

  if (!lead) {
    // Check if we can find default branch
    let finalBranchId = null;
    const firstBranch = await db.branch.findFirst();
    if (firstBranch) {
      finalBranchId = firstBranch.id;
    }

    lead = await db.lead.create({
      data: {
        name: name || `WhatsApp User ${sanitizedPhone.slice(-4)}`,
        phone: sanitizedPhone,
        status: "NEW",
        source: "WHATSAPP",
        notes: `Auto-created from WhatsApp inquiry: "${content}"`,
        branchId: finalBranchId,
      },
    });
  }

  // 4. Save incoming message
  await db.whatsAppMessage.create({
    data: {
      phone: sanitizedPhone,
      direction: "INCOMING",
      content,
      leadId: lead.id,
      status: "DELIVERED",
    },
  });

  // 5. If chatbot is not enabled, do not generate response
  if (!config.botEnabled) {
    return { success: true, botReplied: false, reason: "Bot is disabled" };
  }

  let reply = "";
  let modeUsed = config.botMode;

  // 6. Generate reply based on mode
  if (config.botMode === "RULE_BASED") {
    reply = await generateRuleBasedReply(content.trim(), config);
  } else {
    // AI Mode
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your-gemini-api-key-here" || apiKey === "") {
      // Fallback to Rule-based if no API key is set
      reply = `[AI CONFIG WARNING: GEMINI_API_KEY not configured. Falling back to Rule-based bot]\n\n` + 
              await generateRuleBasedReply(content.trim(), config);
      modeUsed = "RULE_BASED (FALLBACK)";
    } else {
      try {
        reply = await generateAIChatbotReply(sanitizedPhone, name, content.trim(), config);
      } catch (err: any) {
        console.error("Gemini chatbot error:", err);
        reply = "I apologize, but I am experiencing some difficulties processing your request. Please reply again later or type 'agent' to speak to a person.";
      }
    }
  }

  // 7. Save outgoing message
  await db.whatsAppMessage.create({
    data: {
      phone: sanitizedPhone,
      direction: "OUTGOING",
      content: reply,
      leadId: lead.id,
      status: "DELIVERED",
    },
  });

  // 8. Log message details locally to workspace
  try {
    const logsDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFilePath = path.join(logsDir, "whatsapp_logs.txt");
    const logMessage = `[${new Date().toISOString()}] BOT REPLY to: ${sanitizedPhone} (Lead: ${lead.name}) | Mode: ${modeUsed} | Reply: ${reply}\n`;
    fs.appendFileSync(logFilePath, logMessage, "utf8");
    console.log(`WhatsApp Bot Reply Logged: ${logMessage.trim()}`);
  } catch (err) {
    console.error("Failed to write WhatsApp logs to file", err);
  }

  // 9. Send response via Meta WhatsApp Cloud API if configured
  if (config.accessToken && config.phoneNumberId) {
    try {
      const isWelcome = reply === config.welcomeMessage;
      
      let payload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: sanitizedPhone,
      };

      if (isWelcome) {
        payload.type = "interactive";
        payload.interactive = {
          type: "list",
          header: {
            type: "text",
            text: "Linguist CRM Dashboard"
          },
          body: {
            text: reply
          },
          footer: {
            text: "Please select an option below"
          },
          action: {
            button: "Main Menu Options",
            sections: [
              {
                title: "Select Action",
                rows: [
                  {
                    id: "menu_executive",
                    title: "Talk to Executive",
                    description: "Connect with our counselors"
                  },
                  {
                    id: "menu_courses",
                    title: "Courses Offered",
                    description: "View IELTS prep courses & fees"
                  },
                  {
                    id: "menu_batches",
                    title: "Active Batches",
                    description: "Check morning & evening batches"
                  },
                  {
                    id: "menu_events",
                    title: "Upcoming Events",
                    description: "View free seminars & demo sessions"
                  }
                ]
              }
            ]
          }
        };
      } else {
        payload.type = "text";
        payload.text = { body: reply };
      }

      const response = await fetch(
        `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error(`WhatsApp Send Message API Error (${response.status}): ${errText}`);
      }
    } catch (apiError) {
      console.error("Failed to send WhatsApp message via Meta API:", apiError);
    }
  }

  return { success: true, botReplied: true, reply };
}

// Rule-based response generator
async function generateRuleBasedReply(text: string, config: any) {
  const query = text.toLowerCase();

  if (
    query.includes("hello") ||
    query.includes("hi") ||
    query.includes("hey") ||
    query === "start" ||
    query === "menu"
  ) {
    return config.welcomeMessage;
  }

  if (
    query.includes("course") ||
    query.includes("class") ||
    query.includes("ielts") ||
    query.includes("fee") ||
    query.includes("price") ||
    query.includes("cost")
  ) {
    try {
      const courses = await db.course.findMany({ select: { title: true, feeAmount: true } });
      if (courses.length === 0) {
        return "We offer comprehensive IELTS Academic and General Training preparation courses. Please contact our front desk for current fee structures!";
      }

      let reply = "Here are our IELTS courses:\n\n";
      courses.forEach((c) => {
        reply += `🔹 *${c.title}*\n   Fee: ₹${Number(c.feeAmount).toLocaleString()}\n\n`;
      });
      reply += "Would you like to enroll in any of these? Reply with the course name or 'agent' to speak with a counselor.";
      return reply;
    } catch (err) {
      return "We offer specialized IELTS courses (Academic & General). Please reply 'agent' to get specific course fees.";
    }
  }

  if (
    query.includes("batch") ||
    query.includes("time") ||
    query.includes("timing") ||
    query.includes("schedule") ||
    query.includes("days")
  ) {
    try {
      const batches = await db.batch.findMany({
        where: { active: true },
        select: { name: true, timing: true, days: true },
      });
      if (batches.length === 0) {
        return "We have multiple batches running daily:\n- Morning Batch: 9:00 AM - 11:30 AM\n- Evening Batch: 6:00 PM - 8:30 PM\n\nAll batches run Monday through Friday.";
      }

      let reply = "Here are our active batches:\n\n";
      batches.forEach((b) => {
        reply += `🕒 *${b.name}*\n   Timing: ${b.timing}\n   Days: ${b.days}\n\n`;
      });
      reply += "Do any of these timings work for you?";
      return reply;
    } catch (err) {
      return "We have morning and evening batches running daily. Please reply 'agent' to check slot availability.";
    }
  }

  if (
    query.includes("event") ||
    query.includes("upcoming") ||
    query.includes("webinar") ||
    query.includes("workshop") ||
    query.includes("demo")
  ) {
    try {
      const events = await db.upcomingEvent.findMany({
        take: 3,
        orderBy: { date: "asc" },
      });
      if (events.length === 0) {
        return "We conduct free IELTS Demo Classes and Webinars every Saturday at 11:00 AM. Type 'agent' to reserve a seat!";
      }

      let reply = "Check out our upcoming events:\n\n";
      events.forEach((e) => {
        reply += `📅 *${e.title}*\n   Date: ${new Date(e.date).toLocaleDateString()}\n   Time: ${e.time}\n   Platform: ${e.platform}\n\n`;
      });
      reply += "Would you like to register for any of these? Reply with the event title or type 'agent'.";
      return reply;
    } catch (err) {
      return "We hold free IELTS Demo sessions every week. Please reply 'agent' to check dates.";
    }
  }

  if (
    query.includes("agent") ||
    query.includes("human") ||
    query.includes("call") ||
    query.includes("talk") ||
    query.includes("person") ||
    query.includes("representative") ||
    query.includes("counselor")
  ) {
    return "I have alerted our counseling team. An advisor will review your chat history and contact you shortly. Thank you!";
  }

  return config.fallbackMessage;
}

// AI-based response generator using Gemini
async function generateAIChatbotReply(phone: string, name: string, content: string, config: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API key not configured");

  // Fetch dynamic context from database
  const courses = await db.course.findMany({ select: { title: true, feeAmount: true } });
  const batches = await db.batch.findMany({ where: { active: true }, select: { name: true, timing: true, days: true } });
  const events = await db.upcomingEvent.findMany({ take: 3, orderBy: { date: "asc" } });

  const contextPrompt = `
${config.systemPrompt}

Here is the current active data from the coaching center database to answer customer queries:
- Courses Offered: ${JSON.stringify(courses.map((c) => ({ title: c.title, fee: `₹${Number(c.feeAmount).toLocaleString()}` })))}
- Class Batches: ${JSON.stringify(batches)}
- Scheduled Seminars/Events: ${JSON.stringify(events.map((e) => ({ title: e.title, date: new Date(e.date).toLocaleDateString(), time: e.time, platform: e.platform })))}
- Current date and time is: ${new Date().toLocaleString()}

Guidelines:
1. Provide accurate answers based ONLY on the database details provided above. If asked about something not in the list, politely tell the student you will connect them with an agent.
2. Keep your answers clear, short, and friendly (maximum 2-3 sentences per reply, suitable for WhatsApp).
3. If the user explicitly asks to speak to a person, call an agent, or if they sound frustrated, suggest that a counselor will call them shortly.
4. You are chatting with student name: "${name}" at Phone: "${phone}".
`;

  // Retrieve last 10 messages for conversation history
  const historyMessages = await db.whatsAppMessage.findMany({
    where: { phone },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Map messages to Gemini API format. 
  // We need to reverse because we fetched desc, and we need chronological order.
  const history = historyMessages.reverse().map((m) => ({
    role: m.direction === "INCOMING" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.content }],
  }));

  // Initializing Gemini client
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: contextPrompt,
  });

  // Start chat with conversation history excluding the latest user message
  const chat = model.startChat({
    history: history.slice(0, -1),
  });

  const result = await chat.sendMessage(content);
  const response = await result.response;
  return response.text();
}
