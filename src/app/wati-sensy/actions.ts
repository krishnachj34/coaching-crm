"use server";

import { db } from "@/utils/db";
import { verifyAuth } from "@/utils/auth";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "app", "wati-sensy", "db.json");

// Helper to read local JSON database
function getWatiDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      const defaultState = {
        campaigns: [],
        templates: [],
        chatbotRules: [],
        cannedReplies: [],
        chatMetadata: {},
        flows: [
          {
            id: "flow_1",
            name: "Course & Brochure Admissions Flow",
            trigger: "start",
            active: true,
            startNodeId: "root",
            nodes: [
              {
                id: "root",
                type: "BRANCH",
                text: "Hello! Welcome to Foreign Language Wala. Which course would you like to prepare for?\n\n1. IELTS Preparation\n2. German Language Course\n3. French Language Course\n4. Talk with Executive",
                branches: {
                  "1": "ielts_node",
                  "2": "german_node",
                  "3": "french_node",
                  "4": "counselor_node"
                }
              },
              {
                id: "ielts_node",
                type: "BRANCH",
                text: "📚 IELTS Course Prep:\n\nHere is our complete brochure detailing syllabus, batch timings & fees:\n🔗 https://foreignlanguagewala.com/brochures/ielts.pdf\n\nHow would you like to proceed?\n1. Talk with Executive\n2. Go Back to Main Menu",
                branches: {
                  "1": "counselor_node",
                  "2": "root"
                }
              },
              {
                id: "german_node",
                type: "BRANCH",
                text: "🇩🇪 German Language Prep (A1 - C1):\n\nHere is our complete brochure detailing syllabus, batch timings & fees:\n🔗 https://foreignlanguagewala.com/brochures/german.pdf\n\nHow would you like to proceed?\n1. Talk with Executive\n2. Go Back to Main Menu",
                branches: {
                  "1": "counselor_node",
                  "2": "root"
                }
              },
              {
                id: "french_node",
                type: "BRANCH",
                text: "🇫🇷 French Language Prep (A1 - B2):\n\nHere is our complete brochure detailing syllabus, batch timings & fees:\n🔗 https://foreignlanguagewala.com/brochures/french.pdf\n\nHow would you like to proceed?\n1. Talk with Executive\n2. Go Back to Main Menu",
                branches: {
                  "1": "counselor_node",
                  "2": "root"
                }
              },
              {
                id: "counselor_node",
                type: "ROUTE",
                text: "📞 Connect with Executive:\n\nI have alerted our counseling team. A representative will contact you shortly to clarify your queries! Thank you.",
                operator: "Counsellor"
              }
            ]
          }
        ],
        dripSequences: [],
        smartLists: [],
        contactAttributes: {},
        csatSettings: { enabled: true, question: "Rate us 1-5", thankYouMessage: "Thanks!" },
        activeUserStates: {}
      };
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      fs.writeFileSync(dbPath, JSON.stringify(defaultState, null, 2), "utf8");
      return defaultState;
    }
    const fileContent = fs.readFileSync(dbPath, "utf8");
    const parsed = JSON.parse(fileContent);
    // Ensure all professional arrays exist
    if (!parsed.flows || parsed.flows.length === 0) {
      parsed.flows = [
        {
          id: "flow_1",
          name: "Course & Brochure Admissions Flow",
          trigger: "start",
          active: true,
          startNodeId: "root",
          nodes: [
            {
              id: "root",
              type: "BRANCH",
              text: "Hello! Welcome to Foreign Language Wala. Which course would you like to prepare for?\n\n1. IELTS Preparation\n2. German Language Course\n3. French Language Course\n4. Talk with Executive",
              branches: {
                "1": "ielts_node",
                "2": "german_node",
                "3": "french_node",
                "4": "counselor_node"
              }
            },
            {
              id: "ielts_node",
              type: "BRANCH",
              text: "📚 IELTS Course Prep:\n\nHere is our complete brochure detailing syllabus, batch timings & fees:\n🔗 https://foreignlanguagewala.com/brochures/ielts.pdf\n\nHow would you like to proceed?\n1. Talk with Executive\n2. Go Back to Main Menu",
              branches: {
                "1": "counselor_node",
                "2": "root"
              }
            },
            {
              id: "german_node",
              type: "BRANCH",
              text: "🇩🇪 German Language Prep (A1 - C1):\n\nHere is our complete brochure detailing syllabus, batch timings & fees:\n🔗 https://foreignlanguagewala.com/brochures/german.pdf\n\nHow would you like to proceed?\n1. Talk with Executive\n2. Go Back to Main Menu",
              branches: {
                "1": "counselor_node",
                "2": "root"
              }
            },
            {
              id: "french_node",
              type: "BRANCH",
              text: "🇫🇷 French Language Prep (A1 - B2):\n\nHere is our complete brochure detailing syllabus, batch timings & fees:\n🔗 https://foreignlanguagewala.com/brochures/french.pdf\n\nHow would you like to proceed?\n1. Talk with Executive\n2. Go Back to Main Menu",
              branches: {
                "1": "counselor_node",
                "2": "root"
              }
            },
            {
              id: "counselor_node",
              type: "ROUTE",
              text: "📞 Connect with Executive:\n\nI have alerted our counseling team. A representative will contact you shortly to clarify your queries! Thank you.",
              operator: "Counsellor"
            }
          ]
        }
      ];
      fs.writeFileSync(dbPath, JSON.stringify(parsed, null, 2), "utf8");
    }
    if (!parsed.dripSequences) parsed.dripSequences = [];
    if (!parsed.smartLists) parsed.smartLists = [];
    if (!parsed.contactAttributes) parsed.contactAttributes = {};
    if (!parsed.csatSettings) parsed.csatSettings = { enabled: true, question: "Rate us 1-5", thankYouMessage: "Thanks!" };
    if (!parsed.activeUserStates) parsed.activeUserStates = {};
    return parsed;
  } catch (error) {
    console.error("Error reading wati-sensy db.json:", error);
    return {
      campaigns: [],
      templates: [],
      chatbotRules: [],
      cannedReplies: [],
      chatMetadata: {},
      flows: [],
      dripSequences: [],
      smartLists: [],
      contactAttributes: {},
      csatSettings: { enabled: true, question: "Rate us 1-5", thankYouMessage: "Thanks!" },
      activeUserStates: {}
    };
  }
}

