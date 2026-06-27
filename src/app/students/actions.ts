"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/utils/db";
import { serializePrisma } from "@/utils/serialize";
import { verifyAuth as centralVerifyAuth } from "@/utils/auth";

async function verifyAuth() {
  return await centralVerifyAuth("students");
}

export async function getStudents(search?: string) {
  await verifyAuth();

  const students = await db.student.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {},
    include: {
      enrollments: {
        include: {
          course: true,
        },
      },
      payments: true,
      attendance: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return serializePrisma(students);
}

export async function getCourses() {
  await verifyAuth();

  let courses = await db.course.findMany({
    orderBy: { title: "asc" },
  });

  // Proactive Seeding: If no courses exist, seed some defaults for testing.
  if (courses.length === 0) {
    try {
      await db.course.createMany({
        data: [
          { title: "IELTS Academic Complete", description: "Comprehensive preparation for the IELTS Academic modules.", feeAmount: 15000.0 },
          { title: "IELTS General Training", description: "Preparation for the IELTS General Training modules.", feeAmount: 12000.0 },
          { title: "IELTS Speaking Booster", description: "Focused speaking modules with native feedback.", feeAmount: 8000.0 },
          { title: "IELTS Writing Masterclass", description: "Task 1 & Task 2 writing techniques.", feeAmount: 6000.0 },
        ],
      });
      courses = await db.course.findMany({
        orderBy: { title: "asc" },
      });
    } catch (e) {
      console.error("Autoseed courses error:", e);
    }
  }

  return serializePrisma(courses);
}

export async function createStudent(formData: FormData, courseIds: string[]) {
  await verifyAuth();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const rollNo = formData.get("rollNo") as string;
  const address = formData.get("address") as string;
  const parentName = formData.get("parentName") as string;
  const parentPhone = formData.get("parentPhone") as string;
  const photoUrl = formData.get("photoUrl") as string;

  if (!name || !phone) {
    return { error: "Name and Phone number are required." };
  }

  try {
    const student = await db.student.create({
      data: {
        name,
        email: email || null,
        phone,
        rollNo: rollNo || null,
        address: address || null,
        parentName: parentName || null,
        parentPhone: parentPhone || null,
        photoUrl: photoUrl || null,
      },
    });

    // Create enrollments for the selected courses
    if (courseIds && courseIds.length > 0) {
      await db.enrollment.createMany({
        data: courseIds.map((courseId) => ({
          studentId: student.id,
          courseId,
        })),
      });
    }

    revalidatePath("/students");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function deleteStudent(id: string) {
  await verifyAuth();

  try {
    await db.student.delete({
      where: { id },
    });
    revalidatePath("/students");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function createCourse(formData: FormData) {
  await verifyAuth();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const feeAmountStr = formData.get("feeAmount") as string;

  if (!title || !feeAmountStr) {
    return { error: "Title and Fee Amount are required." };
  }

  const feeAmount = parseFloat(feeAmountStr);
  if (isNaN(feeAmount) || feeAmount < 0) {
    return { error: "Invalid fee amount." };
  }

  try {
    const course = await db.course.create({
      data: {
        title,
        description: description || null,
        feeAmount,
      },
    });
    revalidatePath("/students");
    return { success: true, course: serializePrisma(course) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function deleteCourse(id: string) {
  await verifyAuth();

  try {
    await db.course.delete({
      where: { id },
    });
    revalidatePath("/students");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function getStudentById(id: string) {
  await verifyAuth();

  const student = await db.student.findUnique({
    where: { id },
    include: {
      enrollments: {
        include: {
          course: true,
        },
      },
      payments: {
        orderBy: { paymentDate: "desc" },
      },
      attendance: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!student) return null;
  return serializePrisma(student);
}

