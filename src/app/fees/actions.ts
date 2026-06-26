"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/utils/db";
import { serializePrisma } from "@/utils/serialize";
import { verifyAuth as centralVerifyAuth } from "@/utils/auth";

async function verifyAuth() {
  return await centralVerifyAuth("students");
}

export async function getPayments(search?: string, status?: string) {
  await verifyAuth();

  const payments = await db.payment.findMany({
    where: {
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

  const allPayments = await db.payment.findMany();

  const totalPaid = allPayments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPending = allPayments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return { totalPaid, totalPending };
}

export async function createPayment(formData: FormData) {
  await verifyAuth();

  const studentId = formData.get("studentId") as string;
  const amountStr = formData.get("amount") as string;
  const status = formData.get("status") as string || "PENDING";
  const dateStr = formData.get("paymentDate") as string;

  if (!studentId || !amountStr) {
    return { error: "Student and Amount are required." };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: "Invalid payment amount." };
  }

  const paymentDate = dateStr ? new Date(dateStr) : new Date();

  try {
    await db.payment.create({
      data: {
        studentId,
        amount,
        status,
        paymentDate,
      },
    });
    revalidatePath("/fees");
    revalidatePath("/students");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updatePaymentStatus(id: string, status: string) {
  await verifyAuth();

  try {
    await db.payment.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/fees");
    revalidatePath("/students");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deletePayment(id: string) {
  await verifyAuth();

  try {
    await db.payment.delete({
      where: { id },
    });
    revalidatePath("/fees");
    revalidatePath("/students");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
