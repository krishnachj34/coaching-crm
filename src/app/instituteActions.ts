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
        { source: { contains: "STUDY_ABROAD", mode: "insensitive" as const } },
        { interest: { contains: "Abroad", mode: "insensitive" as const } },
        { interest: { contains: "Visa", mode: "insensitive" as const } },
      ],
    };
  }

  return {
    NOT: {
      OR: [
        { source: { contains: "STUDY_ABROAD", mode: "insensitive" as const } },
        { interest: { contains: "Abroad", mode: "insensitive" as const } },
        { interest: { contains: "Visa", mode: "insensitive" as const } },
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

export async function getPaymentInstituteFilter() {
  const studentFilter = await getStudentInstituteFilter();
  return {
    student: studentFilter,
  };
}

export async function getBatchInstituteFilter() {
  const context = await getInstituteContext();

  if (context.activeInstituteId === "STUDY_ABROAD") {
    return {
      subCategory: {
        category: {
          name: { contains: "Abroad", mode: "insensitive" as const },
        },
      },
    };
  }

  return {
    NOT: {
      subCategory: {
        category: {
          name: { contains: "Abroad", mode: "insensitive" as const },
        },
      },
    },
  };
}

export async function getCurrentInstituteContext() {
  return await getInstituteContext();
}

export async function getInstituteOverviewStats() {
  try {
    const leadFilterAbroad = {
      OR: [
        { source: { contains: "STUDY_ABROAD", mode: "insensitive" as const } },
        { interest: { contains: "Abroad", mode: "insensitive" as const } },
        { interest: { contains: "Visa", mode: "insensitive" as const } },
      ],
    };

    const leadFilterLanguage = {
      NOT: leadFilterAbroad,
    };

    const studyAbroadLeads = await db.lead.count({ where: leadFilterAbroad });
    const foreignLanguageLeads = await db.lead.count({ where: leadFilterLanguage });

    const studentFilterAbroad = {
      OR: [
        { installments: { contains: "STUDY_ABROAD", mode: "insensitive" as const } },
        { address: { contains: "Study Abroad", mode: "insensitive" as const } },
      ],
    };

    const studentFilterLanguage = {
      NOT: studentFilterAbroad,
    };

    const studyAbroadStudents = await db.student.count({ where: studentFilterAbroad });
    const foreignLanguageStudents = await db.student.count({ where: studentFilterLanguage });

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
