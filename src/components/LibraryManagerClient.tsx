"use client";

import React, { useState, useTransition } from "react";
import Sidebar from "@/components/Sidebar";
import styles from "@/app/library/page.module.css";
import modalStyles from "@/app/students/page.module.css"; // Reuse modal styles
import { useRouter } from "next/navigation";
import { createLibraryBook, createLibraryNote, createOldPaper } from "@/app/library/actions";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string | null;
  pdfUrl: string;
  thumbnailUrl: string | null;
  accessType: string;
  accessId: string | null;
  createdAt: Date;
}

interface Note {
  id: string;
  title: string;
  subjectId: string;
  topic: string;
  batchId: string;
  fileUrl: string;
  version: number;
  createdAt: Date;
  subject?: {
    name: string;
  };
  batch?: {
    name: string;
  };
}

interface Paper {
  id: string;
  title: string;
  year: number;
  difficulty: string;
  timeLimit: number | null;
  fileUrl: string;
  createdAt: Date;
}

interface LibraryManagerClientProps {
  books: Book[];
  notes: Note[];
  papers: Paper[];
  metadata: {
    subjects: any[];
    batches: any[];
  };
}

export default function LibraryManagerClient({
  books,
  notes,
  papers,
  metadata,
}: LibraryManagerClientProps) {
  const [activeTab, setActiveTab] = useState("books");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Form states - Books
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookCat, setBookCat] = useState("IELTS Preparation");
  const [bookDesc, setBookDesc] = useState("");
  const [bookPdf, setBookPdf] = useState("");
  const [bookThumb, setBookThumb] = useState("");
  const [bookAccess, setBookAccess] = useState("ALL");
  const [bookAccessId, setBookAccessId] = useState("");

  // Form states - Notes
  const [noteTitle, setNoteTitle] = useState("");
  const [noteSubjectId, setNoteSubjectId] = useState("");
  const [noteTopic, setNoteTopic] = useState("");
  const [noteBatchId, setNoteBatchId] = useState("");
  const [noteFile, setNoteFile] = useState("");

  // Form states - Papers
  const [paperTitle, setPaperTitle] = useState("");
  const [paperYear, setPaperYear] = useState("2025");
  const [paperDiff, setPaperDiff] = useState("MEDIUM");
  const [paperTime, setPaperTime] = useState("60");
  const [paperFile, setPaperFile] = useState("");

  const openAddModal = () => {
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      let res: any = { error: "Unknown action" };
      const formData = new FormData();

      if (activeTab === "books") {
        formData.append("title", bookTitle);
        formData.append("author", bookAuthor);
        formData.append("category", bookCat);
        formData.append("description", bookDesc);
        formData.append("pdfUrl", bookPdf);
        formData.append("thumbnailUrl", bookThumb);
        formData.append("accessType", bookAccess);
        formData.append("accessId", bookAccessId);
        res = await createLibraryBook(formData);
      } else if (activeTab === "notes") {
        formData.append("title", noteTitle);
        formData.append("subjectId", noteSubjectId);
        formData.append("topic", noteTopic);
        formData.append("batchId", noteBatchId);
        formData.append("fileUrl", noteFile);
        res = await createLibraryNote(formData);
      } else if (activeTab === "papers") {
        formData.append("title", paperTitle);
        formData.append("year", paperYear);
        formData.append("difficulty", paperDiff);
        formData.append("timeLimit", paperTime);
        formData.append("fileUrl", paperFile);
        res = await createOldPaper(formData);
      }

      if (res.error) {
        setFormError(res.error);
      } else {
        setIsAddOpen(false);
        // Reset states
        setBookTitle(""); setBookAuthor(""); setBookDesc(""); setBookPdf(""); setBookThumb("");
        setNoteTitle(""); setNoteSubjectId(""); setNoteTopic(""); setNoteBatchId(""); setNoteFile("");
        setPaperTitle(""); setPaperYear("2025"); setPaperTime("60"); setPaperFile("");
        router.refresh();
      }
    });
  };

  return (
    <div className={styles.container}>
      <Sidebar currentPhase={6} />

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1>Library Manager</h1>
            <p>Upload digital study guidelines, subject summaries, and practice test books.</p>
          </div>
          <button onClick={openAddModal} className={styles.addBtn}>
            + Add Resource
          </button>
        </header>

        {/* Library Sub-navigation */}
        <div className={styles.tabs}>
          <button onClick={() => setActiveTab("books")} className={`${styles.tabBtn} ${activeTab === "books" ? styles.tabBtnActive : ""}`}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.15rem" }}>library_books</span>
            Digital Books
          </button>
          <button onClick={() => setActiveTab("notes")} className={`${styles.tabBtn} ${activeTab === "notes" ? styles.tabBtnActive : ""}`}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.15rem" }}>description</span>
            Study Notes
          </button>
          <button onClick={() => setActiveTab("papers")} className={`${styles.tabBtn} ${activeTab === "papers" ? styles.tabBtnActive : ""}`}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.15rem" }}>history_edu</span>
            Previous Papers
          </button>
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "books" && (
            <div className={styles.bookGrid}>
              {books.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No books uploaded yet.</p>
              ) : (
                books.map((book) => (
                  <div key={book.id} className={styles.bookCard}>
                    {book.thumbnailUrl ? (
                      <img src={book.thumbnailUrl} alt={book.title} className={styles.coverImage} />
                    ) : (
                      <div className={styles.coverPlaceholder}>
                        <span className="material-symbols-outlined" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>auto_stories</span>
                        {book.title}
                      </div>
                    )}
                    <div className={styles.bookMeta}>
                      <span className={styles.bookCategory}>{book.category}</span>
                      <h3>{book.title}</h3>
                      <span>By {book.author}</span>
                    </div>
                    <a href={book.pdfUrl} target="_blank" rel="noreferrer" className={styles.downloadLink}>
                      <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>download</span>
                      Download PDF
                    </a>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className={styles.notesTableWrapper}>
              <table className={styles.notesTable}>
                <thead>
                  <tr>
                    <th>Note Title</th>
                    <th>Subject</th>
                    <th>Topic</th>
                    <th>Batch Access</th>
                    <th>Version</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "1.5rem" }}>
                        No teacher study notes uploaded.
                      </td>
                    </tr>
                  ) : (
                    notes.map((note) => (
                      <tr key={note.id}>
                        <td style={{ fontWeight: "700" }}>{note.title}</td>
                        <td>{note.subject?.name}</td>
                        <td>{note.topic}</td>
                        <td>{note.batch?.name || "All Students"}</td>
                        <td>v{note.version}</td>
                        <td>
                          <a href={note.fileUrl} target="_blank" rel="noreferrer" className={styles.downloadLink} style={{ padding: "0.3rem 0.6rem" }}>
                            View Notes
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "papers" && (
            <div className={styles.notesTableWrapper}>
              <table className={styles.notesTable}>
                <thead>
                  <tr>
                    <th>Paper Title</th>
                    <th>Year</th>
                    <th>Difficulty</th>
                    <th>Countdown Timer</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {papers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "1.5rem" }}>
                        No old practice papers uploaded.
                      </td>
                    </tr>
                  ) : (
                    papers.map((paper) => (
                      <tr key={paper.id}>
                        <td style={{ fontWeight: "700" }}>{paper.title}</td>
                        <td>{paper.year}</td>
                        <td>
                          <span className={`${styles.badge} ${styles["badge" + paper.difficulty]}`}>
                            {paper.difficulty}
                          </span>
                        </td>
                        <td>⏰ {paper.timeLimit ? `${paper.timeLimit} mins` : "Untimed"}</td>
                        <td>
                          <a href={paper.fileUrl} target="_blank" rel="noreferrer" className={styles.downloadLink} style={{ padding: "0.3rem 0.6rem" }}>
                            Download Paper
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL: ADD RESOURCE */}
        {isAddOpen && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContent}>
              <div className={modalStyles.modalHeader}>
                <h3>Add Library Resource</h3>
                <button onClick={() => setIsAddOpen(false)} className={modalStyles.closeModalButton}>✕</button>
              </div>

              {formError && <div className={modalStyles.errorAlert}>{formError}</div>}

              <form onSubmit={handleAddSubmit} className={modalStyles.form}>
                {activeTab === "books" && (
                  <>
                    <div className={modalStyles.formGroup}>
                      <label>Book Title *</label>
                      <input type="text" required value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} placeholder="e.g. Cambridge IELTS 19 Academic" className={modalStyles.modalInput} />
                    </div>
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Author *</label>
                        <input type="text" required value={bookAuthor} onChange={(e) => setBookAuthor(e.target.value)} placeholder="e.g. Cambridge University" className={modalStyles.modalInput} />
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Book Category *</label>
                        <input type="text" required value={bookCat} onChange={(e) => setBookCat(e.target.value)} placeholder="e.g. Grammar Prep" className={modalStyles.modalInput} />
                      </div>
                    </div>
                    <div className={modalStyles.formGroup}>
                      <label>PDF File Link URL *</label>
                      <input type="url" required value={bookPdf} onChange={(e) => setBookPdf(e.target.value)} placeholder="https://example.com/books/grammar.pdf" className={modalStyles.modalInput} />
                    </div>
                    <div className={modalStyles.formGroup}>
                      <label>Thumbnail Cover Image URL</label>
                      <input type="url" value={bookThumb} onChange={(e) => setBookThumb(e.target.value)} placeholder="https://example.com/books/cover.jpg" className={modalStyles.modalInput} />
                    </div>
                    <div className={modalStyles.formGroup}>
                      <label>Brief Description</label>
                      <textarea value={bookDesc} onChange={(e) => setBookDesc(e.target.value)} className={modalStyles.modalTextarea} />
                    </div>
                  </>
                )}

                {activeTab === "notes" && (
                  <>
                    <div className={modalStyles.formGroup}>
                      <label>Note Title *</label>
                      <input type="text" required value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="e.g. Advanced Speaking Cue Cards" className={modalStyles.modalInput} />
                    </div>
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Subject Link *</label>
                        <select required value={noteSubjectId} onChange={(e) => setNoteSubjectId(e.target.value)} className={modalStyles.modalSelect}>
                          <option value="">Choose Subject...</option>
                          {metadata.subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Topic *</label>
                        <input type="text" required value={noteTopic} onChange={(e) => setNoteTopic(e.target.value)} placeholder="e.g. IELTS Vocabulary" className={modalStyles.modalInput} />
                      </div>
                    </div>
                    <div className={modalStyles.formGroup}>
                      <label>Target Batch Access *</label>
                      <select required value={noteBatchId} onChange={(e) => setNoteBatchId(e.target.value)} className={modalStyles.modalSelect}>
                        <option value="">Select Batch...</option>
                        {metadata.batches.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className={modalStyles.formGroup}>
                      <label>Study Notes File URL *</label>
                      <input type="url" required value={noteFile} onChange={(e) => setNoteFile(e.target.value)} placeholder="https://example.com/notes.pdf" className={modalStyles.modalInput} />
                    </div>
                  </>
                )}

                {activeTab === "papers" && (
                  <>
                    <div className={modalStyles.formGroup}>
                      <label>Paper Title *</label>
                      <input type="text" required value={paperTitle} onChange={(e) => setPaperTitle(e.target.value)} placeholder="e.g. IELTS Writing Actual Test March 2025" className={modalStyles.modalInput} />
                    </div>
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Exam Year *</label>
                        <input type="number" required value={paperYear} onChange={(e) => setPaperYear(e.target.value)} className={modalStyles.modalInput} />
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Difficulty *</label>
                        <select required value={paperDiff} onChange={(e) => setPaperDiff(e.target.value)} className={modalStyles.modalSelect}>
                          <option value="EASY">EASY</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HARD">HARD</option>
                        </select>
                      </div>
                    </div>
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Countdown Timer Limit (Minutes)</label>
                        <input type="number" value={paperTime} onChange={(e) => setPaperTime(e.target.value)} placeholder="e.g. 60" className={modalStyles.modalInput} />
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>File URL *</label>
                        <input type="url" required value={paperFile} onChange={(e) => setPaperFile(e.target.value)} placeholder="https://example.com/papers/paper-1.pdf" className={modalStyles.modalInput} />
                      </div>
                    </div>
                  </>
                )}

                <div className={modalStyles.modalFooter}>
                  <button type="button" onClick={() => setIsAddOpen(false)} className={modalStyles.cancelButton} disabled={isPending}>
                    Cancel
                  </button>
                  <button type="submit" className={modalStyles.submitButton} disabled={isPending}>
                    {isPending ? "Adding..." : "Add Resource"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
