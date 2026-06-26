"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/utils/db";
import { serializePrisma } from "@/utils/serialize";
import { verifyAuth as centralVerifyAuth } from "@/utils/auth";

async function verifyAuth() {
  return await centralVerifyAuth("teachers");
}

export async function getTeachers() {
  await verifyAuth();
  const teachers = await db.teacher.findMany({
    include: {
      batches: true,
      leaves: true,
    },
    orderBy: { name: "asc" },
  });
  return serializePrisma(teachers);
}

export async function createTeacher(formData: FormData) {
  await verifyAuth();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const qualification = formData.get("qualification") as string;
  const specialization = formData.get("specialization") as string;
  const franchise = formData.get("franchise") as string;
  const employmentType = formData.get("employmentType") as string;
  const photoUrl = formData.get("photoUrl") as string;

  if (!name || !email || !phone || !franchise) {
    return { error: "Name, email, phone, and franchise branch are required." };
  }

  try {
    await db.teacher.create({
      data: {
        name,
        email,
        phone,
        address: address || null,
        qualification: qualification || null,
        specialization: specialization || null,
        franchise,
        employmentType: employmentType || "FULL_TIME",
        photoUrl: photoUrl || null,
        active: true,
      },
    });

    revalidatePath("/teachers");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function getTeacherLeaves() {
  await verifyAuth();
  const leaves = await db.teacherLeave.findMany({
    include: {
      teacher: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return serializePrisma(leaves);
}

export async function createTeacherLeave(formData: FormData) {
  await verifyAuth();

  const teacherId = formData.get("teacherId") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;
  const reason = formData.get("reason") as string;

  if (!teacherId || !startDateStr || !endDateStr || !reason) {
    return { error: "Teacher, leave duration, and reason are required." };
  }

  try {
    await db.teacherLeave.create({
      data: {
        teacherId,
        startDate: new Date(startDateStr),
        endDate: new Date(endDateStr),
        reason,
        status: "PENDING",
      },
    });

    revalidatePath("/teachers");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function approveTeacherLeave(
  leaveId: string,
  status: string,
  substituteTeacherId?: string
) {
  await verifyAuth();

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

    revalidatePath("/teachers");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}
