import React from "react";
import { getLeadsWithWatiMeta } from "./actions";
import LeadsDashboardClient from "@/components/LeadsDashboardClient";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await getLeadsWithWatiMeta();

  return <LeadsDashboardClient initialLeads={leads} />;
}
