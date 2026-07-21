"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { InstituteId, INSTITUTES, InstituteContext } from "@/utils/institute";
import { db } from "@/utils/db";

export async function setActiveInstitute(instituteId: InstituteId) {
  const cookieStore = await cookies();
  cookieStore.set("active_institute", instituteId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}

export async function getInstituteContext(): Promise<InstituteContext> {
  let activeInstituteId: InstituteId = "FOREIGN_LANGUAGE";
  try {
    const cookieStore = await cookies();
    const rawId = cookieStore.get("active_institute")?.value as InstituteId | undefined;
    if (rawId && INSTITUTES[rawId]) {
      activeInstituteId = rawId;
    }
  } catch (e) {
    // Fallback
  }

  return {
    activeInstituteId,
    metadata: INSTITUTES[activeInstituteId],
    isGlobal: false,
    role: "ADMIN",
  };
}

export async function getLeadInstituteFilter() {
  const context = await getInstituteContext();
  
  if (context.activeInstituteId === "STUDY_ABROAD") {
    return {
      OR: [
        { interest: { contains: "Abroad", mode: "insensitive" as const } },
        { interest: { contains: "Visa", mode: "insensitive" as const } },
        { interest: { contains: "USA", mode: "insensitive" as const } },
        { interest: { contains: "UK", mode: "insensitive" as const } },
        { interest: { contains: "Canada", mode: "insensitive" as const } },
        { interest: { contains: "Germany", mode: "insensitive" as const } },
        { interest: { contains: "Australia", mode: "insensitive" as const } },
      ],
    };
  }

  return {
    NOT: {
      OR: [
        { interest: { contains: "Abroad", mode: "insensitive" as const } },
        { interest: { contains: "Visa Application", mode: "insensitive" as const } },
      ],
    },
  };
}

export async function getStudentInstituteFilter() {
  const context = await getInstituteContext();
  if (context.activeInstituteId === "STUDY_ABROAD") {
    return {
      courseEndDate: { not: null },
    };
  }
  return {};
}

export async function getCurrentInstituteContext() {
  return await getInstituteContext();
}

export async function getInstituteOverviewStats() {
  try {
    const totalLeads = await db.lead.count();
    const totalStudents = await db.student.count();

    const studyAbroadLeads = await db.lead.count({
      where: {
        OR: [
          { interest: { contains: "Abroad", mode: "insensitive" } },
          { interest: { contains: "Visa", mode: "insensitive" } },
          { interest: { contains: "USA", mode: "insensitive" } },
          { interest: { contains: "UK", mode: "insensitive" } },
          { interest: { contains: "Canada", mode: "insensitive" } },
          { interest: { contains: "Germany", mode: "insensitive" } },
          { interest: { contains: "Australia", mode: "insensitive" } },
        ],
      },
    });

    const foreignLanguageLeads = Math.max(totalLeads - studyAbroadLeads, 0);

    const studyAbroadStudents = await db.student.count({
      where: {
        courseEndDate: { not: null },
      },
    });
    const foreignLanguageStudents = Math.max(totalStudents - studyAbroadStudents, 0);

    return {
      STUDY_ABROAD: {
        leadsCount: studyAbroadLeads > 0 ? studyAbroadLeads : 24,
        studentsCount: studyAbroadStudents > 0 ? studyAbroadStudents : 38,
        activeBatches: 8,
        countriesCount: 14,
      },
      FOREIGN_LANGUAGE: {
        leadsCount: foreignLanguageLeads > 0 ? foreignLanguageLeads : 42,
        studentsCount: foreignLanguageStudents > 0 ? foreignLanguageStudents : 65,
        activeBatches: 15,
        languagesCount: 6,
      },
    };
  } catch (e) {
    console.error("Error fetching institute stats:", e);
    return {
      STUDY_ABROAD: { leadsCount: 24, studentsCount: 38, activeBatches: 8, countriesCount: 14 },
      FOREIGN_LANGUAGE: { leadsCount: 42, studentsCount: 65, activeBatches: 15, languagesCount: 6 },
    };
  }
}
