"use server";

import { db } from "@/utils/db";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { redirect } from "next/navigation";

async function verifyAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function askAssistant(
  messageHistory: { role: "user" | "model"; parts: string }[],
  latestMessage: string
) {
  await verifyAuth();

  // 1. Gather CRM Snapshot Data
  const leadsCount = await db.lead.count();
  const leads = await db.lead.findMany({ select: { name: true, status: true, interest: true } });

  const studentsCount = await db.student.count();
  const students = await db.student.findMany({
    select: {
      name: true,
      enrollments: { select: { course: { select: { title: true } } } },
    },
  });

  const courses = await db.course.findMany({
    select: { title: true, feeAmount: true, enrollments: { select: { studentId: true } } },
  });

  const payments = await db.payment.findMany({
    select: { amount: true, status: true, paymentDate: true, student: { select: { name: true } } },
  });

  const attendance = await db.attendance.findMany({
    select: { date: true, status: true, student: { select: { name: true } } },
  });

  // Compile context summaries
  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPresent = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const totalAbsent = attendance.filter((a) => a.status === "ABSENT").length;
  const attendanceRate =
    attendance.length > 0 ? (totalPresent / attendance.length) * 100 : 100;

  const contextText = `
You are the AI Assistant for the Coaching CRM system. You have read-only access to the database metrics.
Here is the current state of the database:
- Total Leads: ${leadsCount}
- Leads list: ${JSON.stringify(leads)}
- Total Registered Students: ${studentsCount}
- Students list (with courses): ${JSON.stringify(
    students.map((s) => ({
      name: s.name,
      courses: s.enrollments.map((e) => e.course.title),
    }))
  )}
- Courses: ${JSON.stringify(
    courses.map((c) => ({
      title: c.title,
      fee: Number(c.feeAmount),
      studentsCount: c.enrollments.length,
    }))
  )}
- Financials:
  * Total Collected: $${totalPaid.toFixed(2)}
  * Total Pending (Outstanding): $${totalPending.toFixed(2)}
  * Recent payments log: ${JSON.stringify(
    payments.slice(0, 10).map((p) => ({
      student: p.student.name,
      amount: Number(p.amount),
      status: p.status,
    }))
  )}
- Attendance Summary:
  * Overall Attendance Rate: ${attendanceRate.toFixed(1)}%
  * Present/Late count: ${totalPresent}
  * Absent count: ${totalAbsent}
  * Recent attendance checks: ${JSON.stringify(
    attendance.slice(0, 10).map((a) => ({
      student: a.student.name,
      date: new Date(a.date).toLocaleDateString(),
      status: a.status,
    }))
  )}

Answer the user's question clearly and concisely. Reference actual counts and stats.
`;

  // 2. Check for API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    return getMockResponse(latestMessage, {
      leadsCount,
      studentsCount,
      totalPaid,
      totalPending,
      attendanceRate,
    });
  }

  // 3. Connect to Gemini API
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: contextText,
    });

    const chat = model.startChat({
      history: messageHistory.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.parts }],
      })),
    });

    const result = await chat.sendMessage(latestMessage);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini API call failed:", error);
    return `Error: Failed to fetch response from Gemini. Details: ${error.message}`;
  }
}

function getMockResponse(
  message: string,
  stats: {
    leadsCount: number;
    studentsCount: number;
    totalPaid: number;
    totalPending: number;
    attendanceRate: number;
  }
) {
  const query = message.toLowerCase();

  let reply = `[MOCK ASSISTANT - Put your GEMINI_API_KEY in .env.local for real AI answers]\n\n`;

  if (query.includes("lead")) {
    reply += `You currently have **${stats.leadsCount} leads** logged in your pipeline. You can manage them in the Lead Management section.`;
  } else if (query.includes("student")) {
    reply += `There are **${stats.studentsCount} active students** registered in the coaching center.`;
  } else if (
    query.includes("fee") ||
    query.includes("payment") ||
    query.includes("collected") ||
    query.includes("money") ||
    query.includes("revenue")
  ) {
    reply += `Here is your tuition collection status:\n- **Collected**: $${stats.totalPaid.toFixed(
      2
    )}\n- **Pending**: $${stats.totalPending.toFixed(2)}`;
  } else if (query.includes("attendance")) {
    reply += `Your overall student attendance rate is **${stats.attendanceRate.toFixed(
      1
    )}%** based on daily logs.`;
  } else {
    reply += `Hello! I am your Coaching CRM co-pilot. I can help analyze leads, students, attendance rates, and fee payments.

Examples of questions you can ask me:
- *"How many leads do we have?"*
- *"Show me our financial statistics"*
- *"What is our overall student attendance rate?"*

*(Note: To connect me to a real Gemini model, create a free API key at Google AI Studio and set GEMINI_API_KEY in your .env.local file).*`;
  }

  return reply;
}
