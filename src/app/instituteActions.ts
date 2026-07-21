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
    // Study Abroad Wala starts with 0 data right now
    return {
      interest: { startsWith: "STUDY_ABROAD_EXPLICIT_" },
    };
  }

  return {};
}

export async function getStudentInstituteFilter() {
  const context = await getInstituteContext();

  if (context.activeInstituteId === "STUDY_ABROAD") {
    // Study Abroad Wala starts with 0 data right now
    return {
      installments: { startsWith: "STUDY_ABROAD_EXPLICIT_" },
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

    return {
      STUDY_ABROAD: {
        leadsCount: 0,
        studentsCount: 0,
        activeBatches: 0,
        countriesCount: 0,
      },
      FOREIGN_LANGUAGE: {
        leadsCount: totalLeads,
        studentsCount: totalStudents,
        activeBatches: 15,
        languagesCount: 6,
      },
    };
  } catch (e) {
    console.error("Error fetching institute stats:", e);
    return {
      STUDY_ABROAD: { leadsCount: 0, studentsCount: 0, activeBatches: 0, countriesCount: 0 },
      FOREIGN_LANGUAGE: { leadsCount: 42, studentsCount: 65, activeBatches: 15, languagesCount: 6 },
    };
  }
}
