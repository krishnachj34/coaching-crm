import { cookies } from "next/headers";
import { verifyAuth } from "./auth";

export interface BranchContext {
  branchId: string | null;       
  isGlobal: boolean;             
  role: string;                  
  selectedBranchId: string;      
}

/**
 * Resolves the current user's context.
 */
export async function getBranchContext(): Promise<BranchContext> {
  let role = "STAFF";
  let branchId: string | null = null;
  try {
    const { profile } = await verifyAuth();
    role = profile.role;
    branchId = profile.branchId || null;
  } catch (e) {
    // Fallback if not authenticated
  }

  return {
    branchId,
    isGlobal: true, // Legacy branch filtering is disabled so staff members can access CRM data
    role,
    selectedBranchId: "ALL",
  };
}

/**
 * Legacy branch filter disabled in favor of Multi-Institute filtering.
 * Returns empty object so staff members are never blocked by missing branch IDs.
 */
export async function getBranchFilter() {
  return {};
}
