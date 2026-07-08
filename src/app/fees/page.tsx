import React from "react";
import { getPayments, getPaymentStats } from "./actions";
import { getStudents } from "@/app/students/actions";
import FeesDashboardClient from "@/components/FeesDashboardClient";

export const dynamic = "force-dynamic";

export default async function FeesPage() {
  const payments = await getPayments();
  const stats = await getPaymentStats();
  
  // Load enrolled students so we can populate the dropdown for logging payments
  const students = await getStudents();
  const simpleStudents = (students as any[]).map((s: any) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <FeesDashboardClient
      initialPayments={payments}
      studentsList={simpleStudents}
      detailedStudentsList={students}
      stats={stats}
    />
  );
}