// Helper to save local JSON database
function saveWatiDb(data: any) {
  try {
    const dirPath = path.dirname(dbPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing wati-sensy db.json:", error);
    return false;
  }
}

// Get all mock and campaign data
export async function getMarketingData() {
  await verifyAuth();
  return getWatiDb();
}

// ── Manage Flow Builder Triggers ──
export async function saveFlow(flow: any) {
  await verifyAuth();
  const dbState = getWatiDb();
  if (flow.id) {
    dbState.flows = dbState.flows.map((f: any) => f.id === flow.id ? flow : f);
  } else {
    flow.id = "flow_" + Date.now();
    flow.active = true;
    dbState.flows.push(flow);
  }
  saveWatiDb(dbState);
  return { success: true, flows: dbState.flows };
}

export async function deleteFlow(id: string) {
  await verifyAuth();
  const dbState = getWatiDb();
  dbState.flows = dbState.flows.filter((f: any) => f.id !== id);
  saveWatiDb(dbState);
  return { success: true, flows: dbState.flows };
}

export async function toggleFlowActive(id: string, active: boolean) {
  await verifyAuth();
  const dbState = getWatiDb();
  dbState.flows = dbState.flows.map((f: any) => f.id === id ? { ...f, active } : f);
  saveWatiDb(dbState);
  return { success: true, flows: dbState.flows };
}

// ── Manage Drip Campaigns ──
export async function saveDripSequence(drip: any) {
  await verifyAuth();
  const dbState = getWatiDb();
  if (drip.id) {
    dbState.dripSequences = dbState.dripSequences.map((d: any) => d.id === drip.id ? drip : d);
  } else {
    drip.id = "drip_" + Date.now();
    drip.enrollments = [];
    dbState.dripSequences.push(drip);
  }
  saveWatiDb(dbState);
  return { success: true, dripSequences: dbState.dripSequences };
}

export async function deleteDripSequence(id: string) {
  await verifyAuth();
  const dbState = getWatiDb();
  dbState.dripSequences = dbState.dripSequences.filter((d: any) => d.id !== id);
  saveWatiDb(dbState);
  return { success: true, dripSequences: dbState.dripSequences };
}

export async function enrollContactInDrip(phone: string, dripId: string) {
  await verifyAuth();
  const dbState = getWatiDb();
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  
  dbState.dripSequences = dbState.dripSequences.map((drip: any) => {
    if (drip.id === dripId) {
      const alreadyEnrolled = drip.enrollments.some((e: any) => e.phone === cleanPhone);
      if (!alreadyEnrolled) {
        return {
          ...drip,
          enrollments: [
            ...drip.enrollments,
            { phone: cleanPhone, enrolledAt: new Date().toISOString(), currentStepIdx: 0 }
          ]
        };
      }
    }
    return drip;
  });

  saveWatiDb(dbState);
  return { success: true, dripSequences: dbState.dripSequences };
}

// ── Custom Attributes & Smart Lists ──
export async function updateContactAttributes(phone: string, attributes: any) {
  await verifyAuth();
  const dbState = getWatiDb();
  const cleanPhone = phone.replace(/[^0-9]/g, "");

  dbState.contactAttributes[cleanPhone] = {
    ...(dbState.contactAttributes[cleanPhone] || {}),
    ...attributes
  };

  saveWatiDb(dbState);
  return { success: true, contactAttributes: dbState.contactAttributes };
}

export async function saveSmartList(smartList: any) {
  await verifyAuth();
  const dbState = getWatiDb();
  if (smartList.id) {
    dbState.smartLists = dbState.smartLists.map((s: any) => s.id === smartList.id ? smartList : s);
  } else {
    smartList.id = "smart_" + Date.now();
    dbState.smartLists.push(smartList);
  }
  saveWatiDb(dbState);
  return { success: true, smartLists: dbState.smartLists };
}

export async function deleteSmartList(id: string) {
  await verifyAuth();
  const dbState = getWatiDb();
  dbState.smartLists = dbState.smartLists.filter((s: any) => s.id !== id);
  saveWatiDb(dbState);
  return { success: true, smartLists: dbState.smartLists };
}

// ── CSAT Ratings Config ──
export async function updateCsatSettings(settings: { enabled: boolean; question: string; thankYouMessage: string }) {
  await verifyAuth();
  const dbState = getWatiDb();
  dbState.csatSettings = settings;
  saveWatiDb(dbState);
  return { success: true, csatSettings: dbState.csatSettings };
}

// ── Manage Chatbot Rules ──
export async function saveChatbotRule(data: { id?: string; trigger: string; response: string; active: boolean }) {
  await verifyAuth();
  const dbState = getWatiDb();
  if (data.id) {
    dbState.chatbotRules = dbState.chatbotRules.map((rule: any) =>
      rule.id === data.id ? { ...rule, trigger: data.trigger, response: data.response, active: data.active } : rule
    );
  } else {
    const newRule = {
      id: "rule_" + Date.now(),
      trigger: data.trigger,
      response: data.response,
      active: data.active
    };
    dbState.chatbotRules.push(newRule);
  }
  saveWatiDb(dbState);
  return { success: true, chatbotRules: dbState.chatbotRules };
}

export async function deleteChatbotRule(id: string) {
  await verifyAuth();
  const dbState = getWatiDb();
  dbState.chatbotRules = dbState.chatbotRules.filter((rule: any) => rule.id !== id);
  saveWatiDb(dbState);
  return { success: true, chatbotRules: dbState.chatbotRules };
}

// ── Manage Canned Replies ──
export async function saveCannedReply(data: { id?: string; shortcut: string; text: string }) {
  await verifyAuth();
  const dbState = getWatiDb();
  if (data.id) {
    dbState.cannedReplies = dbState.cannedReplies.map((c: any) =>
      c.id === data.id ? { ...c, shortcut: data.shortcut, text: data.text } : c
    );
  } else {
    const newCanned = {
      id: "canned_" + Date.now(),
      shortcut: data.shortcut,
      text: data.text
    };
    dbState.cannedReplies.push(newCanned);
  }
  saveWatiDb(dbState);
  return { success: true, cannedReplies: dbState.cannedReplies };
}

export async function deleteCannedReply(id: string) {
  await verifyAuth();
  const dbState = getWatiDb();
  dbState.cannedReplies = dbState.cannedReplies.filter((c: any) => c.id !== id);
  saveWatiDb(dbState);
  return { success: true, cannedReplies: dbState.cannedReplies };
}

// ── Manage WhatsApp Templates ──
export async function saveTemplate(data: {
  id?: string;
  name: string;
  category: string;
  language: string;
  headerText: string;
  bodyText: string;
  footerText: string;
  buttons: any[];
}) {
  await verifyAuth();
  const dbState = getWatiDb();
  if (data.id) {
    dbState.templates = dbState.templates.map((tmpl: any) =>
      tmpl.id === data.id ? { ...tmpl, ...data } : tmpl
    );
  } else {
    const newTmpl = {
      ...data,
      id: "tmpl_" + Date.now(),
      status: "APPROVED",
      createdAt: new Date().toISOString()
    };
    dbState.templates.push(newTmpl);
  }
  saveWatiDb(dbState);
  return { success: true, templates: dbState.templates };
}

export async function deleteTemplate(id: string) {
  await verifyAuth();
  const dbState = getWatiDb();
  dbState.templates = dbState.templates.filter((tmpl: any) => tmpl.id !== id);
  saveWatiDb(dbState);
  return { success: true, templates: dbState.templates };
}

export async function syncMetaTemplates() {
  await verifyAuth();
  const dbState = getWatiDb();
  dbState.templates = dbState.templates.map((tmpl: any) => ({
    ...tmpl,
    status: "APPROVED"
  }));
  saveWatiDb(dbState);
  return { success: true, templates: dbState.templates };
}

// ── Shared Inbox: Fetch Chat Threads ──
export async function getInboxChats() {
  await verifyAuth();
  const dbState = getWatiDb();
  
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
    const cleanPhone = msg.phone.replace(/[^0-9]/g, "");
    if (!chatMap.has(cleanPhone)) {
      const meta = dbState.chatMetadata[cleanPhone] || {
        assignedOperator: "Unassigned",
        tags: [],
        internalNotes: []
      };

      chatMap.set(cleanPhone, {
        phone: cleanPhone,
        leadName: msg.lead?.name || `WhatsApp User ${cleanPhone.slice(-4)}`,
        leadId: msg.leadId,
        leadStatus: msg.lead?.status || null,
        leadInterest: msg.lead?.interest || null,
        lastMessage: msg.content,
        lastMessageTime: msg.createdAt.toISOString(),
        direction: msg.direction,
        status: msg.status,
        messageType: msg.messageType,
        assignedOperator: meta.assignedOperator || "Unassigned",
        tags: meta.tags || [],
        internalNotesCount: meta.internalNotes?.length || 0
      });
    }
  }

  Object.keys(dbState.chatMetadata).forEach((phone) => {
    if (!chatMap.has(phone)) {
      const meta = dbState.chatMetadata[phone];
      chatMap.set(phone, {
        phone,
        leadName: `WhatsApp User ${phone.slice(-4)}`,
        leadId: null,
        leadStatus: "NEW",
        leadInterest: null,
        lastMessage: "No messages yet",
        lastMessageTime: new Date().toISOString(),
        direction: "OUTGOING",
        status: "DELIVERED",
        messageType: "text",
        assignedOperator: meta.assignedOperator || "Unassigned",
        tags: meta.tags || [],
        internalNotesCount: meta.internalNotes?.length || 0
      });
    }
  });

  return Array.from(chatMap.values());
}

