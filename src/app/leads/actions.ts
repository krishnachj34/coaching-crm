"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/utils/db";
import { serializePrisma } from "@/utils/serialize";
import { verifyAuth as centralVerifyAuth } from "@/utils/auth";

async function verifyAuth() {
  return await centralVerifyAuth("leads");
}

export async function getLeads(search?: string, status?: string) {
  await verifyAuth();

  const leads = await db.lead.findMany({
    where: {
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
  await verifyAuth();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const interest = formData.get("interest") as string;
  const status = (formData.get("status") as string) || "NEW";
  const notes = formData.get("notes") as string;

  if (!name || !phone) {
    return { error: "Name and Phone number are required." };
  }

  try {
    await db.lead.create({
      data: {
        name,
        email: email || null,
        phone,
        interest: interest || null,
        status,
        notes: notes || null,
      },
    });
    revalidatePath("/leads");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateLeadStatus(id: string, status: string) {
  await verifyAuth();

  try {
    await db.lead.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/leads");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteLead(id: string) {
  await verifyAuth();

  try {
    await db.lead.delete({
      where: { id },
    });
    revalidatePath("/leads");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
