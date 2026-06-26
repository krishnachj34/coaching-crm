"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/utils/db";
import { serializePrisma } from "@/utils/serialize";
import { redirect } from "next/navigation";
import { verifyAuth } from "@/utils/auth";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

// Utility to verify that the logged-in user is an Admin
async function verifyAdmin() {
  const { user, profile } = await verifyAuth("users");

  // Allow either ADMIN or SUPER_ADMIN role (or fallback check to verify if they are the first user)
  if (!profile || (profile.role !== "ADMIN" && profile.role !== "SUPER_ADMIN" && profile.email !== user.email)) {
    throw new Error("Unauthorized. Only administrators can access this module.");
  }

  return profile;
}

export async function getStaffProfiles() {
  await verifyAdmin();

  const profiles = await db.profile.findMany({
    orderBy: { createdAt: "desc" },
  });

  return serializePrisma(profiles);
}

export async function createStaffProfile(formData: FormData, permissionsJson: string) {
  await verifyAdmin();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const role = formData.get("role") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password || !role) {
    return { error: "Name, email, password, and role are required." };
  }

  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Create client using Service Role Key if available, fallback to Anon Key otherwise
    const supabase = createSupabaseJsClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let authUser;
    if (serviceRoleKey) {
      // Create user using Admin API - auto-confirms email and bypasses signup restriction
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) {
        return { error: error.message };
      }
      authUser = data.user;
    } else {
      console.warn(
        "WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined. Falling back to public signUp. " +
        "Disable public signups in your Supabase dashboard and configure SUPABASE_SERVICE_ROLE_KEY for full security."
      );
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }
      authUser = data.user;
    }

    if (!authUser) {
      return { error: "Failed to create user account in Supabase." };
    }

    const userId = authUser.id;
    const permissions = JSON.parse(permissionsJson);

    // Create or update the corresponding Profile table record in public schema
    await db.profile.upsert({
      where: { id: userId },
      update: {
        name,
        role,
        permissions,
        phone: phone || null,
        active: true,
      },
      create: {
        id: userId,
        email,
        name,
        role,
        permissions,
        phone: phone || null,
        active: true,
      },
    });

    revalidatePath("/user-manager");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function updateStaffPermissions(
  id: string,
  formData: FormData,
  permissionsJson: string
) {
  await verifyAdmin();

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const role = formData.get("role") as string;
  const activeStr = formData.get("active") as string;

  if (!name || !role) {
    return { error: "Name and role are required." };
  }

  try {
    const permissions = JSON.parse(permissionsJson);
    const active = activeStr === "true";

    await db.profile.update({
      where: { id },
      data: {
        name,
        phone: phone || null,
        role,
        permissions,
        active,
      },
    });

    revalidatePath("/user-manager");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}