// Fetch Full Thread Details (Messages + Metadata + Attributes)
export async function getChatDetails(phone: string) {
  await verifyAuth();
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const dbState = getWatiDb();

  const messages = await db.whatsAppMessage.findMany({
    where: { phone: cleanPhone },
    orderBy: { createdAt: "asc" },
  });

  let contactInfo: any = null;
  const lead = await db.lead.findFirst({
    where: { phone: cleanPhone },
    include: { branch: true }
  });

  if (lead) {
    contactInfo = {
      type: "LEAD",
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      interest: lead.interest,
      branch: lead.branch?.name || "No Branch",
      notes: lead.notes,
      createdAt: lead.createdAt.toISOString()
    };
  } else {
    const student = await db.student.findFirst({
      where: { phone: cleanPhone },
      include: { branch: true }
    });
    if (student) {
      contactInfo = {
        type: "STUDENT",
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        status: "ENROLLED",
        interest: "IELTS Course",
        branch: student.branch?.name || "No Branch",
        notes: student.address,
        createdAt: student.createdAt.toISOString()
      };
    } else {
      contactInfo = {
        type: "UNKNOWN",
        id: null,
        name: `WhatsApp User ${cleanPhone.slice(-4)}`,
        email: null,
        phone: cleanPhone,
        status: "NEW",
        interest: null,
        branch: "General",
        notes: null,
        createdAt: new Date().toISOString()
      };
    }
  }

  const meta = dbState.chatMetadata[cleanPhone] || {
    assignedOperator: "Unassigned",
    tags: [],
    internalNotes: []
  };

  const attributes = dbState.contactAttributes[cleanPhone] || {};

  return {
    phone: cleanPhone,
    contactInfo,
    messages: messages.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString()
    })),
    assignedOperator: meta.assignedOperator || "Unassigned",
    tags: meta.tags || [],
    internalNotes: meta.internalNotes || [],
    attributes
  };
}

