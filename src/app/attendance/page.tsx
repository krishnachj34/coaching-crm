import React from "react";
import { getDailyAttendance } from "./actions";
import AttendanceDashboardClient from "@/components/AttendanceDashboardClient";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const todayStr = new Date().toISOString().substring(0, 10);
  const records = await getDailyAttendance(todayStr);

  return (
    <AttendanceDashboardClient
      initialDate={todayStr}
      initialRecords={records}
    />
  );
}
