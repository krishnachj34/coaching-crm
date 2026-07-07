import { db } from "@/utils/db";

interface LogParams {
  userId: string;
  userName: string;
  userRole: string;
  actionType: string; // CREATED, UPDATED, DELETED, COMPLETED_TASK, LOGIN, LOGOUT
  module: string;     // LEADS, STUDENTS, ATTENDANCE, STAFF, FEES, EXAMS, ACADEMICS, etc.
  entityId?: string;
  description: string;
}

export async function logActivity({
  userId,
  userName,
  userRole,
  actionType,
  module,
  entityId,
  description,
}: LogParams) {
  try {
    await db.activityLog.create({
      data: {
        userId,
        userName,
        userRole,
        actionType,
        module,
        entityId: entityId || null,
        description,
      },
    });
  } catch (error) {
    console.error("Failed to write to ActivityLog:", error);
  }
}
