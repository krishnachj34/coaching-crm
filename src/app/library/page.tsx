import React from "react";
import LibraryManagerClient from "@/components/LibraryManagerClient";
import { getLibraryBooks, getLibraryNotes, getOldPapers, getLibraryMetadata } from "./actions";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const [books, notes, papers, metadata] = await Promise.all([
    getLibraryBooks(),
    getLibraryNotes(),
    getOldPapers(),
    getLibraryMetadata(),
  ]);

  return (
    <LibraryManagerClient
      books={books}
      notes={notes}
      papers={papers}
      metadata={metadata}
    />
  );
}
