"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/utils/db";
import { serializePrisma } from "@/utils/serialize";
import { verifyAuth as centralVerifyAuth } from "@/utils/auth";
import { logActivity } from "@/utils/activity";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

// Utility to verify that the logged-in user has Admin privileges for Staff management
async function verifyAdmin() {
  const { user, profile } = await centralVerifyAuth("users");

  if (!profile || (profile.role !== "ADMIN" && profile.role !== "SUPER_ADMIN" && profile.email !== user.email)) {
    throw new Error("Unauthorized. Only administrators can access these features.");
  }

  return profile;
}

// Utility to verify any authenticated staff member
async function verifyStaff() {
  const { profile } = await centralVerifyAuth();
  return profile;
}

export async function getStaffMembers() {
  const adminProfile = await verifyAdmin();

  const [profiles, teachers] = await Promise.all([
    db.profile.findMany({
      orderBy: { createdAt: "desc" },
    }),
    db.teacher.findMany({
      include: {
        batches: true,
        leaves: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const unifiedRoster: any[] = [];

  // 1. Process profiles
  profiles.forEach((profile) => {
    const emailLower = profile.email.toLowerCase();
    const matchingTeacher = teachers.find((t) => t.email.toLowerCase() === emailLower);

    if (matchingTeacher) {
      unifiedRoster.push({
        id: profile.id, // Profile ID is the main ID
        teacherId: matchingTeacher.id, // Keep the Teacher table ID
        email: profile.email,
        name: profile.name || matchingTeacher.name,
        phone: profile.phone || matchingTeacher.phone,
        role: profile.role,
        permissions: profile.permissions,
        active: profile.active,
        branchId: profile.branchId,
        hasLogin: true,
        // Teacher specific fields
        qualification: matchingTeacher.qualification,
        specialization: matchingTeacher.specialization,
        franchise: matchingTeacher.franchise,
        joiningDate: matchingTeacher.joiningDate,
        employmentType: matchingTeacher.employmentType,
        photoUrl: matchingTeacher.photoUrl,
        address: matchingTeacher.address,
        batches: matchingTeacher.batches,
        leaves: matchingTeacher.leaves,
      });
    } else {
      unifiedRoster.push({
        id: profile.id,
        teacherId: null,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        role: profile.role,
        permissions: profile.permissions,
        active: profile.active,
        branchId: profile.branchId,
        hasLogin: true,
        // Default empty teacher fields
        qualification: null,
        specialization: null,
        franchise: null,
        joiningDate: null,
        employmentType: null,
        photoUrl: null,
        address: null,
        batches: [],
        leaves: [],
      });
    }
  });

  // 2. Process teachers who don't have a profile
  teachers.forEach((teacher) => {
    const emailLower = teacher.email.toLowerCase();
    const matchingProfile = profiles.find((p) => p.email.toLowerCase() === emailLower);

    if (!matchingProfile) {
      unifiedRoster.push({
        id: teacher.id, // Use Teacher ID since there's no Profile ID
        teacherId: teacher.id,
        email: teacher.email,
        name: teacher.name,
        phone: teacher.phone,
        role: "TEACHER",
        permissions: null,
        active: teacher.active,
        branchId: teacher.branchId,
        hasLogin: false,
        qualification: teacher.qualification,
        specialization: teacher.specialization,
        franchise: teacher.franchise,
        joiningDate: teacher.joiningDate,
        employmentType: teacher.employmentType,
        photoUrl: teacher.photoUrl,
        address: teacher.address,
        batches: teacher.batches,
        leaves: teacher.leaves,
      });
    }
  });

  return serializePrisma(unifiedRoster);
}

export async function createStaffMember(formData: FormData, permissionsJson: string) {
  const adminProfile = await verifyAdmin();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const role = formData.get("role") as string;
  const password = formData.get("password") as string;
  const branchId = formData.get("branchId") as string;
  
  // Teacher-specific fields
  const qualification = formData.get("qualification") as string;
  const specialization = formData.get("specialization") as string;
  const franchise = formData.get("franchise") as string;
  const employmentType = formData.get("employmentType") as string;
  const address = formData.get("address") as string;
  const photoUrl = formData.get("photoUrl") as string;

  const enableLogin = formData.get("enableLogin") === "true";

  if (!name || !email) {
    return { error: "Name and email are required." };
  }

  try {
    let userId = "";

    // 1. If login is enabled, create user in Supabase & Profile
    if (enableLogin) {
      if (!password || !role) {
        return { error: "Password and role are required when login is enabled." };
      }

      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabase = createSupabaseJsClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      let authUser;
      if (serviceRoleKey) {
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (error) return { error: error.message };
        authUser = data.user;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) return { error: error.message };
        authUser = data.user;
      }

      if (!authUser) {
        return { error: "Failed to create user account in Supabase." };
      }

      userId = authUser.id;
      const permissions = JSON.parse(permissionsJson);

      await db.profile.upsert({
        where: { id: userId },
        update: {
          name,
          role,
          permissions,
          phone: phone || null,
          branchId: branchId || null,
          active: true,
        },
        create: {
          id: userId,
          email,
          name,
          role,
          permissions,
          phone: phone || null,
          branchId: branchId || null,
          active: true,
        },
      });

      await logActivity({
        userId: adminProfile.id,
        userName: adminProfile.name || adminProfile.email,
        userRole: adminProfile.role,
        actionType: "CREATED",
        module: "STAFF",
        entityId: userId,
        description: `Created login credentials for staff ${name} (${role})`,
      });
    }

    // 2. If role is TEACHER, create/sync in Teacher table
    if (role === "TEACHER") {
      // Use the profile user ID if available, otherwise generate a UUID
      const teacherId = userId || crypto.randomUUID();

      const newTeacher = await db.teacher.create({
        data: {
          id: teacherId,
          name,
          email,
          phone,
          address: address || null,
          qualification: qualification || null,
          specialization: specialization || null,
          franchise: franchise || "Amritsar Branch",
          employmentType: employmentType || "FULL_TIME",
          photoUrl: photoUrl || null,
          branchId: branchId || null,
          active: true,
        },
      });

      await logActivity({
        userId: adminProfile.id,
        userName: adminProfile.name || adminProfile.email,
        userRole: adminProfile.role,
        actionType: "CREATED",
        module: "TEACHERS",
        entityId: newTeacher.id,
        description: `Created teacher profile for ${newTeacher.name}`,
      });
    } else {
      // Log staff member creation (if not a teacher)
      await logActivity({
        userId: adminProfile.id,
        userName: adminProfile.name || adminProfile.email,
        userRole: adminProfile.role,
        actionType: "CREATED",
        module: "STAFF",
        description: `Created staff member ${name} (${role})`,
      });
    }

    revalidatePath("/staff");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unknown error occurred" };
  }
}

export async function updateStaffMember(
  id: string,
  formData: FormData,
  permissionsJson: string
) {
  const adminProfile = await verifyAdmin();

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const role = formData.get("role") as string;
  const activeStr = formData.get("active") as string;
  const branchId = formData.get("branchId") as string;

  // Teacher-specific fields
  const qualification = formData.get("qualification") as string;
  const specialization = formData.get("specialization") as string;
  const franchise = formData.get("franchise") as string;
  const employmentType = formData.get("employmentType") as string;
  const address = formData.get("address") as string;
  const photoUrl = formData.get("photoUrl") as string;

  if (!name || !role) {
    return { error: "Name and role are required." };
  }

  const active = activeStr === "true";

  try {
    // Determine if it is a Profile ID or a Teacher ID by checking both tables
    const profile = await db.profile.findUnique({ where: { id } });
    const teacher = await db.teacher.findUnique({ where: { id } });

    const email = profile?.email || teacher?.email;
    if (!email) {
      return { error: "Staff member not found." };
    }

    // 1. Update Profile (if it exists)
    if (profile) {
      const permissions = JSON.parse(permissionsJson);
      await db.profile.update({
        where: { id },
        data: {
          name,
          phone: phone || null,
          role,
          permissions,
          active,
          branchId: branchId || null,
        },
      });

      await logActivity({
        userId: adminProfile.id,
        userName: adminProfile.name || adminProfile.email,
        userRole: adminProfile.role,
        actionType: "UPDATED",
        module: "STAFF",
        entityId: id,
        description: `Updated profile for staff member ${name}`,
      });
    }

    // 2. Sync / Update Teacher table if role is TEACHER
    if (role === "TEACHER") {
      const existingTeacher = await db.teacher.findUnique({ where: { email } });

      if (existingTeacher) {
        await db.teacher.update({
          where: { id: existingTeacher.id },
          data: {
            name,
            phone,
            address: address || null,
            qualification: qualification || null,
            specialization: specialization || null,
            franchise: franchise || "Amritsar Branch",
            employmentType: employmentType || "FULL_TIME",
            photoUrl: photoUrl || null,
            branchId: branchId || null,
            active,
          },
        });
      } else {
        // Create teacher since role changed to TEACHER
        const teacherId = profile ? profile.id : crypto.randomUUID();
        await db.teacher.create({
          data: {
            id: teacherId,
            name,
            email,
            phone,
            address: address || null,
            qualification: qualification || null,
            specialization: specialization || null,
            franchise: franchise || "Amritsar Branch",
            employmentType: employmentType || "FULL_TIME",
            photoUrl: photoUrl || null,
            branchId: branchId || null,
            active,
          },
        });
      }

      await logActivity({
        userId: adminProfile.id,
        userName: adminProfile.name || adminProfile.email,
        userRole: adminProfile.role,
        actionType: "UPDATED",
        module: "TEACHERS",
        description: `Updated teacher profile for ${name}`,
      });
    } else {
      // If the role was changed FROM teacher TO something else,
      // we do NOT delete the teacher record to preserve historical batch/leave data.
      // However, we set the teacher active state to false.
      const existingTeacher = await db.teacher.findUnique({ where: { email } });
      if (existingTeacher) {
        await db.teacher.update({
          where: { id: existingTeacher.id },
          data: {
            active: false,
          },
        });
      }
    }

    revalidatePath("/staff");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unknown error occurred" };
  }
}

// ── TEACHER LEAVES ACTIONS ──
export async function getTeacherLeaves() {
  await verifyStaff();
  const leaves = await db.teacherLeave.findMany({
    include: {
      teacher: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return serializePrisma(leaves);
}

export async function createTeacherLeave(formData: FormData) {
  const profile = await verifyStaff();

  const teacherId = formData.get("teacherId") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;
  const reason = formData.get("reason") as string;

  if (!teacherId || !startDateStr || !endDateStr || !reason) {
    return { error: "Teacher, leave duration, and reason are required." };
  }

  try {
    const leave = await db.teacherLeave.create({
      data: {
        teacherId,
        startDate: new Date(startDateStr),
        endDate: new Date(endDateStr),
        reason,
        status: "PENDING",
      },
    });

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "CREATED",
      module: "TEACHERS",
      entityId: leave.id,
      description: `Applied leave request for teacher ID ${teacherId}`,
    });

    revalidatePath("/staff");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unknown error occurred" };
  }
}

export async function approveTeacherLeave(
  leaveId: string,
  status: string,
  substituteTeacherId?: string
) {
  const adminProfile = await verifyAdmin();

  if (!leaveId || !status) return { error: "Leave ID and Status are required." };

  try {
    const leave = await db.teacherLeave.update({
      where: { id: leaveId },
      data: {
        status,
        substituteTeacherId: substituteTeacherId || null,
      },
      include: {
        teacher: true,
      },
    });

    await logActivity({
      userId: adminProfile.id,
      userName: adminProfile.name || adminProfile.email,
      userRole: adminProfile.role,
      actionType: "UPDATED",
      module: "TEACHERS",
      entityId: leave.id,
      description: `Leave request for teacher ${leave.teacher.name} has been ${status}`,
    });

    // Proactive Notice Generation: Notify students of the teacher's active batches if leave is approved
    if (status === "APPROVED") {
      const activeBatches = await db.batch.findMany({
        where: { teacherId: leave.teacherId, active: true },
      });

      if (activeBatches.length > 0) {
        let subTeacherName = "a substitute teacher";
        if (substituteTeacherId) {
          const subTeacher = await db.teacher.findUnique({
            where: { id: substituteTeacherId },
          });
          if (subTeacher) {
            subTeacherName = subTeacher.name;
          }
        }

        // Create notices for each batch
        await Promise.all(
          activeBatches.map((batch) =>
            db.notice.create({
              data: {
                title: `Class Schedule Notice: ${batch.name}`,
                content: `Dear students, your instructor ${
                  leave.teacher.name
                } is on leave from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(
                  leave.endDate
                ).toLocaleDateString()}. Classes will be conducted by ${subTeacherName}.`,
                targetAudience: "BATCH",
                targetId: batch.id,
                type: "HOLIDAY",
              }
            })
          )
        );
      }
    }

    revalidatePath("/staff");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unknown error occurred" };
  }
}
