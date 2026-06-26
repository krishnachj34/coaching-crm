"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/utils/db";
import { verifyAuth as centralVerifyAuth } from "@/utils/auth";

async function verifyAuth() {
  return await centralVerifyAuth("academics");
}

export async function getDailyAttendance(dateStr: string) {
  await verifyAuth();

  const targetDate = new Date(dateStr);

  // 1. Get all registered students
  const students = await db.student.findMany({
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

  // 4. Return combined records (defaulting empty ones to "PRESENT")
  return students.map((student) => ({
    studentId: student.id,
    studentName: student.name,
    studentPhone: student.phone,
    status: logMap.get(student.id) || "PRESENT",
  }));
}

export async function saveDailyAttendance(
  dateStr: string,
  records: { studentId: string; status: string }[]
) {
  await verifyAuth();

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

    revalidatePath("/attendance");
    revalidatePath("/students");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
