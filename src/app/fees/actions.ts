"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/utils/db";
import { serializePrisma } from "@/utils/serialize";
import { verifyAuth as centralVerifyAuth } from "@/utils/auth";
import { getBranchContext, getBranchFilter } from "@/utils/branch";
import { logActivity } from "@/utils/activity";

async function verifyAuth() {
  return await centralVerifyAuth("students");
}

export async function getPayments(search?: string, status?: string) {
  await verifyAuth();
  const branchFilter = await getBranchFilter();

  const payments = await db.payment.findMany({
    where: {
      ...branchFilter,
      AND: [
        status && status !== "ALL" ? { status } : {},
        search
          ? {
              student: {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                ],
              },
            }
          : {},
      ],
    },
    include: {
      student: true,
    },
    orderBy: { paymentDate: "desc" },
  });

  return serializePrisma(payments);
}

export async function getPaymentStats() {
  await verifyAuth();
  const branchFilter = await getBranchFilter();

  const allPayments = await db.payment.findMany({
    where: branchFilter
  });

  const totalPaid = allPayments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPending = allPayments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return { totalPaid, totalPending };
}

export async function createPayment(formData: FormData) {
  const { profile } = await verifyAuth();
  const branchContext = await getBranchContext();
  const branchId = branchContext.branchId;

  const studentId = formData.get("studentId") as string;
  const amountStr = formData.get("amount") as string;
  const status = formData.get("status") as string || "PENDING";
  const dateStr = formData.get("paymentDate") as string;
  const notes = formData.get("notes") as string || null;

  if (!studentId || !amountStr) {
    return { error: "Student and Amount are required." };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: "Invalid payment amount." };
  }

  const paymentDate = dateStr ? new Date(dateStr) : new Date();

  try {
    const payment = await db.payment.create({
      data: {
        studentId,
        amount,
        status,
        paymentDate,
        notes,
        branchId: branchId || null,
      },
      include: {
        student: true,
      },
    });

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "CREATED",
      module: "FEES",
      entityId: payment.id,
      description: `Created invoice/payment of ₹${amount} for student ${payment.student.name} (${status})`,
    });

    revalidatePath("/fees");
    revalidatePath("/students");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function verifyPaymentStatus(paymentId: string, approve: boolean, rejectionReason?: string) {
  const { profile } = await verifyAuth();
  if (profile.role !== "ADMIN" && profile.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized. Only Directors can verify payments.");
  }

  try {
    let payment;
    if (approve) {
      payment = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: "PAID",
          paymentDate: new Date(),
        },
        include: { student: true },
      });
    } else {
      payment = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: "PENDING",
          notes: rejectionReason ? `Rejected: ${rejectionReason}` : "Verification rejected by Director.",
        },
        include: { student: true },
      });
    }

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "UPDATED",
      module: "FEES",
      entityId: payment.id,
      description: approve 
        ? `Approved/Verified payment of ₹${payment.amount} for student ${payment.student.name}`
        : `Rejected payment verification of ₹${payment.amount} for student ${payment.student.name}. Reason: ${rejectionReason || "None"}`,
    });

    revalidatePath("/fees");
    revalidatePath("/students");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updatePaymentStatus(id: string, status: string) {
  const { profile } = await verifyAuth();

  try {
    const payment = await db.payment.update({
      where: { id },
      data: { status },
      include: { student: true },
    });

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "UPDATED",
      module: "FEES",
      entityId: payment.id,
      description: `Updated status of payment ID ${payment.id} for student ${payment.student.name} to ${status}`,
    });

    revalidatePath("/fees");
    revalidatePath("/students");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deletePayment(id: string) {
  const { profile } = await verifyAuth();

  try {
    const payment = await db.payment.delete({
      where: { id },
      include: { student: true },
    });

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "DELETED",
      module: "FEES",
      entityId: payment.id,
      description: `Deleted payment record of ₹${payment.amount} for student ${payment.student.name}`,
    });

    revalidatePath("/fees");
    revalidatePath("/students");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
