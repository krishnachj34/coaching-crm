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

  // 4. Save incoming message in database
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

  // Read Wati local database state
  let watiDb: any = { flows: [], activeUserStates: {}, chatMetadata: {}, csatSettings: {}, chatbotRules: [] };
  const dbPath = path.join(process.cwd(), "src", "app", "wati-sensy", "db.json");
  try {
    if (fs.existsSync(dbPath)) {
      watiDb = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    }
  } catch (err) {
    console.error("Failed to read Wati db.json inside chatbot processor:", err);
  }

  if (!watiDb.activeUserStates) watiDb.activeUserStates = {};
  if (!watiDb.chatMetadata) watiDb.chatMetadata = {};
  if (!watiDb.flows) watiDb.flows = [];
  if (!watiDb.chatbotRules) watiDb.chatbotRules = [];

  let reply = "";
  let modeUsed = "VISUAL_FLOW";

  const query = content.trim().toLowerCase();
  const userState = watiDb.activeUserStates[sanitizedPhone];

  // ── BRANCH 1: CSAT survey responders ──
  if (userState && userState.waitingForCsat) {
    const score = parseInt(query);
    if (score >= 1 && score <= 5) {
      if (!watiDb.chatMetadata[sanitizedPhone]) {
        watiDb.chatMetadata[sanitizedPhone] = { assignedOperator: "Unassigned", tags: [], internalNotes: [] };
      }
      if (!watiDb.chatMetadata[sanitizedPhone].internalNotes) {
        watiDb.chatMetadata[sanitizedPhone].internalNotes = [];
      }
      watiDb.chatMetadata[sanitizedPhone].internalNotes.push({
        id: "csat_" + Date.now(),
        author: "Survey System",
        content: `CSAT Rating received from user: ${score} out of 5 stars.`,
        createdAt: new Date().toISOString()
      });
      reply = watiDb.csatSettings?.thankYouMessage || "Thank you for rating our counselor support!";
      delete watiDb.activeUserStates[sanitizedPhone];
      modeUsed = "CSAT_SURVEY";
    } else {
      reply = "Please reply with a valid rating score from 1 to 5.";
    }
  } 
  // ── BRANCH 2: In-Progress Dialog Flow Nodes ──
  else if (userState && userState.flowId) {
    const activeFlow = watiDb.flows.find((f: any) => f.id === userState.flowId);
    if (activeFlow && activeFlow.active) {
      const currentNode = activeFlow.nodes.find((n: any) => n.id === userState.currentNodeId);
      
      if (currentNode && (currentNode.type === "BRANCH" || currentNode.type === "choice")) {
        const branches = currentNode.branches || {};
        const targetNodeId = branches[query] || branches[content.trim()];
        
        if (targetNodeId) {
          const nextNode = activeFlow.nodes.find((n: any) => n.id === targetNodeId);
          if (nextNode) {
            reply = nextNode.text || "";
            
            if (nextNode.type === "ROUTE" || nextNode.type === "route_operator") {
              // Route to Counselor operator
              if (!watiDb.chatMetadata[sanitizedPhone]) {
                watiDb.chatMetadata[sanitizedPhone] = { assignedOperator: "Unassigned", tags: [], internalNotes: [] };
              }
              watiDb.chatMetadata[sanitizedPhone].assignedOperator = nextNode.operator || "Counsellor";
              delete watiDb.activeUserStates[sanitizedPhone]; // Exit flow
            } else {
              // Set next node
              watiDb.activeUserStates[sanitizedPhone].currentNodeId = nextNode.id;
            }
          }
        } else {
          reply = `⚠️ Option not recognized. Please reply with a valid choice:\n\n${currentNode.text}`;
        }
      } else {
        delete watiDb.activeUserStates[sanitizedPhone];
      }
    } else {
      delete watiDb.activeUserStates[sanitizedPhone];
    }
  }
  // ── BRANCH 3: Check if input triggers a Flow ──
  else {
    const matchedFlow = watiDb.flows.find((f: any) => f.active && query.includes(f.trigger.toLowerCase()));
    
    if (matchedFlow) {
      const rootNode = matchedFlow.nodes.find((n: any) => n.id === matchedFlow.startNodeId);
      if (rootNode) {
        reply = rootNode.text || "";
        watiDb.activeUserStates[sanitizedPhone] = {
          flowId: matchedFlow.id,
          currentNodeId: rootNode.nextNodeId || rootNode.id
        };
        // If the start node is a branch itself, set the current node correctly
        if (rootNode.type === "BRANCH" || rootNode.type === "choice") {
          watiDb.activeUserStates[sanitizedPhone].currentNodeId = rootNode.id;
        }
      }
    } else {
      // ── BRANCH 4: Rule-based Keyword Triggers & Gemini fallback ──
      modeUsed = config.botMode;
      if (config.botMode === "RULE_BASED") {
        reply = await generateRuleBasedReply(content.trim(), config);
      } else {
        // AI Gemini Mode
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === "your-gemini-api-key-here" || apiKey === "") {
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
    }
  }

  // Save Wati database states
  try {
    fs.writeFileSync(dbPath, JSON.stringify(watiDb, null, 2), "utf8");
  } catch (saveErr) {
    console.error("Failed to save Wati activeUserStates in chatbot processor:", saveErr);
  }

  // Save outgoing message in database
  await db.whatsAppMessage.create({
    data: {
      phone: sanitizedPhone,
      direction: "OUTGOING",
      content: reply,
      leadId: lead.id,
      status: "DELIVERED",
    },
  });

  // Log message details locally to workspace
  try {
    const logsDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFilePath = path.join(logsDir, "whatsapp_logs.txt");
    const logMessage = `[${new Date().toISOString()}] BOT REPLY to: ${sanitizedPhone} (Lead: ${lead.name}) | Mode: ${modeUsed} | Reply: ${reply}\n`;
    fs.appendFileSync(logFilePath, logMessage, "utf8");
  } catch (err) {
    console.error("Failed to write WhatsApp logs to file", err);
  }

  // Send response via Meta WhatsApp Cloud API if configured
  if (config.accessToken && config.phoneNumberId) {
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
            text: { body: reply }
          }),
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

  const historyMessages = await db.whatsAppMessage.findMany({
    where: { phone },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const history = historyMessages.reverse().map((m) => ({
    role: m.direction === "INCOMING" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.content }],
  }));

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: contextPrompt,
  });

  const chat = model.startChat({
    history: history.slice(0, -1),
  });

  const result = await chat.sendMessage(content);
  const response = await result.response;
  return response.text();
}
