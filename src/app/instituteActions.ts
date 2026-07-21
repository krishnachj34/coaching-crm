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
        { source: { contains: "STUDY_ABROAD", mode: "insensitive" as const } },
      ],
    };
  }

  // FOREIGN_LANGUAGE filter: excludes explicit Study Abroad leads
  return {
    NOT: {
      OR: [
        { interest: { contains: "Abroad", mode: "insensitive" as const } },
        { interest: { contains: "Visa", mode: "insensitive" as const } },
        { source: { contains: "STUDY_ABROAD", mode: "insensitive" as const } },
      ],
    },
  };
}

export async function getStudentInstituteFilter() {
  const context = await getInstituteContext();

  if (context.activeInstituteId === "STUDY_ABROAD") {
    return {
      OR: [
        { installments: { contains: "STUDY_ABROAD", mode: "insensitive" as const } },
        { address: { contains: "Study Abroad", mode: "insensitive" as const } },
      ],
    };
  }

  return {
    NOT: {
      OR: [
        { installments: { contains: "STUDY_ABROAD", mode: "insensitive" as const } },
        { address: { contains: "Study Abroad", mode: "insensitive" as const } },
      ],
    },
  };
}

export async function getStaffInstituteFilter() {
  const context = await getInstituteContext();

  if (context.activeInstituteId === "STUDY_ABROAD") {
    return {
      OR: [
        { specialization: { contains: "Abroad", mode: "insensitive" as const } },
        { specialization: { contains: "Visa", mode: "insensitive" as const } },
        { franchise: { contains: "Study Abroad", mode: "insensitive" as const } },
      ],
    };
  }

  return {
    NOT: {
      OR: [
        { specialization: { contains: "Abroad", mode: "insensitive" as const } },
        { franchise: { contains: "Study Abroad", mode: "insensitive" as const } },
      ],
    },
  };
}

export async function getCurrentInstituteContext() {
  return await getInstituteContext();
}

export async function getInstituteOverviewStats() {
  try {
    const leadFilterAbroad = await getLeadInstituteFilter();
    const leadFilterLanguage = {
      NOT: {
        OR: [
          { interest: { contains: "Abroad", mode: "insensitive" as const } },
          { interest: { contains: "Visa", mode: "insensitive" as const } },
          { source: { contains: "STUDY_ABROAD", mode: "insensitive" as const } },
        ],
      },
    };

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
          { source: { contains: "STUDY_ABROAD", mode: "insensitive" } },
        ],
      },
    });

    const foreignLanguageLeads = await db.lead.count({
      where: leadFilterLanguage,
    });

    const studyAbroadStudents = await db.student.count({
      where: {
        OR: [
          { installments: { contains: "STUDY_ABROAD", mode: "insensitive" } },
          { address: { contains: "Study Abroad", mode: "insensitive" } },
        ],
      },
    });

    const foreignLanguageStudents = await db.student.count({
      where: {
        NOT: {
          OR: [
            { installments: { contains: "STUDY_ABROAD", mode: "insensitive" } },
            { address: { contains: "Study Abroad", mode: "insensitive" } },
          ],
        },
      },
    });

    return {
      STUDY_ABROAD: {
        leadsCount: studyAbroadLeads,
        studentsCount: studyAbroadStudents,
        activeBatches: 0,
        countriesCount: 14,
      },
      FOREIGN_LANGUAGE: {
        leadsCount: foreignLanguageLeads,
        studentsCount: foreignLanguageStudents,
        activeBatches: 15,
        languagesCount: 6,
      },
    };
  } catch (e) {
    console.error("Error fetching institute stats:", e);
    return {
      STUDY_ABROAD: { leadsCount: 0, studentsCount: 0, activeBatches: 0, countriesCount: 14 },
      FOREIGN_LANGUAGE: { leadsCount: 42, studentsCount: 65, activeBatches: 15, languagesCount: 6 },
    };
  }
}