// Update Operator Assignment or Tags
export async function updateChatMetadata(phone: string, data: { assignedOperator?: string; tags?: string[] }) {
  await verifyAuth();
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const dbState = getWatiDb();

  if (!dbState.chatMetadata[cleanPhone]) {
    dbState.chatMetadata[cleanPhone] = {
      assignedOperator: "Unassigned",
      tags: [],
      internalNotes: []
    };
  }

  if (data.assignedOperator !== undefined) {
    // If ticket marked solved, check if we trigger CSAT survey
    if (data.assignedOperator === "Solved" && dbState.csatSettings?.enabled) {
      dbState.activeUserStates[cleanPhone] = {
        waitingForCsat: true,
        solvedAt: new Date().toISOString()
      };
      
      // Auto-trigger CSAT outgoing message in background simulation
      setTimeout(async () => {
        await db.whatsAppMessage.create({
          data: {
            phone: cleanPhone,
            direction: "OUTGOING",
            messageType: "text",
            content: `🤖 Support Survey:\n${dbState.csatSettings.question}`,
            status: "DELIVERED"
          }
        });
      }, 500);
    }
    dbState.chatMetadata[cleanPhone].assignedOperator = data.assignedOperator;
  }
  if (data.tags !== undefined) {
    dbState.chatMetadata[cleanPhone].tags = data.tags;
  }

  saveWatiDb(dbState);
  return { success: true, metadata: dbState.chatMetadata[cleanPhone] };
}

