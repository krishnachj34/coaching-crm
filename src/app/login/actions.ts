"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/utils/db";
import { logActivity } from "@/utils/activity";

export async function login(currentState: any, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const targetInstitute = (formData.get("institute") as string) || "FOREIGN_LANGUAGE";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Validate Institute Account Access Rights
  if (data?.user) {
    try {
      const profile = await db.profile.findUnique({ where: { id: data.user.id } });
      if (profile) {
        const permissions = (profile.permissions as any) || {};
        const userAssignedInstitute = permissions.institute;

        // If user account is locked to a specific institute, reject sign in to other institutes
        if (
          userAssignedInstitute &&
          userAssignedInstitute !== "BOTH" &&
          userAssignedInstitute !== targetInstitute &&
          profile.role !== "SUPER_ADMIN"
        ) {
          await supabase.auth.signOut();
          const allowedName = userAssignedInstitute === "STUDY_ABROAD" ? "Study Abroad Wala" : "Foreign Language Wala";
          const currentName = targetInstitute === "STUDY_ABROAD" ? "Study Abroad Wala" : "Foreign Language Wala";
          return {
            error: `Access Denied: Your user account is authorized for ${allowedName} only and cannot sign into ${currentName}.`,
          };
        }

        await logActivity({
          userId: profile.id,
          userName: profile.name || profile.email,
          userRole: profile.role,
          actionType: "LOGIN",
          module: "AUTH",
          entityId: profile.id,
          description: `Logged into ${targetInstitute === "STUDY_ABROAD" ? "Study Abroad Wala" : "Foreign Language Wala"}`,
        });
      }
    } catch (err) {
      console.error("Logging login action failed:", err);
    }
  }

  const cookieStore = await cookies();
  cookieStore.set("active_institute", targetInstitute, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const profile = await db.profile.findUnique({ where: { id: user.id } });
      if (profile) {
        await logActivity({
          userId: profile.id,
          userName: profile.name || profile.email,
          userRole: profile.role,
          actionType: "LOGOUT",
          module: "AUTH",
          entityId: profile.id,
          description: "Logged out successfully",
        });
      }
    }
  } catch (err) {
    console.error("Logging logout action failed:", err);
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Signout error:", error.message);
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function logoutAndSwitchInstitute(targetInstitute: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.set("active_institute", targetInstitute, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  redirect(`/login?institute=${targetInstitute}`);
}
