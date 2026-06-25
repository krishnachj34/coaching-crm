import React from "react";
import { getLeads } from "./actions";
import LeadsDashboardClient from "@/components/LeadsDashboardClient";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await getLeads();

  return <LeadsDashboardClient initialLeads={leads} />;
}
