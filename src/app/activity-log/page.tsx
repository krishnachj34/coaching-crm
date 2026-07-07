import React from "react";
import { getActivityLogs } from "./actions";
import ActivityLogClient from "@/components/ActivityLogClient";

export const dynamic = "force-dynamic";

export default async function ActivityLogPage() {
  let logs: any[] = [];
  let errorMsg = "";

  try {
    logs = await getActivityLogs();
  } catch (error: any) {
    errorMsg = error.message || "Failed to load activity logs.";
  }

  return (
    <ActivityLogClient 
      initialLogs={logs} 
      errorMsg={errorMsg}
    />
  );
}
