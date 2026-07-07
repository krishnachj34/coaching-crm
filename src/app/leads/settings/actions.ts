"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/utils/db";
import { verifyAuth } from "@/utils/auth";
import { serializePrisma } from "@/utils/serialize";

export async function getMetaSettings() {
  const { profile } = await verifyAuth("leads");
  
  let settings = await db.integrationSettings.findUnique({
    where: { id: "meta" },
  });

  if (!settings) {
    settings = await db.integrationSettings.create({
      data: {
        id: "meta",
        enabled: false,
        verifyToken: "coaching_crm_secret_token",
      },
    });
  }

  return serializePrisma(settings);
}

export async function updateMetaSettings(formData: FormData) {
  const { profile } = await verifyAuth("leads");

  const enabled = formData.get("enabled") === "true";
  const verifyToken = formData.get("verifyToken") as string;
  const accessToken = formData.get("accessToken") as string;
  const pageId = formData.get("pageId") as string;
  const fieldsMappingJson = formData.get("fieldsMapping") as string;
  const fieldsMapping = fieldsMappingJson ? JSON.parse(fieldsMappingJson) : null;

  if (!verifyToken) {
    return { error: "Verify Token is required." };
  }

  try {
    await db.integrationSettings.upsert({
      where: { id: "meta" },
      update: {
        enabled,
        verifyToken,
        accessToken: accessToken || null,
        pageId: pageId || null,
        fieldsMapping: fieldsMapping || null,
      },
      create: {
        id: "meta",
        enabled,
        verifyToken,
        accessToken: accessToken || null,
        pageId: pageId || null,
        fieldsMapping: fieldsMapping || null,
      },
    });

    revalidatePath("/leads");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
