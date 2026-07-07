import React from "react";
import { getMetaSettings } from "./actions";
import LeadsSettingsClient from "@/components/LeadsSettingsClient";

export const dynamic = "force-dynamic";

export default async function LeadsSettingsPage() {
  let settings = null;
  let errorMsg = "";

  try {
    settings = await getMetaSettings();
  } catch (error: any) {
    errorMsg = error.message || "Failed to load integration settings.";
  }

  return (
    <LeadsSettingsClient 
      initialSettings={settings} 
      errorMsg={errorMsg}
    />
  );
}
