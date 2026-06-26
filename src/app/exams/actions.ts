"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/utils/db";
import { serializePrisma } from "@/utils/serialize";
import { verifyAuth as centralVerifyAuth } from "@/utils/auth";

async function verifyAuth() {
  return await centralVerifyAuth("exams");
}

export async function getMockTests() {
  await verifyAuth();
  const mockTests = await db.mockTest.findMany({
    include: {
      batch: true,
      results: {
        include: {
          student: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return serializePrisma(mockTests);
}

export async function createMockTest(formData: FormData) {
  await verifyAuth();

  const title = formData.get("title") as string;
  const durationStr = formData.get("duration") as string;
  const totalMarksStr = formData.get("totalMarks") as string;
  const passMarksStr = formData.get("passMarks") as string;
  const batchId = formData.get("batchId") as string;
  const googleFormLink = formData.get("googleFormLink") as string;
  const googleFormId = formData.get("googleFormId") as string;

  if (!title || !durationStr || !totalMarksStr || !passMarksStr || !batchId) {
    return { error: "Title, duration, marks parameters, and target batch are required." };
  }

  try {
    await db.mockTest.create({
      data: {
        title,
        duration: parseInt(durationStr),
        totalMarks: parseInt(totalMarksStr),
        passMarks: parseInt(passMarksStr),
        batchId,
        googleFormLink: googleFormLink || null,
        googleFormId: googleFormId || null,
      },
    });

    revalidatePath("/exams");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function getTestResults() {
  await verifyAuth();
  const results = await db.testResult.findMany({
    include: {
      mockTest: { include: { batch: true } },
      student: true,
    },
    orderBy: { submittedAt: "desc" },
  });
  return serializePrisma(results);
}

export async function createTestResult(formData: FormData) {
  await verifyAuth();

  const mockTestId = formData.get("mockTestId") as string;
  const studentId = formData.get("studentId") as string;
  const listening = formData.get("listeningScore") as string;
  const reading = formData.get("readingScore") as string;
  const writing = formData.get("writingScore") as string;
  const speaking = formData.get("speakingScore") as string;
  const feedback = formData.get("feedback") as string;

  if (!mockTestId || !studentId) {
    return { error: "Mock test reference and Student reference are required." };
  }

  try {
    // Calculate overall band score (IELTS standard: average of 4 sections rounded to nearest 0.5)
    const lVal = parseFloat(listening || "0");
    const rVal = parseFloat(reading || "0");
    const wVal = parseFloat(writing || "0");
    const sVal = parseFloat(speaking || "0");

    const average = (lVal + rVal + wVal + sVal) / 4;
    // Round to nearest 0.5
    const overall = Math.round(average * 2) / 2;

    await db.testResult.create({
      data: {
        mockTestId,
        studentId,
        listeningScore: lVal,
        readingScore: rVal,
        writingScore: wVal,
        speakingScore: sVal,
        overallScore: overall,
        feedback: feedback || null,
      },
    });

    revalidatePath("/exams");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function getExamsMetadata() {
  await verifyAuth();

  const [batches, students] = await Promise.all([
    db.batch.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.student.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    batches: serializePrisma(batches),
    students: serializePrisma(students),
  };
}
