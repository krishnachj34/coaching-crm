"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/utils/db";
import fs from "fs";
import path from "path";
import { serializePrisma } from "@/utils/serialize";
import { verifyAuth as centralVerifyAuth } from "@/utils/auth";
import { getBranchContext, getBranchFilter } from "@/utils/branch";
import { getLeadInstituteFilter } from "@/app/instituteActions";

import { logActivity } from "@/utils/activity";

async function verifyAuth() {
  return await centralVerifyAuth("leads");
}

export async function getLeads(search?: string, status?: string) {
  await verifyAuth();
  const instituteFilter = await getLeadInstituteFilter();

  const leads = await db.lead.findMany({
    where: {
      ...instituteFilter,
      AND: [
        status && status !== "ALL" ? { status } : {},
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return serializePrisma(leads);
}

export async function createLead(formData: FormData) {
  const { profile } = await verifyAuth();
  const branchContext = await getBranchContext();
  const branchId = branchContext.branchId;

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const interest = formData.get("interest") as string;
  const status = (formData.get("status") as string) || "NEW";
  const notes = formData.get("notes") as string;
  const source = (formData.get("source") as string) || "MANUAL";
  const trialStartDateStr = formData.get("trialStartDate") as string;
  const trialEndDateStr = formData.get("trialEndDate") as string;
  const nextFollowUpDateStr = formData.get("nextFollowUpDate") as string;
  const nextFollowUpTimeStr = formData.get("nextFollowUpTime") as string;
  const followUpNotes = formData.get("followUpNotes") as string;

  if (!name || !phone) {
    return { error: "Name and Phone number are required." };
  }

  const parsedTrialStart = trialStartDateStr ? new Date(trialStartDateStr) : null;
  const parsedTrialEnd = trialEndDateStr ? new Date(trialEndDateStr) : null;

  let parsedNextFollowUp = null;
  if (nextFollowUpDateStr) {
    const timePart = nextFollowUpTimeStr || "00:00";
    parsedNextFollowUp = new Date(`${nextFollowUpDateStr}T${timePart}`);
  }

  try {
    const lead = await db.lead.create({
      data: {
        name,
        email: email || null,
        phone,
        interest: interest || null,
        status,
        notes: notes || null,
        source,
        trialStartDate: parsedTrialStart,
        trialEndDate: parsedTrialEnd,
        nextFollowUp: parsedNextFollowUp,
        followUpNotes: followUpNotes || null,
        branchId: branchId || null,
      },
    });

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "CREATED",
      module: "LEADS",
      entityId: lead.id,
      description: `Created lead ${lead.name} (${lead.phone})`,
    });

    revalidatePath("/leads");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateLeadFollowUp(
  id: string,
  dateStr: string | null,
  timeStr: string | null,
  notes: string | null
) {
  const { profile } = await verifyAuth();

  let nextFollowUp: Date | null = null;
  if (dateStr) {
    const timePart = timeStr || "00:00";
    nextFollowUp = new Date(`${dateStr}T${timePart}`);
  }

  try {
    const lead = await db.lead.update({
      where: { id },
      data: {
        nextFollowUp,
        followUpNotes: notes || null,
      },
    });

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "UPDATED",
      module: "LEADS",
      entityId: lead.id,
      description: nextFollowUp
        ? `Scheduled follow-up for lead ${lead.name} on ${nextFollowUp.toLocaleString()}`
        : `Cancelled follow-up for lead ${lead.name}`,
    });

    revalidatePath("/leads");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function completeLeadFollowUp(id: string) {
  const { profile } = await verifyAuth();

  try {
    const lead = await db.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return { error: "Lead not found." };
    }

    const currentNotes = lead.notes || "";
    const archivedNote = `[Follow-up Call completed on ${new Date().toLocaleString()}]: ${lead.followUpNotes || "No call notes."}`;
    const newNotes = currentNotes ? `${currentNotes}\n${archivedNote}` : archivedNote;

    await db.lead.update({
      where: { id },
      data: {
        nextFollowUp: null,
        followUpNotes: null,
        notes: newNotes,
      },
    });

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "UPDATED",
      module: "LEADS",
      entityId: lead.id,
      description: `Completed follow-up for lead ${lead.name}`,
    });

    revalidatePath("/leads");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateLeadStatus(id: string, status: string) {
  const { profile } = await verifyAuth();

  try {
    const lead = await db.lead.update({
      where: { id },
      data: { status },
    });

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "UPDATED",
      module: "LEADS",
      entityId: lead.id,
      description: `Updated status of lead ${lead.name} to ${status}`,
    });

    revalidatePath("/leads");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteLead(id: string) {
  const { profile } = await verifyAuth();

  try {
    const lead = await db.lead.delete({
      where: { id },
    });

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "DELETED",
      module: "LEADS",
      entityId: lead.id,
      description: `Deleted lead ${lead.name}`,
    });

    revalidatePath("/leads");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getLeadsWithWatiMeta(search?: string, status?: string) {
  await verifyAuth();
  const branchFilter = await getBranchFilter();

  const leads = await db.lead.findMany({
    where: {
      ...branchFilter,
      AND: [
        status && status !== "ALL" ? { status } : {},
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      whatsappMessages: {
        select: { id: true }
      }
    }
  });

  // Read Wati metadata JSON
  let chatMetadata: any = {};
  let contactAttributes: any = {};
  try {
    const dbPath = path.join(process.cwd(), "src", "app", "wati-sensy", "db.json");
    if (fs.existsSync(dbPath)) {
      const fileContent = fs.readFileSync(dbPath, "utf8");
      const parsed = JSON.parse(fileContent);
      chatMetadata = parsed.chatMetadata || {};
      contactAttributes = parsed.contactAttributes || {};
    }
  } catch (error) {
    console.error("Failed to read Wati db.json in leads actions:", error);
  }

  // Merge metadata and calculate lead scores
  const leadsWithMeta = leads.map((lead) => {
    const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
    const meta = chatMetadata[cleanPhone] || {};
    const attrs = contactAttributes[cleanPhone] || {};
    
    // Algorithmic Lead Scoring priority
    let score = 0;
    if (lead.nextFollowUp) score += 15;
    if (lead.trialStartDate) score += 20;
    if (lead.notes && lead.notes.length > 5) score += 5;
    if (lead.source === "WHATSAPP" || lead.source === "WEB" || lead.source === "FACEBOOK") score += 10;
    if (meta.tags && meta.tags.length > 0) score += 10;
    if (lead.whatsappMessages && lead.whatsappMessages.length > 0) score += 20;

    return {
      ...lead,
      assignedOperator: meta.assignedOperator || "Unassigned",
      tags: meta.tags || [],
      attributes: attrs,
      leadScore: score
    };
  });

  return serializePrisma(leadsWithMeta);
}

export async function updateLeadDetails(
  id: string,
  data: {
    notes: string | null;
    trialStartDate: Date | null;
    trialEndDate: Date | null;
  }
) {
  const { profile } = await verifyAuth();

  try {
    const lead = await db.lead.update({
      where: { id },
      data: {
        notes: data.notes,
        trialStartDate: data.trialStartDate,
        trialEndDate: data.trialEndDate
      }
    });

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "UPDATED",
      module: "LEADS",
      entityId: lead.id,
      description: `Updated notes and trial class configurations for lead ${lead.name}`,
    });

    revalidatePath("/leads");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
