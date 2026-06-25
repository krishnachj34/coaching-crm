import React from "react";
import { getStudents, getCourses } from "./actions";
import StudentsDashboardClient from "@/components/StudentsDashboardClient";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const students = await getStudents();
  const courses = await getCourses();

  return <StudentsDashboardClient initialStudents={students} courses={courses} />;
}
