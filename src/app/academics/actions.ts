"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/utils/db";
import { serializePrisma } from "@/utils/serialize";
import { verifyAuth as centralVerifyAuth } from "@/utils/auth";
import { logActivity } from "@/utils/activity";

async function verifyAuth() {
  return await centralVerifyAuth("academics");
}

// ── CATEGORY ACTIONS ──
export async function getCategories() {
  await verifyAuth();
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });
  return serializePrisma(categories);
}

export async function createCategory(formData: FormData) {
  await verifyAuth();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const icon = formData.get("icon") as string;
  const color = formData.get("color") as string;

  if (!name) return { error: "Category name is required." };

  try {
    await db.category.create({
      data: {
        name,
        description: description || null,
        icon: icon || null,
        color: color || null,
      },
    });
    revalidatePath("/academics");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

// ── SUB-CATEGORY ACTIONS ──
export async function getSubCategories() {
  await verifyAuth();
  const subCategories = await db.subCategory.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return serializePrisma(subCategories);
}

export async function createSubCategory(formData: FormData) {
  await verifyAuth();
  const name = formData.get("name") as string;
  const categoryId = formData.get("categoryId") as string;

  if (!name || !categoryId) return { error: "Name and Category are required." };

  try {
    await db.subCategory.create({
      data: {
        name,
        categoryId,
      },
    });
    revalidatePath("/academics");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

// ── SUBJECT ACTIONS ──
export async function getSubjects() {
  await verifyAuth();
  const subjects = await db.subject.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return serializePrisma(subjects);
}

export async function createSubject(formData: FormData) {
  await verifyAuth();
  const name = formData.get("name") as string;
  const categoryId = formData.get("categoryId") as string;

  if (!name || !categoryId) return { error: "Name and Category are required." };

  try {
    await db.subject.create({
      data: {
        name,
        categoryId,
      },
    });
    revalidatePath("/academics");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

// ── BATCH ACTIONS ──
export async function getBatches() {
  await verifyAuth();
  const batches = await db.batch.findMany({
    include: {
      subCategory: { include: { category: true } },
      teacher: true,
      enrollments: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return serializePrisma(batches);
}

export async function createBatch(formData: FormData) {
  const { profile } = await verifyAuth();
  const name = formData.get("name") as string;
  const subCategoryId = formData.get("subCategoryId") as string;
  const teacherId = formData.get("teacherId") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;
  const days = formData.get("days") as string;
  const timing = formData.get("timing") as string;
  const maxCapacityStr = formData.get("maxCapacity") as string;
  const feeAmountStr = formData.get("feeAmount") as string;

  if (!name || !subCategoryId || !teacherId || !startDateStr || !endDateStr || !days || !timing || !maxCapacityStr || !feeAmountStr) {
    return { error: "All batch fields are required." };
  }

  try {
    const batch = await db.batch.create({
      data: {
        name,
        subCategoryId,
        teacherId,
        startDate: new Date(startDateStr),
        endDate: new Date(endDateStr),
        days,
        timing,
        maxCapacity: parseInt(maxCapacityStr),
        feeAmount: parseFloat(feeAmountStr),
      },
    });

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "CREATED",
      module: "ACADEMICS",
      entityId: batch.id,
      description: `Created batch ${batch.name}`,
    });

    revalidatePath("/academics");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

// ── NOTICE ACTIONS ──
export async function getNotices() {
  await verifyAuth();
  const notices = await db.notice.findMany({
    orderBy: { createdAt: "desc" },
  });
  return serializePrisma(notices);
}

export async function createNotice(formData: FormData) {
  const { profile } = await verifyAuth();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const targetAudience = formData.get("targetAudience") as string;
  const targetId = formData.get("targetId") as string;
  const type = formData.get("type") as string;
  const scheduledAtStr = formData.get("scheduledAt") as string;

  if (!title || !content || !targetAudience || !type) {
    return { error: "Title, content, target, and notice type are required." };
  }

  try {
    const notice = await db.notice.create({
      data: {
        title,
        content,
        targetAudience,
        targetId: targetId || null,
        type,
        scheduledAt: scheduledAtStr ? new Date(scheduledAtStr) : new Date(),
      },
    });

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "CREATED",
      module: "ACADEMICS",
      entityId: notice.id,
      description: `Created notice: ${notice.title}`,
    });

    revalidatePath("/academics");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

// ── QUESTION ACTIONS ──
export async function getQuestions() {
  await verifyAuth();
  const questions = await db.question.findMany({
    include: { subject: true },
    orderBy: { createdAt: "desc" },
  });
  return serializePrisma(questions);
}

export async function createQuestion(formData: FormData) {
  await verifyAuth();
  const subjectId = formData.get("subjectId") as string;
  const topic = formData.get("topic") as string;
  const difficulty = formData.get("difficulty") as string;
  const type = formData.get("type") as string;
  const content = formData.get("content") as string;
  const answer = formData.get("answer") as string;
  const explanation = formData.get("explanation") as string;
  const bandRelevance = formData.get("bandRelevance") as string;

  if (!subjectId || !topic || !content || !answer) {
    return { error: "Subject, topic, content, and answer are required." };
  }

  try {
    await db.question.create({
      data: {
        subjectId,
        topic,
        difficulty,
        type,
        content,
        answer,
        explanation: explanation || null,
        bandRelevance: bandRelevance || null,
      },
    });
    revalidatePath("/academics");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

// ── UPCOMING EVENT ACTIONS ──
export async function getUpcomingEvents() {
  await verifyAuth();
  const events = await db.upcomingEvent.findMany({
    orderBy: { date: "asc" },
  });
  return serializePrisma(events);
}

export async function createUpcomingEvent(formData: FormData) {
  const { profile } = await verifyAuth();
  const title = formData.get("title") as string;
  const type = formData.get("type") as string;
  const dateStr = formData.get("date") as string;
  const time = formData.get("time") as string;
  const instructor = formData.get("instructor") as string;
  const platform = formData.get("platform") as string;
  const link = formData.get("link") as string;

  if (!title || !type || !dateStr || !time || !instructor) {
    return { error: "Title, type, date, time, and instructor are required." };
  }

  try {
    const event = await db.upcomingEvent.create({
      data: {
        title,
        type,
        date: new Date(dateStr),
        time,
        instructor,
        platform,
        link: link || null,
      },
    });

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "CREATED",
      module: "ACADEMICS",
      entityId: event.id,
      description: `Created upcoming event: ${event.title}`,
    });

    revalidatePath("/academics");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

// ── LIVE CLASS ACTIONS ──
export async function getLiveClasses() {
  await verifyAuth();
  const liveClasses = await db.liveClass.findMany({
    include: { batch: true },
    orderBy: { date: "asc" },
  });
  return serializePrisma(liveClasses);
}

export async function createLiveClass(formData: FormData) {
  const { profile } = await verifyAuth();
  const title = formData.get("title") as string;
  const meetingLink = formData.get("meetingLink") as string;
  const batchId = formData.get("batchId") as string;
  const dateStr = formData.get("date") as string;
  const time = formData.get("time") as string;
  const recordingLink = formData.get("recordingLink") as string;

  if (!title || !meetingLink || !batchId || !dateStr || !time) {
    return { error: "Title, meeting link, batch, date, and time are required." };
  }

  try {
    const liveClass = await db.liveClass.create({
      data: {
        title,
        meetingLink,
        batchId,
        date: new Date(dateStr),
        time,
        recordingLink: recordingLink || null,
      },
    });

    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "CREATED",
      module: "ACADEMICS",
      entityId: liveClass.id,
      description: `Created live class: ${liveClass.title}`,
    });

    revalidatePath("/academics");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

// Helper to fetch all metadata needed for the Academics forms in parallel
export async function getAcademicsMetadata() {
  await verifyAuth();
  
  const [categories, subCategories, teachers, subjects, batches] = await Promise.all([
    db.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.subCategory.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    db.teacher.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.subject.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    db.batch.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  return {
    categories: serializePrisma(categories),
    subCategories: serializePrisma(subCategories),
    teachers: serializePrisma(teachers),
    subjects: serializePrisma(subjects),
    batches: serializePrisma(batches),
  };
}

export async function deleteCategory(id: string) {
  const { profile } = await verifyAuth();
  try {
    const deleted = await db.category.delete({
      where: { id },
    });
    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "DELETED",
      module: "ACADEMICS",
      entityId: id,
      description: `Deleted course category ${deleted.name}`,
    });
    revalidatePath("/academics");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function deleteSubCategory(id: string) {
  const { profile } = await verifyAuth();
  try {
    const deleted = await db.subCategory.delete({
      where: { id },
    });
    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "DELETED",
      module: "ACADEMICS",
      entityId: id,
      description: `Deleted course level ${deleted.name}`,
    });
    revalidatePath("/academics");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function deleteBatch(id: string) {
  const { profile } = await verifyAuth();
  try {
    const deleted = await db.batch.delete({
      where: { id },
    });
    await logActivity({
      userId: profile.id,
      userName: profile.name || profile.email,
      userRole: profile.role,
      actionType: "DELETED",
      module: "ACADEMICS",
      entityId: id,
      description: `Deleted batch timing ${deleted.name}`,
    });
    revalidatePath("/academics");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}
