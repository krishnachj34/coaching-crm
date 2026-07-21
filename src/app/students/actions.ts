"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/utils/db";
import { serializePrisma } from "@/utils/serialize";
import { verifyAuth as centralVerifyAuth } from "@/utils/auth";
import { getBranchContext, getBranchFilter } from "@/utils/branch";
import { getStudentInstituteFilter, getInstituteContext } from "@/app/instituteActions";
import { logActivity } from "@/utils/activity";

async function verifyAuth() {
  return await centralVerifyAuth("students");
}

export async function getStudents(search?: string) {
  await verifyAuth();
  const instituteFilter = await getStudentInstituteFilter();

  const students = await db.student.findMany({
    where: {
      ...instituteFilter,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      batchEnrollments: {
        include: {
          batch: {
            include: {
              subCategory: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      },
      payments: true,
      attendance: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return serializePrisma(students);
}

export async function getActiveBatches() {
  await verifyAuth();
  const branchFilter = await getBranchFilter();

  const batches = await db.batch.findMany({
    where: {
      active: true,
      ...branchFilter,
    },
    include: {
      subCategory: {
        include: {
          category: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return serializePrisma(batches);
}

export async function createStudent(formData: FormData, batchIds: string[]) {
  const { profile } = await verifyAuth();
  const branchContext = await getBranchContext();
  const branchId = branchContext.branchId;

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const rollNo = formData.get("rollNo") as string;
  const address = formData.get("address") as string;
  const parentName = formData.get("parentName") as string;
  const parentPhone = formData.get("parentPhone") as string;
  const photoUrl = formData.get("photoUrl") as string;

  // New fields
  const courseEndDateStr = formData.get("courseEndDate") as string;
  const installments = formData.get("installments") as string;
  
  // Financial fields
  const feesPaidAmtStr = formData.get("feesPaidAmt") as string;
  const feesPaidDateStr = formData.get("feesPaidDate") as string;
  const feesDueAmtStr = formData.get("feesDueAmt") as string;
  const feesDueDateStr = formData.get("feesDueDate") as string;

  if (!name || !phone) {
    return { error: "Name and Phone number are required." };
  }

  const courseEndDate = courseEndDateStr ? new Date(courseEndDateStr) : null;
  const feesPaidAmt = feesPaidAmtStr ? parseFloat(feesPaidAmtStr) : 0;
  const feesDueAmt = feesDueAmtStr ? parseFloat(feesDueAmtStr) : 0;

  const instituteContext = await getInstituteContext();
  const activeInstituteId = instituteContext.activeInstituteId;

  const studentInstallments = activeInstituteId === "STUDY_ABROAD"
    ? `TAG_STUDY_ABROAD_PORTAL: ${installments || "Full Package"}`
    : (installments || null);

  const studentAddress = activeInstituteId === "STUDY_ABROAD"
    ? `${address || ""} [Study Abroad]`.trim()
    : (address || null);

  try {
    const student = await db.student.create({
      data: {
        name,
        email: email || null,
        phone,
        rollNo: rollNo || null,
        address: studentAddress,
        parentName: parentName || null,
        parentPhone: parentPhone || null,
        photoUrl: photoUrl || null,
        branchId: branchId || null,
        courseEndDate,
        installments: studentInstallments,
      },
    });

    // Create batch enrollments for the selected batches
    if (batchIds && batchIds.length > 0) {
      await db.studentBatchEnrollment.createMany({
        data: batchIds.map((batchId) => ({
          studentId: student.id,
          batchId,
        })),
      });
    }

    // Create Paid Payment record if amount > 0
    if (feesPaidAmt > 0) {
      await db.payment.create({
        data: {
          studentId: student.id,
          amount: feesPaidAmt,
          status: "PAID",
          paymentDate: feesPaidDateStr ? new Date(feesPaidDateStr) : new Date(),
          notes: `Admission payment (Initial). Mode: ${installments || "Lumpsump"}.`,
          branchId: branchId || null,
        },
      });
    }

    // Create Pending Payment record if amount > 0
    if (feesDueAmt > 0) {
      await db.payment.create({
        data: {
          studentId: student.id,
          amount: feesDueAmt,
          status: "PENDING",
          paymentDate: feesDueDateStr ? new Date(feesDueDateStr) : new Date(),
          notes: `Pending fee installment.`,
          branchId: branchId || null,
        },
      });
    }

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "CREATED",
      module: "STUDENTS",
      entityId: student.id,
      description: `Created student ${student.name} (${student.phone}) and enrolled in ${batchIds.length} batches`,
    });

    revalidatePath("/students");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function deleteStudent(id: string) {
  const { profile } = await verifyAuth();

  try {
    const student = await db.student.delete({
      where: { id },
    });

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "DELETED",
      module: "STUDENTS",
      entityId: student.id,
      description: `Deleted student ${student.name}`,
    });

    revalidatePath("/students");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function getStudentById(id: string) {
  await verifyAuth();
  const branchFilter = await getBranchFilter();

  const student = await db.student.findFirst({
    where: { 
      id,
      ...branchFilter,
    },
    include: {
      batchEnrollments: {
        include: {
          batch: {
            include: {
              subCategory: {
                include: {
                  category: true,
                },
              },
            },
          },
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

export async function updateStudent(id: string, formData: FormData, batchIds: string[]) {
  const { profile } = await verifyAuth();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const rollNo = formData.get("rollNo") as string;
  const address = formData.get("address") as string;
  const parentName = formData.get("parentName") as string;
  const parentPhone = formData.get("parentPhone") as string;
  const photoUrl = formData.get("photoUrl") as string;

  const courseEndDateStr = formData.get("courseEndDate") as string;
  const installments = formData.get("installments") as string;

  if (!name || !phone) {
    return { error: "Name and Phone number are required." };
  }

  const courseEndDate = courseEndDateStr ? new Date(courseEndDateStr) : null;

  try {
    const student = await db.student.update({
      where: { id },
      data: {
        name,
        email: email || null,
        phone,
        rollNo: rollNo || null,
        address: address || null,
        parentName: parentName || null,
        parentPhone: parentPhone || null,
        photoUrl: photoUrl || null,
        courseEndDate,
        installments: installments || null,
      },
    });

    // Update batch enrollments
    if (batchIds) {
      await db.studentBatchEnrollment.deleteMany({
        where: { studentId: id },
      });
      if (batchIds.length > 0) {
        await db.studentBatchEnrollment.createMany({
          data: batchIds.map((batchId) => ({
            studentId: id,
            batchId,
          })),
        });
      }
    }

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "UPDATED",
      module: "STUDENTS",
      entityId: student.id,
      description: `Updated student details for ${student.name}`,
    });

    revalidatePath("/students");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}
