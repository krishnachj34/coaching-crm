import React from "react";
import UserManagerClient from "@/components/UserManagerClient";
import { getStaffProfiles } from "./actions";

export const dynamic = "force-dynamic";

export default async function UserManagerPage() {
  let profiles: any[] = [];
  let errorMsg = "";

  try {
    profiles = await getStaffProfiles();
  } catch (error: any) {
    errorMsg = error.message || "Failed to load profiles.";
  }

  return (
    <UserManagerClient 
      initialProfiles={profiles} 
      errorMsg={errorMsg}
    />
  );
}