// Add Yellow Internal Note
export async function addInternalNote(phone: string, noteContent: string) {
  const { profile } = await verifyAuth();
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const dbState = getWatiDb();

  if (!dbState.chatMetadata[cleanPhone]) {
    dbState.chatMetadata[cleanPhone] = {
      assignedOperator: "Unassigned",
      tags: [],
      internalNotes: []
    };
  }

  const newNote = {
    id: "note_" + Date.now(),
    author: profile.name || "Agent",
    content: noteContent,
    createdAt: new Date().toISOString()
  };

  dbState.chatMetadata[cleanPhone].internalNotes.push(newNote);
  saveWatiDb(dbState);
  return { success: true, internalNotes: dbState.chatMetadata[cleanPhone].internalNotes };
}

// Launch Simulated Campaign Broadcast with Detailed Recipient Audits
export async function launchCampaign(name: string, templateId: string, segment: string) {
  await verifyAuth();
  const dbState = getWatiDb();
  
  const template = dbState.templates.find((t: any) => t.id === templateId);
  if (!template) {
    throw new Error("Template not found");
  }

  let targets: { phone: string; name: string; id?: string }[] = [];

  // Filter based on segment (All, Tags, or Smart Lists)
  if (segment === "ALL_LEADS") {
    const leads = await db.lead.findMany({ select: { id: true, name: true, phone: true } });
    targets = leads.map(l => ({ id: l.id, name: l.name, phone: l.phone }));
  } else if (segment === "ENROLLED_STUDENTS") {
    const students = await db.student.findMany({ select: { id: true, name: true, phone: true } });
    targets = students.map(s => ({ id: s.id, name: s.name, phone: s.phone }));
  } else if (segment.startsWith("TAG:")) {
    const targetTag = segment.replace("TAG:", "");
    const matchingPhones: string[] = [];
    Object.entries(dbState.chatMetadata).forEach(([phone, meta]: [string, any]) => {
      if (meta.tags && meta.tags.includes(targetTag)) {
        matchingPhones.push(phone);
      }
    });

    const leads = await db.lead.findMany({
      where: { phone: { in: matchingPhones } },
      select: { id: true, name: true, phone: true }
    });
    targets = leads.map(l => ({ id: l.id, name: l.name, phone: l.phone }));

    const students = await db.student.findMany({
      where: { phone: { in: matchingPhones } },
      select: { id: true, name: true, phone: true }
    });
    students.forEach((s) => {
      if (!targets.some(t => t.phone === s.phone)) {
        targets.push({ id: s.id, name: s.name, phone: s.phone });
      }
    });
  } else if (segment.startsWith("SMART:")) {
    const smartId = segment.replace("SMART:", "");
    const smart = dbState.smartLists.find((s: any) => s.id === smartId);
    if (smart) {
      const rule = smart.rules;
      const matchingPhones: string[] = [];

      if (rule.tag) {
        Object.entries(dbState.chatMetadata).forEach(([phone, meta]: [string, any]) => {
          if (meta.tags && meta.tags.includes(rule.tag)) {
            matchingPhones.push(phone);
          }
        });
      } else if (rule.attribute) {
        Object.entries(dbState.contactAttributes).forEach(([phone, attrs]: [string, any]) => {
          if (attrs[rule.attribute] === rule.value) {
            matchingPhones.push(phone);
          }
        });
      }

      const leads = await db.lead.findMany({
        where: { phone: { in: matchingPhones } },
        select: { id: true, name: true, phone: true }
      });
      targets = leads.map(l => ({ id: l.id, name: l.name, phone: l.phone }));

      const students = await db.student.findMany({
        where: { phone: { in: matchingPhones } },
        select: { id: true, name: true, phone: true }
      });
      students.forEach((s) => {
        if (!targets.some(t => t.phone === s.phone)) {
          targets.push({ id: s.id, name: s.name, phone: s.phone });
        }
      });
    }
  }

  if (targets.length === 0) {
    targets = [
      { name: "Aman Sharma", phone: "919000000001" },
      { name: "Priya Patel", phone: "919000000002" },
      { name: "Rahul Verma", phone: "919000000003" },
      { name: "Simulated User", phone: "919876543210" }
    ];
  }

  const statuses = ["DELIVERED", "READ", "READ", "DELIVERED", "SENT"];
  let sent = 0;
  let delivered = 0;
  let read = 0;

  const recipientsReport: any[] = [];

  for (const contact of targets) {
    const cleanPhone = contact.phone.replace(/[^0-9]/g, "");
    
    let messageText = template.bodyText
      .replace("{{1}}", contact.name)
      .replace("{{2}}", "Next Saturday")
      .replace("{{3}}", "11:00 AM")
      .replace("{{4}}", "30th July");

    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    sent++;
    if (randomStatus !== "SENT") delivered++;
    if (randomStatus === "READ") read++;

    recipientsReport.push({
      name: contact.name,
      phone: cleanPhone,
      status: randomStatus,
      time: new Date().toISOString()
    });

    await db.whatsAppMessage.create({
      data: {
        phone: cleanPhone,
        direction: "OUTGOING",
        messageType: "template",
        content: `[TEMPLATE: ${template.name}]\n${messageText}`,
        status: randomStatus,
        leadId: contact.id || null
      }
    });
  }

  const replies = Math.floor(read * 0.4);
  const clicks = Math.floor(read * 0.25);

  const newCampaign = {
    id: "camp_" + Date.now(),
    name,
    templateId,
    targetSegment: segment,
    status: "COMPLETED",
    sentCount: sent,
    deliveredCount: delivered,
    readCount: read,
    repliedCount: replies,
    clickedCount: clicks,
    createdAt: new Date().toISOString(),
    recipients: recipientsReport
  };

  dbState.campaigns.push(newCampaign);
  saveWatiDb(dbState);

  return { success: true, campaign: newCampaign, campaigns: dbState.campaigns };
}

