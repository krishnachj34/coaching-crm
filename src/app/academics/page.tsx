import React from "react";
import AcademicsManagerClient from "@/components/AcademicsManagerClient";
import {
  getCategories,
  getSubCategories,
  getBatches,
  getNotices,
  getSubjects,
  getQuestions,
  getUpcomingEvents,
  getLiveClasses,
  getAcademicsMetadata,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AcademicsPage() {
  const [
    categories,
    subCategories,
    batches,
    notices,
    subjects,
    questions,
    events,
    liveClasses,
    metadata
  ] = await Promise.all([
    getCategories(),
    getSubCategories(),
    getBatches(),
    getNotices(),
    getSubjects(),
    getQuestions(),
    getUpcomingEvents(),
    getLiveClasses(),
    getAcademicsMetadata()
  ]);

  return (
    <AcademicsManagerClient
      categories={categories}
      subCategories={subCategories}
      batches={batches}
      notices={notices}
      subjects={subjects}
      questions={questions}
      events={events}
      liveClasses={liveClasses}
      metadata={metadata}
    />
  );
}
