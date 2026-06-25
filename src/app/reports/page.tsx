import React from "react";
import { getReportsData } from "./actions";
import ReportsDashboardClient from "@/components/ReportsDashboardClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const data = await getReportsData();

  return <ReportsDashboardClient reportsData={data} />;
}
