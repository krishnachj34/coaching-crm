import { createClient } from "@/utils/supabase/server";
import { db } from "@/utils/db";
import { redirect } from "next/navigation";

export async function verifyAuth(requiredPermission?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let profile = await db.profile.findUnique({
    where: { id: user.id },
  });

  if (!profile) {
    // If the database has absolutely NO profiles, let the first logging in user in as an ADMIN
    // so they can access the application and bootstrap it.
    const count = await db.profile.count();
    if (count === 0) {
      profile = await db.profile.create({
        data: {
          id: user.id,
          email: user.email!,
          name: user.email?.split("@")[0] || "Admin User",
          role: "ADMIN",
          active: true,
          permissions: {
            leads: "EDIT",
            students: "EDIT",
            academics: "EDIT",
            teachers: "EDIT",
            library: "EDIT",
            exams: "EDIT",
            users: "EDIT"
          }
        }
      });
    } else {
      // Otherwise redirect to login with error
      redirect("/login?error=profile_not_found");
    }
  }

  if (!profile.active) {
    redirect("/login?error=account_disabled");
  }

  // Check role-based permission or module-specific permission if provided
  if (requiredPermission && profile.role !== "ADMIN" && profile.role !== "SUPER_ADMIN") {
    const permissions = (profile.permissions as Record<string, string> | null) || {};
    const permLevel = permissions[requiredPermission] || "NONE";
    if (permLevel === "NONE") {
      throw new Error(`Unauthorized. You do not have permission to access the ${requiredPermission} module.`);
    }
  }

  return { user, profile };
}