// Webhook simulation handler with Dialog Flow branching, Drip enrollment, and CSAT collection
export async function simulateIncomingWebhook(phone: string, name: string, content: string) {
  await verifyAuth();
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const dbState = getWatiDb();

  // Find/Create Lead
  let lead = await db.lead.findFirst({ where: { phone: cleanPhone } });
  if (!lead) {
    let finalBranchId = null;
    const branch = await db.branch.findFirst();
    if (branch) finalBranchId = branch.id;

    lead = await db.lead.create({
      data: {
        name: name || `WhatsApp User ${cleanPhone.slice(-4)}`,
        phone: cleanPhone,
        status: "NEW",
        source: "WHATSAPP",
        notes: `Auto-created in simulation: "${content}"`,
        branchId: finalBranchId
      }
    });
  }

  // Save incoming message
  const incomingMsg = await db.whatsAppMessage.create({
    data: {
      phone: cleanPhone,
      direction: "INCOMING",
      messageType: "text",
      content,
      leadId: lead.id,
      status: "DELIVERED"
    }
  });

  const chatbotConfig = await db.whatsAppChatbotConfig.findUnique({ where: { id: "default" } });
  let replyText = "";
  let botReplied = false;

  if (chatbotConfig?.botEnabled) {
    botReplied = true;
    const query = content.trim().toLowerCase();

    // 1. Check if user is in CSAT rating survey wait state
    const userState = dbState.activeUserStates[cleanPhone];
    if (userState && userState.waitingForCsat) {
      const score = parseInt(query);
      if (score >= 1 && score <= 5) {
        // Log rating in note metadata
        if (!dbState.chatMetadata[cleanPhone]) {
          dbState.chatMetadata[cleanPhone] = { assignedOperator: "Unassigned", tags: [], internalNotes: [] };
        }
        dbState.chatMetadata[cleanPhone].internalNotes.push({
          id: "csat_" + Date.now(),
          author: "Survey System",
          content: `CSAT Rating received from user: ${score} out of 5 stars.`,
          createdAt: new Date().toISOString()
        });
        replyText = dbState.csatSettings?.thankYouMessage || "Thank you for rating our counselor support!";
        delete dbState.activeUserStates[cleanPhone];
        saveWatiDb(dbState);
      } else {
        replyText = "Please reply with a valid rating score from 1 to 5.";
      }
    } 
    // 2. Check if user is in an active visual interactive flow
    else if (userState && userState.flowId) {
      const activeFlow = dbState.flows.find((f: any) => f.id === userState.flowId);
      if (activeFlow && activeFlow.active) {
        const currentNode = activeFlow.nodes.find((n: any) => n.id === userState.currentNodeId);
        
        if (currentNode && currentNode.type === "BRANCH") {
          // Look up if user's input matches any branch choice
          const targetNodeId = currentNode.branches[query] || currentNode.branches[content.trim()];
          
          if (targetNodeId) {
            const nextNode = activeFlow.nodes.find((n: any) => n.id === targetNodeId);
            if (nextNode) {
              replyText = nextNode.text || "";
              
              if (nextNode.type === "ROUTE") {
                // Route message -> assign operator
                if (!dbState.chatMetadata[cleanPhone]) {
                  dbState.chatMetadata[cleanPhone] = { assignedOperator: "Unassigned", tags: [], internalNotes: [] };
                }
                dbState.chatMetadata[cleanPhone].assignedOperator = nextNode.operator;
                delete dbState.activeUserStates[cleanPhone]; // Exit flow
              } else {
                // Advance current node
                dbState.activeUserStates[cleanPhone].currentNodeId = nextNode.id;
              }
              saveWatiDb(dbState);
            }
          } else {
            // Keep user on same branch node but send reminder/error
            replyText = `⚠️ Option not recognized. Please choose a valid number from the list:\n\n${currentNode.text || "Please choose one of the choices above."}`;
          }
        } else {
          // Fallback if node structure is broken, reset state
          delete dbState.activeUserStates[cleanPhone];
          saveWatiDb(dbState);
        }
      } else {
        delete dbState.activeUserStates[cleanPhone];
        saveWatiDb(dbState);
      }
    }
    // 3. Check if user inputs a trigger that starts a flow
    else {
      const matchedFlow = dbState.flows.find((f: any) => f.active && query.includes(f.trigger.toLowerCase()));
      
      if (matchedFlow) {
        // Start flow
        const rootNode = matchedFlow.nodes.find((n: any) => n.id === matchedFlow.startNodeId);
        if (rootNode) {
          replyText = rootNode.text;
          dbState.activeUserStates[cleanPhone] = {
            flowId: matchedFlow.id,
            currentNodeId: rootNode.nextNodeId
          };
          saveWatiDb(dbState);
        }
      } else {
        // 4. Default keyword rules matching
        const matchedRule = dbState.chatbotRules.find((r: any) =>
          r.active && query.includes(r.trigger.toLowerCase())
        );

        if (matchedRule) {
          replyText = matchedRule.response;
        } else if (
          query.includes("hello") ||
          query.includes("hi") ||
          query.includes("hey") ||
          query === "start" ||
          query === "menu"
        ) {
          replyText = chatbotConfig.welcomeMessage;
        } else {
          if (query.includes("course") || query.includes("fees") || query.includes("price")) {
            const courses = await db.course.findMany({ select: { title: true, feeAmount: true } });
            if (courses.length > 0) {
              replyText = "Here are our IELTS courses:\n\n";
              courses.forEach((c) => {
                replyText += `🔹 *${c.title}*\n   Fee: ₹${Number(c.feeAmount).toLocaleString()}\n\n`;
              });
              replyText += "Reply 'agent' to speak with a counselor.";
            } else {
              replyText = "We offer IELTS prep courses. Reply 'agent' for counselors.";
            }
          } else {
            replyText = chatbotConfig.fallbackMessage || "Sorry, I didn't get that. Type 'agent' to speak to counselor.";
          }
        }
      }
    }

    // Save outgoing bot response in database
    await db.whatsAppMessage.create({
      data: {
        phone: cleanPhone,
        direction: "OUTGOING",
        messageType: "text",
        content: replyText,
        leadId: lead.id,
        status: "DELIVERED"
      }
    });
  }

  return {
    success: true,
    botReplied,
    incoming: {
      ...incomingMsg,
      createdAt: incomingMsg.createdAt.toISOString()
    },
    reply: botReplied ? replyText : null
  };
}

