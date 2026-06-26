"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/utils/db";
import { serializePrisma } from "@/utils/serialize";
import { verifyAuth as centralVerifyAuth } from "@/utils/auth";

async function verifyAuth() {
  return await centralVerifyAuth("library");
}

export async function getLibraryBooks() {
  await verifyAuth();
  const books = await db.libraryBook.findMany({
    orderBy: { createdAt: "desc" },
  });
  return serializePrisma(books);
}

export async function createLibraryBook(formData: FormData) {
  await verifyAuth();

  const title = formData.get("title") as string;
  const author = formData.get("author") as string;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const pdfUrl = formData.get("pdfUrl") as string;
  const thumbnailUrl = formData.get("thumbnailUrl") as string;
  const accessType = formData.get("accessType") as string;
  const accessId = formData.get("accessId") as string;

  if (!title || !author || !category || !pdfUrl) {
    return { error: "Title, author, category, and PDF file URL are required." };
  }

  try {
    await db.libraryBook.create({
      data: {
        title,
        author,
        category,
        description: description || null,
        pdfUrl,
        thumbnailUrl: thumbnailUrl || null,
        accessType: accessType || "ALL",
        accessId: accessId || null,
      },
    });

    revalidatePath("/library");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function getLibraryNotes() {
  await verifyAuth();
  const notes = await db.libraryNote.findMany({
    include: {
      subject: true,
      batch: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return serializePrisma(notes);
}

export async function createLibraryNote(formData: FormData) {
  await verifyAuth();

  const title = formData.get("title") as string;
  const subjectId = formData.get("subjectId") as string;
  const topic = formData.get("topic") as string;
  const batchId = formData.get("batchId") as string;
  const fileUrl = formData.get("fileUrl") as string;

  if (!title || !subjectId || !topic || !batchId || !fileUrl) {
    return { error: "Title, subject, topic, batch, and study file URL are required." };
  }

  try {
    await db.libraryNote.create({
      data: {
        title,
        subjectId,
        topic,
        batchId,
        fileUrl,
        version: 1,
      },
    });

    revalidatePath("/library");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function getOldPapers() {
  await verifyAuth();
  const papers = await db.oldPaper.findMany({
    orderBy: { year: "desc" },
  });
  return serializePrisma(papers);
}

export async function createOldPaper(formData: FormData) {
  await verifyAuth();

  const title = formData.get("title") as string;
  const yearStr = formData.get("year") as string;
  const difficulty = formData.get("difficulty") as string;
  const timeLimitStr = formData.get("timeLimit") as string;
  const fileUrl = formData.get("fileUrl") as string;

  if (!title || !yearStr || !difficulty || !fileUrl) {
    return { error: "Title, year, difficulty level, and file URL are required." };
  }

  try {
    await db.oldPaper.create({
      data: {
        title,
        year: parseInt(yearStr),
        difficulty,
        timeLimit: timeLimitStr ? parseInt(timeLimitStr) : null,
        fileUrl,
      },
    });

    revalidatePath("/library");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function getLibraryMetadata() {
  await verifyAuth();

  const [subjects, batches] = await Promise.all([
    db.subject.findMany({ orderBy: { name: "asc" } }),
    db.batch.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return {
    subjects: serializePrisma(subjects),
    batches: serializePrisma(batches),
  };
}
