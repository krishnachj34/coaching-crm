"use server";

import { db } from "@/utils/db";
import { verifyAuth as centralVerifyAuth } from "@/utils/auth";
import { serializePrisma } from "@/utils/serialize";
import { revalidatePath } from "next/cache";

export async function getActivityLogs() {
  const { profile } = await centralVerifyAuth();

  let logs;
  if (profile.role === "ADMIN" || profile.role === "SUPER_ADMIN") {
    logs = await db.activityLog.findMany({
      orderBy: { createdAt: "desc" },
    });
  } else {
    logs = await db.activityLog.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "desc" },
    });
  }

  return serializePrisma(logs);
}

export async function createManualLog(formData: FormData) {
  const { profile } = await centralVerifyAuth();
  const description = formData.get("description") as string;
  const module = formData.get("module") as string;
  const actionType = formData.get("actionType") as string;

  if (!description) {
    return { error: "Log description/remark is required." };
  }

  try {
    const log = await db.activityLog.create({
      data: {
        userId: profile.id,
        userName: profile.name || profile.email,
        userRole: profile.role,
        actionType: actionType || "MANUAL",
        module: module || "GENERAL",
        description: description,
      },
    });

    revalidatePath("/activity-log");
    return { success: true, log: serializePrisma(log) };
  } catch (error: any) {
    return { error: error.message || "Failed to save manual log." };
  }
}
