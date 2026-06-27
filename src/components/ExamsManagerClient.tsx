"use client";

import React, { useState, useTransition } from "react";
import Sidebar from "@/components/Sidebar";
import styles from "@/app/exams/page.module.css";
import modalStyles from "@/app/students/page.module.css"; // Reuse modal styles
import { useRouter } from "next/navigation";
import { createMockTest, createTestResult } from "@/app/exams/actions";

interface TestResultObj {
  id: string;
  mockTestId: string;
  studentId: string;
  listeningScore: any;
  readingScore: any;
  writingScore: any;
  speakingScore: any;
  overallScore: any;
  feedback: string | null;
  submittedAt: Date;
  student: {
    name: string;
  };
  mockTest?: {
    title: string;
    batch?: {
      name: string;
    };
  };
}

interface MockTest {
  id: string;
  title: string;
  duration: number;
  totalMarks: number;
  passMarks: number;
  batchId: string;
  googleFormLink: string | null;
  googleFormId: string | null;
  createdAt: Date;
  batch: {
    name: string;
  };
  results: TestResultObj[];
}

interface ExamsManagerClientProps {
  tests: MockTest[];
  results: TestResultObj[];
  metadata: {
    batches: any[];
    students: any[];
  };
}

export default function ExamsManagerClient({ tests, results, metadata }: ExamsManagerClientProps) {
  const [activeTab, setActiveTab] = useState("tests");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isScoreOpen, setIsScoreOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Form states - Mock Test
  const [testTitle, setTestTitle] = useState("");
  const [testDuration, setTestDuration] = useState("120");
  const [testTotal, setTestTotal] = useState("40");
  const [testPass, setTestPass] = useState("20");
  const [testBatchId, setTestBatchId] = useState("");
  const [testFormLink, setTestFormLink] = useState("");
  const [testFormId, setTestFormId] = useState("");

  // Form states - Test Result Score
  const [scoreTestId, setScoreTestId] = useState("");
  const [scoreStudentId, setScoreStudentId] = useState("");
  const [scoreListening, setScoreListening] = useState("6.5");
  const [scoreReading, setScoreReading] = useState("7.0");
  const [scoreWriting, setScoreWriting] = useState("6.0");
  const [scoreSpeaking, setScoreSpeaking] = useState("7.0");
  const [scoreFeedback, setScoreFeedback] = useState("");

  const handleAddMockTest = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!testTitle || !testBatchId) {
      setFormError("Title and Target Batch are required.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", testTitle);
      formData.append("duration", testDuration);
      formData.append("totalMarks", testTotal);
      formData.append("passMarks", testPass);
      formData.append("batchId", testBatchId);
      formData.append("googleFormLink", testFormLink);
      formData.append("googleFormId", testFormId);

      const res = await createMockTest(formData);
      if (res.error) {
        setFormError(res.error);
      } else {
        setIsAddOpen(false);
        setTestTitle(""); setTestFormLink(""); setTestFormId("");
        router.refresh();
      }
    });
  };

  const handleEnterScore = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!scoreTestId || !scoreStudentId) {
      setFormError("Test and Student fields are required.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("mockTestId", scoreTestId);
      formData.append("studentId", scoreStudentId);
      formData.append("listeningScore", scoreListening);
      formData.append("readingScore", scoreReading);
      formData.append("writingScore", scoreWriting);
      formData.append("speakingScore", scoreSpeaking);
      formData.append("feedback", scoreFeedback);

      const res = await createTestResult(formData);
      if (res.error) {
        setFormError(res.error);
      } else {
        setIsScoreOpen(false);
        setScoreTestId(""); setScoreStudentId(""); setScoreFeedback("");
        router.refresh();
      }
    });
  };

  // Compute test averages for the trend visualization
  const validTests = tests
    .map((t) => {
      const testResults = t.results || [];
      const sum = testResults.reduce((acc, r) => acc + Number(r.overallScore || 0), 0);
      const avg = testResults.length > 0 ? sum / testResults.length : 0;
      return { title: t.title, average: Math.round(avg * 10) / 10 };
    })
    .filter((t) => t.average > 0)
    .slice(0, 5)
    .reverse();

  // SVG Drawing Helpers
  const width = 600;
  const height = 150;
  const padding = 30;

  const points = validTests.map((t, idx) => {
    const x = padding + (idx * (width - padding * 2)) / Math.max(1, validTests.length - 1);
    // Map band score (0 to 9) to height
    const y = height - padding - (t.average / 9) * (height - padding * 2);
    return { x, y, label: `${t.average} Band` };
  });

  const svgPath = points.reduce((path, p, idx) => {
    return path + (idx === 0 ? `M${p.x},${p.y}` : ` L${p.x},${p.y}`);
  }, "");

  return (
    <div className={styles.container}>
      <Sidebar currentPhase={7} />

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1>Exam Manager</h1>
            <p>Onboard mock tests, assign Google Forms links, and track IELTS band progression scores.</p>
          </div>
          <div className={styles.headerActions}>
            <button onClick={() => setIsScoreOpen(true)} className={modalStyles.cancelButton} style={{ borderColor: "var(--outline)" }}>
              Enter Scores
            </button>
            <button onClick={() => setIsAddOpen(true)} className={styles.addBtn}>
              + Create Mock Test
            </button>
          </div>
        </header>

        {/* Exam Sub-navigation tabs */}
        <div className={styles.tabs}>
          <button onClick={() => setActiveTab("tests")} className={`${styles.tabBtn} ${activeTab === "tests" ? styles.tabBtnActive : ""}`}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.15rem" }}>note_alt</span>
            Mock Tests
          </button>
          <button onClick={() => setActiveTab("results")} className={`${styles.tabBtn} ${activeTab === "results" ? styles.tabBtnActive : ""}`}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.15rem" }}>assignment_turned_in</span>
            Test Results
          </button>
          <button onClick={() => setActiveTab("analytics")} className={`${styles.tabBtn} ${activeTab === "analytics" ? styles.tabBtnActive : ""}`}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.15rem" }}>insights</span>
            Performance Analytics
          </button>
        </div>

        {/* Tab contents */}
        <div>
          {activeTab === "tests" && (
            <div className={styles.testGrid}>
              {tests.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No mock tests configured yet.</p>
              ) : (
                tests.map((test) => (
                  <div key={test.id} className={styles.testCard}>
                    <div className={styles.testHeader}>
                      <h3>{test.title}</h3>
                      <span>{test.batch?.name}</span>
                    </div>

                    <div className={styles.testDetails}>
                      <div>
                        <span>⏰ Duration</span>
                        <strong>{test.duration} Minutes</strong>
                      </div>
                      <div>
                        <span>🎯 Marks Schema</span>
                        <strong>{test.passMarks} / {test.totalMarks} Pass</strong>
                      </div>
                      <div>
                        <span>📊 Submissions</span>
                        <strong>{test.results?.length || 0} Graded</strong>
                      </div>
                    </div>

                    {test.googleFormLink ? (
                      <a href={test.googleFormLink} target="_blank" rel="noreferrer" className={styles.formLink}>
                        <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>link</span>
                        Attempt Google Form
                      </a>
                    ) : (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", padding: "0.5rem" }}>
                        Offline Mock Test Paper
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "results" && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Mock Test</th>
                    <th>Target Batch</th>
                    <th>Listening</th>
                    <th>Reading</th>
                    <th>Writing</th>
                    <th>Speaking</th>
                    <th>Overall Band</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "1.5rem" }}>
                        No test results graded yet.
                      </td>
                    </tr>
                  ) : (
                    results.map((res) => (
                      <tr key={res.id}>
                        <td style={{ fontWeight: "700" }}>{res.student?.name}</td>
                        <td>{res.mockTest?.title}</td>
                        <td>{res.mockTest?.batch?.name}</td>
                        <td>{Number(res.listeningScore).toFixed(1)}</td>
                        <td>{Number(res.readingScore).toFixed(1)}</td>
                        <td>{Number(res.writingScore).toFixed(1)}</td>
                        <td>{Number(res.speakingScore).toFixed(1)}</td>
                        <td>
                          <span className={styles.scoreBadge}>
                            {Number(res.overallScore).toFixed(1)} Band
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className={styles.analyticsGrid}>
              {/* Left Column: Line Chart */}
              <div className={styles.chartCard}>
                <h3>IELTS Overall Band Average Trend (Mock Tests)</h3>
                
                {validTests.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                    Not enough graded test results to draw trend chart.
                  </p>
                ) : (
                  <div className={styles.svgWrapper}>
                    <svg className={styles.svgChart} viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
                      {/* Grid Lines */}
                      <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--outline-variant)" strokeDasharray="2" />
                      <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="var(--outline-variant)" strokeDasharray="2" />
                      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--outline-variant)" />

                      {/* Main Trend Line */}
                      <path d={svgPath} fill="none" stroke="var(--primary)" strokeWidth="3" />

                      {/* Points */}
                      {points.map((p, idx) => (
                        <g key={idx}>
                          <circle cx={p.x} cy={p.y} r="5" fill="var(--primary)" stroke="#ffffff" strokeWidth="2" />
                          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--primary)">
                            {p.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                    
                    <div className={styles.xAxisLabels}>
                      {validTests.map((t, idx) => (
                        <span key={idx} style={{ maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Analytics Sidebar */}
              <div className={styles.chartCard} style={{ gap: "1rem" }}>
                <h3>Institute Level Statistics</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ background: "var(--surface-container-low)", padding: "1rem", borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Total Mock Tests</span>
                    <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--foreground)", margin: "0.25rem 0" }}>{tests.length}</h2>
                  </div>
                  <div style={{ background: "var(--surface-container-low)", padding: "1rem", borderRadius: "var(--radius)" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Student Submissions</span>
                    <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--foreground)", margin: "0.25rem 0" }}>{results.length}</h2>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL: CREATE MOCK TEST */}
        {isAddOpen && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContent}>
              <div className={modalStyles.modalHeader}>
                <h3>Create Mock Test</h3>
                <button onClick={() => setIsAddOpen(false)} className={modalStyles.closeModalButton}>✕</button>
              </div>

              {formError && <div className={modalStyles.errorAlert}>{formError}</div>}

              <form onSubmit={handleAddMockTest} className={modalStyles.form}>
                <div className={modalStyles.formGroup}>
                  <label>Mock Test Title *</label>
                  <input type="text" required value={testTitle} onChange={(e) => setTestTitle(e.target.value)} placeholder="e.g. IELTS Listening Full Test Mock 1" className={modalStyles.modalInput} />
                </div>

                <div className={modalStyles.formGroupDouble}>
                  <div className={modalStyles.formGroup}>
                    <label>Duration (Minutes) *</label>
                    <input type="number" required value={testDuration} onChange={(e) => setTestDuration(e.target.value)} className={modalStyles.modalInput} />
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Target Batch *</label>
                    <select required value={testBatchId} onChange={(e) => setTestBatchId(e.target.value)} className={modalStyles.modalSelect}>
                      <option value="">Select Target Batch...</option>
                      {metadata.batches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={modalStyles.formGroupDouble}>
                  <div className={modalStyles.formGroup}>
                    <label>Total Marks Scheme *</label>
                    <input type="number" required value={testTotal} onChange={(e) => setTestTotal(e.target.value)} className={modalStyles.modalInput} />
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Passing Marks Schema *</label>
                    <input type="number" required value={testPass} onChange={(e) => setTestPass(e.target.value)} className={modalStyles.modalInput} />
                  </div>
                </div>

                <div className={modalStyles.formGroup}>
                  <label>Google Form Link (Optional)</label>
                  <input type="url" value={testFormLink} onChange={(e) => setTestFormLink(e.target.value)} placeholder="https://forms.google.com/..." className={modalStyles.modalInput} />
                </div>

                <div className={modalStyles.formGroup}>
                  <label>Google Form Document ID (Optional)</label>
                  <input type="text" value={testFormId} onChange={(e) => setTestFormId(e.target.value)} placeholder="e.g. 1FAIpQLSf..." className={modalStyles.modalInput} />
                </div>

                <div className={modalStyles.modalFooter}>
                  <button type="button" onClick={() => setIsAddOpen(false)} className={modalStyles.cancelButton} disabled={isPending}>
                    Cancel
                  </button>
                  <button type="submit" className={modalStyles.submitButton} disabled={isPending}>
                    {isPending ? "Creating..." : "Save Mock Test"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ENTER TEST SCORE */}
        {isScoreOpen && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContent}>
              <div className={modalStyles.modalHeader}>
                <h3>Grade Mock Exam Result</h3>
                <button onClick={() => setIsScoreOpen(false)} className={modalStyles.closeModalButton}>✕</button>
              </div>

              {formError && <div className={modalStyles.errorAlert}>{formError}</div>}

              <form onSubmit={handleEnterScore} className={modalStyles.form}>
                <div className={modalStyles.formGroupDouble}>
                  <div className={modalStyles.formGroup}>
                    <label>Select Mock Test *</label>
                    <select required value={scoreTestId} onChange={(e) => setScoreTestId(e.target.value)} className={modalStyles.modalSelect}>
                      <option value="">Select Mock Test...</option>
                      {tests.map((t) => (
                        <option key={t.id} value={t.id}>{t.title} ({t.batch?.name})</option>
                      ))}
                    </select>
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Select Student *</label>
                    <select required value={scoreStudentId} onChange={(e) => setScoreStudentId(e.target.value)} className={modalStyles.modalSelect}>
                      <option value="">Select Student...</option>
                      {metadata.students.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} (Roll: {s.rollNo || "N/A"})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={modalStyles.formGroupDouble}>
                  <div className={modalStyles.formGroup}>
                    <label>Listening Band Score *</label>
                    <input type="number" step="0.5" min="0" max="9" required value={scoreListening} onChange={(e) => setScoreListening(e.target.value)} className={modalStyles.modalInput} />
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Reading Band Score *</label>
                    <input type="number" step="0.5" min="0" max="9" required value={scoreReading} onChange={(e) => setScoreReading(e.target.value)} className={modalStyles.modalInput} />
                  </div>
                </div>

                <div className={modalStyles.formGroupDouble}>
                  <div className={modalStyles.formGroup}>
                    <label>Writing Band Score *</label>
                    <input type="number" step="0.5" min="0" max="9" required value={scoreWriting} onChange={(e) => setScoreWriting(e.target.value)} className={modalStyles.modalInput} />
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Speaking Band Score *</label>
                    <input type="number" step="0.5" min="0" max="9" required value={scoreSpeaking} onChange={(e) => setScoreSpeaking(e.target.value)} className={modalStyles.modalInput} />
                  </div>
                </div>

                <div className={modalStyles.formGroup}>
                  <label>Evaluator Feedback / Weak Areas</label>
                  <textarea value={scoreFeedback} onChange={(e) => setScoreFeedback(e.target.value)} placeholder="Enter details on spelling, grammar, or task achievement..." className={modalStyles.modalTextarea} />
                </div>

                <div className={modalStyles.modalFooter}>
                  <button type="button" onClick={() => setIsScoreOpen(false)} className={modalStyles.cancelButton} disabled={isPending}>
                    Cancel
                  </button>
                  <button type="submit" className={modalStyles.submitButton} disabled={isPending}>
                    {isPending ? "Grading..." : "Submit Grades"}
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
