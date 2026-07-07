import { cookies } from "next/headers";
import { verifyAuth } from "./auth";

export interface BranchContext {
  branchId: string | null;       // The branch ID to filter database queries
  isGlobal: boolean;             // True if the user sees all branches
  role: string;                  // User role
  selectedBranchId: string;      // The actual cookie value (e.g. "ALL" or UUID)
}

/**
 * Resolves the current user's branch context based on their profile and cookies.
 */
export async function getBranchContext(): Promise<BranchContext> {
  const { profile } = await verifyAuth();

  // If the user is not an Admin or Super Admin, they are locked to their profile's branchId
  if (profile.role !== "ADMIN" && profile.role !== "SUPER_ADMIN") {
    return {
      branchId: profile.branchId || null,
      isGlobal: false,
      role: profile.role,
      selectedBranchId: profile.branchId || "NONE",
    };
  }

  // Admin and Super Admin can select a specific branch or view "ALL"
  const cookieStore = await cookies();
  const activeBranchId = cookieStore.get("active_branch_id")?.value || "ALL";

  return {
    branchId: activeBranchId === "ALL" ? null : activeBranchId,
    isGlobal: activeBranchId === "ALL",
    role: profile.role,
    selectedBranchId: activeBranchId,
  };
}

/**
 * Returns a Prisma filter object for the current branch.
 * Usage: `where: { ...await getBranchFilter(), ...otherFilters }`
 */
export async function getBranchFilter() {
  const context = await getBranchContext();
  if (context.isGlobal) {
    return {};
  }
  return { branchId: context.branchId };
}
