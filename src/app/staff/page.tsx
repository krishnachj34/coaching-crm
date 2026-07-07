import React from "react";
import StaffManagerClient from "@/components/StaffManagerClient";
import { getStaffMembers, getTeacherLeaves } from "./actions";
import { db } from "@/utils/db";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  let members: any[] = [];
  let leaves: any[] = [];
  let branches: any[] = [];
  let errorMsg = "";

  try {
    const [fetchedMembers, fetchedLeaves, fetchedBranches] = await Promise.all([
      getStaffMembers(),
      getTeacherLeaves(),
      db.branch.findMany({
        where: { active: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" }
      })
    ]);
    members = fetchedMembers;
    leaves = fetchedLeaves;
    branches = fetchedBranches;
  } catch (error: any) {
    errorMsg = error.message || "Failed to load staff management details.";
  }

  return (
    <StaffManagerClient 
      initialMembers={members} 
      initialLeaves={leaves}
      branches={branches}
      errorMsg={errorMsg}
    />
  );
}
