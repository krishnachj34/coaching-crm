import React from "react";
import { getStudents, getActiveBatches } from "./actions";
import StudentsDashboardClient from "@/components/StudentsDashboardClient";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const students = await getStudents();
  const batches = await getActiveBatches();

  return <StudentsDashboardClient initialStudents={students} batches={batches} />;
}
