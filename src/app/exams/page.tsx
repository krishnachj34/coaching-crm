import React from "react";
import ExamsManagerClient from "@/components/ExamsManagerClient";
import { getMockTests, getTestResults, getExamsMetadata } from "./actions";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const [tests, results, metadata] = await Promise.all([
    getMockTests(),
    getTestResults(),
    getExamsMetadata(),
  ]);

  return (
    <ExamsManagerClient
      tests={tests}
      results={results}
      metadata={metadata}
    />
  );
}