// Send manual reply
export async function sendInboxMessage(phone: string, content: string, messageType: string = "text") {
  const { profile } = await verifyAuth();
  const cleanPhone = phone.replace(/[^0-9]/g, "");

  let lead = await db.lead.findFirst({ where: { phone: cleanPhone } });
  if (!lead) {
    let finalBranchId = null;
    const branch = await db.branch.findFirst();
    if (branch) finalBranchId = branch.id;

    lead = await db.lead.create({
      data: {
        name: `WhatsApp User ${cleanPhone.slice(-4)}`,
        phone: cleanPhone,
        status: "NEW",
        source: "WHATSAPP",
        branchId: finalBranchId
      }
    });
  }

  const msg = await db.whatsAppMessage.create({
    data: {
      phone: cleanPhone,
      direction: "OUTGOING",
      messageType,
      content,
      leadId: lead.id,
      status: "DELIVERED"
    }
  });

  try {
    const logsDir = path.join(process.cwd(), "public");
    const logFilePath = path.join(logsDir, "whatsapp_logs.txt");
    const logMessage = `[${new Date().toISOString()}] INBOX SEND by: ${profile.name} to: ${cleanPhone} | Msg: ${content}\n`;
    fs.appendFileSync(logFilePath, logMessage, "utf8");
  } catch (err) {
    console.error("Failed to write manual send WhatsApp logs", err);
  }

  // Send response via Meta WhatsApp Cloud API if configured
  const config = await db.whatsAppChatbotConfig.findUnique({
    where: { id: "default" },
  });

  if (config?.accessToken && config?.phoneNumberId && messageType === "text") {
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
            to: cleanPhone,
            type: "text",
            text: { body: content }
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
      createdAt: msg.createdAt.toISOString()
    }
  };
}

// Update chatbot configuration
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

  return { success: true, config: updated };
}
