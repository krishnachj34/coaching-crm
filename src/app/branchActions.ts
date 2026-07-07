"use server";

import { cookies } from "next/headers";
import { db } from "@/utils/db";
import { serializePrisma } from "@/utils/serialize";
import { getBranchContext, BranchContext } from "@/utils/branch";
import { revalidatePath } from "next/cache";

export async function getBranches() {
  const branches = await db.branch.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return serializePrisma(branches);
}

export async function setActiveBranch(branchId: string) {
  const cookieStore = await cookies();
  cookieStore.set("active_branch_id", branchId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
  });
  
  // Revalidate the entire application to apply the branch filter
  revalidatePath("/", "layout");
  return { success: true };
}

export async function getCurrentBranchContext(): Promise<BranchContext> {
  return await getBranchContext();
}
