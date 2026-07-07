"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/utils/db";
import { serializePrisma } from "@/utils/serialize";
import { verifyAuth as centralVerifyAuth } from "@/utils/auth";
import { getBranchFilter } from "@/utils/branch";
import { logActivity } from "@/utils/activity";

async function verifyAuth() {
  return await centralVerifyAuth("academics");
}

export async function getDailyAttendance(dateStr: string) {
  await verifyAuth();

  const targetDate = new Date(dateStr);
  const branchFilter = await getBranchFilter();
  
  // 1. Get all registered students for the active branch with their batch enrollments
  const students = await db.student.findMany({
    where: branchFilter,
    include: {
      batchEnrollments: {
        select: {
          batchId: true,
        }
      }
    },
    orderBy: { name: "asc" },
  });

  // 2. Get attendance logs for this specific date
  const logs = await db.attendance.findMany({
    where: {
      date: targetDate,
    },
  });

  // 3. Map logs into a quick lookup dictionary
  const logMap = new Map<string, string>();
  logs.forEach((log) => {
    logMap.set(log.studentId, log.status);
  });

  // 4. Return combined records (including batchIds)
  return students.map((student) => ({
    studentId: student.id,
    studentName: student.name,
    studentPhone: student.phone,
    batchIds: student.batchEnrollments.map((be) => be.batchId),
    status: logMap.get(student.id) || "PRESENT",
  }));
}

export async function getAttendanceMetadata() {
  await verifyAuth();
  const branchFilter = await getBranchFilter();

  const batches = await db.batch.findMany({
    where: { active: true, ...branchFilter },
    orderBy: { name: "asc" },
  });

  return serializePrisma(batches);
}

export async function saveDailyAttendance(
  dateStr: string,
  records: { studentId: string; status: string }[]
) {
  const { profile } = await verifyAuth();

  const targetDate = new Date(dateStr);

  try {
    // Run all upserts in a single database transaction
    const upsertQueries = records.map((rec) =>
      db.attendance.upsert({
        where: {
          studentId_date: {
            studentId: rec.studentId,
            date: targetDate,
          },
        },
        update: {
          status: rec.status,
        },
        create: {
          studentId: rec.studentId,
          date: targetDate,
          status: rec.status,
        },
      })
    );

    await db.$transaction(upsertQueries);

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "UPDATED",
      module: "ATTENDANCE",
      description: `Saved daily attendance sheet for ${dateStr} (${records.length} students)`,
    });

    revalidatePath("/attendance");
    revalidatePath("/students");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
