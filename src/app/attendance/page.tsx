import React from "react";
import { getDailyAttendance, getAttendanceMetadata } from "./actions";
import AttendanceDashboardClient from "@/components/AttendanceDashboardClient";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const todayStr = new Date().toISOString().substring(0, 10);
  const [records, batches] = await Promise.all([
    getDailyAttendance(todayStr),
    getAttendanceMetadata(),
  ]);

  return (
    <AttendanceDashboardClient
      initialDate={todayStr}
      initialRecords={records}
      batches={batches}
    />
  );
}
