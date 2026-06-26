"use client";

import React, { useState, useTransition } from "react";
import Sidebar from "@/components/Sidebar";
import styles from "@/app/academics/page.module.css";
import modalStyles from "@/app/students/page.module.css"; // Reuse modal styling classes
import { useRouter } from "next/navigation";
import {
  createCategory,
  createSubCategory,
  createSubject,
  createBatch,
  createNotice,
  createQuestion,
  createUpcomingEvent,
  createLiveClass,
} from "@/app/academics/actions";

interface AcademicsManagerClientProps {
  categories: any[];
  subCategories: any[];
  batches: any[];
  notices: any[];
  subjects: any[];
  questions: any[];
  events: any[];
  liveClasses: any[];
  metadata: {
    categories: any[];
    subCategories: any[];
    teachers: any[];
    subjects: any[];
    batches: any[];
  };
}

export default function AcademicsManagerClient({
  categories,
  subCategories,
  batches,
  notices,
  subjects,
  questions,
  events,
  liveClasses,
  metadata,
}: AcademicsManagerClientProps) {
  const [activeTab, setActiveTab] = useState("categories");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // ── FORM STATES ──
  // Category
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catIcon, setCatIcon] = useState("school");
  const [catColor, setCatColor] = useState("#4f46e5");

  // Sub-Category
  const [subName, setSubName] = useState("");
  const [subCatId, setSubCatId] = useState("");

  // Subject
  const [subNameSubject, setSubNameSubject] = useState("");
  const [subjectCatId, setSubjectCatId] = useState("");

  // Batch
  const [batchName, setBatchName] = useState("");
  const [batchSubCatId, setBatchSubCatId] = useState("");
  const [batchTeacherId, setBatchTeacherId] = useState("");
  const [batchStart, setBatchStart] = useState("");
  const [batchEnd, setBatchEnd] = useState("");
  const [batchDays, setBatchDays] = useState("Mon/Wed/Fri");
  const [batchTiming, setBatchTiming] = useState("09:00 AM - 11:00 AM");
  const [batchCapacity, setBatchCapacity] = useState("20");
  const [batchFee, setBatchFee] = useState("250.00");

  // Notice
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeAudience, setNoticeAudience] = useState("ALL");
  const [noticeAudienceId, setNoticeAudienceId] = useState("");
  const [noticeType, setNoticeType] = useState("GENERAL");
  const [noticeScheduled, setNoticeScheduled] = useState("");

  // Question
  const [qSubjectId, setQSubjectId] = useState("");
  const [qTopic, setQTopic] = useState("");
  const [qDifficulty, setQDifficulty] = useState("MEDIUM");
  const [qType, setQType] = useState("MCQ");
  const [qContent, setQContent] = useState("");
  const [qAnswer, setQAnswer] = useState("");
  const [qExplain, setQExplain] = useState("");
  const [qBand, setQBand] = useState("");

  // Event
  const [evtTitle, setEvtTitle] = useState("");
  const [evtType, setEvtType] = useState("DEMO_CLASS");
  const [evtDate, setEvtDate] = useState("");
  const [evtTime, setEvtTime] = useState("");
  const [evtInstructor, setEvtInstructor] = useState("");
  const [evtPlatform, setEvtPlatform] = useState("OFFLINE");
  const [evtLink, setEvtLink] = useState("");

  // Live Class
  const [liveTitle, setLiveTitle] = useState("");
  const [liveLink, setLiveLink] = useState("");
  const [liveBatchId, setLiveBatchId] = useState("");
  const [liveDate, setLiveDate] = useState("");
  const [liveTime, setLiveTime] = useState("");
  const [liveRecord, setLiveRecord] = useState("");

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

      if (activeTab === "categories") {
        formData.append("name", catName);
        formData.append("description", catDesc);
        formData.append("icon", catIcon);
        formData.append("color", catColor);
        res = await createCategory(formData);
      } else if (activeTab === "subCategories") {
        formData.append("name", subName);
        formData.append("categoryId", subCatId);
        res = await createSubCategory(formData);
      } else if (activeTab === "subjects") {
        formData.append("name", subNameSubject);
        formData.append("categoryId", subjectCatId);
        res = await createSubject(formData);
      } else if (activeTab === "batches") {
        formData.append("name", batchName);
        formData.append("subCategoryId", batchSubCatId);
        formData.append("teacherId", batchTeacherId);
        formData.append("startDate", batchStart);
        formData.append("endDate", batchEnd);
        formData.append("days", batchDays);
        formData.append("timing", batchTiming);
        formData.append("maxCapacity", batchCapacity);
        formData.append("feeAmount", batchFee);
        res = await createBatch(formData);
      } else if (activeTab === "notices") {
        formData.append("title", noticeTitle);
        formData.append("content", noticeContent);
        formData.append("targetAudience", noticeAudience);
        formData.append("targetId", noticeAudienceId);
        formData.append("type", noticeType);
        formData.append("scheduledAt", noticeScheduled);
        res = await createNotice(formData);
      } else if (activeTab === "questions") {
        formData.append("subjectId", qSubjectId);
        formData.append("topic", qTopic);
        formData.append("difficulty", qDifficulty);
        formData.append("type", qType);
        formData.append("content", qContent);
        formData.append("answer", qAnswer);
        formData.append("explanation", qExplain);
        formData.append("bandRelevance", qBand);
        res = await createQuestion(formData);
      } else if (activeTab === "events") {
        formData.append("title", evtTitle);
        formData.append("type", evtType);
        formData.append("date", evtDate);
        formData.append("time", evtTime);
        formData.append("instructor", evtInstructor);
        formData.append("platform", evtPlatform);
        formData.append("link", evtLink);
        res = await createUpcomingEvent(formData);
      } else if (activeTab === "liveClasses") {
        formData.append("title", liveTitle);
        formData.append("meetingLink", liveLink);
        formData.append("batchId", liveBatchId);
        formData.append("date", liveDate);
        formData.append("time", liveTime);
        formData.append("recordingLink", liveRecord);
        res = await createLiveClass(formData);
      }

      if (res.error) {
        setFormError(res.error);
      } else {
        setIsAddOpen(false);
        // Clear forms
        setCatName(""); setCatDesc("");
        setSubName(""); setSubCatId("");
        setSubNameSubject(""); setSubjectCatId("");
        setBatchName(""); setBatchSubCatId(""); setBatchTeacherId("");
        setNoticeTitle(""); setNoticeContent("");
        setQSubjectId(""); setQTopic(""); setQContent(""); setQAnswer(""); setQExplain(""); setQBand("");
        setEvtTitle(""); setEvtDate(""); setEvtTime(""); setEvtInstructor(""); setEvtLink("");
        setLiveTitle(""); setLiveLink(""); setLiveBatchId(""); setLiveDate(""); setLiveTime(""); setLiveRecord("");
        router.refresh();
      }
    });
  };

  const tabs = [
    { id: "categories", label: "Categories", icon: "category" },
    { id: "subCategories", label: "Sub-Categories", icon: "widgets" },
    { id: "subjects", label: "Subjects", icon: "menu_book" },
    { id: "batches", label: "Batches", icon: "group" },
    { id: "notices", label: "Notices", icon: "campaign" },
    { id: "questions", label: "Question Bank", icon: "quiz" },
    { id: "events", label: "Upcoming Events", icon: "event" },
    { id: "liveClasses", label: "Live Classes", icon: "video_camera_front" },
  ];

  return (
    <div className={styles.container}>
      <Sidebar currentPhase={3} />

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1>Academics Manager</h1>
            <p>Administer notice boards, course classifications, active learning batches, and exams assets.</p>
          </div>
          <div className={styles.tabsContainer}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTabButton : ""}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* ACTIVE TAB RENDER */}
        <div className={styles.tabContent}>
          <div className={styles.subHeader}>
            <h2>{tabs.find((t) => t.id === activeTab)?.label} Overview</h2>
            <button onClick={openAddModal} className={styles.btn}>
              + Create New
            </button>
          </div>

          {activeTab === "categories" && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Icon/Color</th>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr><td colSpan={4}>No categories defined yet.</td></tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.id}>
                        <td>
                          <span 
                            className="material-symbols-outlined"
                            style={{ 
                              color: cat.color || "var(--primary)", 
                              background: `${cat.color || "var(--primary)"}22`,
                              padding: "0.4rem",
                              borderRadius: "8px"
                            }}
                          >
                            {cat.icon || "school"}
                          </span>
                        </td>
                        <td style={{ fontWeight: "700" }}>{cat.name}</td>
                        <td style={{ color: "var(--text-muted)" }}>{cat.description || "N/A"}</td>
                        <td>
                          <span className={cat.active ? styles.statusActive : styles.statusInactive}>
                            {cat.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "subCategories" && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Sub-Category Name</th>
                    <th>Course Category</th>
                  </tr>
                </thead>
                <tbody>
                  {subCategories.length === 0 ? (
                    <tr><td colSpan={2}>No sub-categories defined.</td></tr>
                  ) : (
                    subCategories.map((sub) => (
                      <tr key={sub.id}>
                        <td style={{ fontWeight: "700" }}>{sub.name}</td>
                        <td>{sub.category?.name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "subjects" && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Subject Name</th>
                    <th>Parent Course Category</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.length === 0 ? (
                    <tr><td colSpan={2}>No subjects defined.</td></tr>
                  ) : (
                    subjects.map((sub) => (
                      <tr key={sub.id}>
                        <td style={{ fontWeight: "700" }}>{sub.name}</td>
                        <td>{sub.category?.name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "batches" && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Batch Name</th>
                    <th>Track / Sub-Category</th>
                    <th>Schedule Details</th>
                    <th>Instructor</th>
                    <th>Fee Amount</th>
                    <th>Occupancy</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.length === 0 ? (
                    <tr><td colSpan={6}>No batches running.</td></tr>
                  ) : (
                    batches.map((batch) => (
                      <tr key={batch.id}>
                        <td style={{ fontWeight: "700" }}>{batch.name}</td>
                        <td>{batch.subCategory?.name}</td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                            <span>📅 {batch.days}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>⏰ {batch.timing}</span>
                          </div>
                        </td>
                        <td>{batch.teacher?.name}</td>
                        <td style={{ fontWeight: "700" }}>₹{Number(batch.feeAmount).toFixed(2)}</td>
                        <td>{batch.enrollments?.length || 0} / {batch.maxCapacity}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "notices" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
              {notices.length === 0 ? (
                <div style={{ color: "var(--text-muted)", gridColumn: "1/-1" }}>No notices sent yet.</div>
              ) : (
                notices.map((n) => (
                  <div key={n.id} className={styles.noticeCard}>
                    <div className={styles.noticeMeta}>
                      <span className={`${styles.tagNotice} ${styles["notice" + n.type]}`}>{n.type}</span>
                      <span>📅 {new Date(n.scheduledAt).toLocaleDateString()}</span>
                    </div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--foreground)", marginTop: "0.5rem" }}>{n.title}</h3>
                    <p style={{ fontSize: "0.875rem", color: "var(--on-surface-variant)", lineHeight: "1.4" }}>{n.content}</p>
                    <div style={{ borderTop: "1px solid var(--outline-variant)", paddingTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Target: <strong>{n.targetAudience}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "questions" && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Subject / Topic</th>
                    <th>Difficulty / Type</th>
                    <th>Question Context</th>
                    <th>Answer / Key</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.length === 0 ? (
                    <tr><td colSpan={4}>Question bank empty.</td></tr>
                  ) : (
                    questions.map((q) => (
                      <tr key={q.id}>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                            <strong>{q.subject?.name}</strong>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Topic: {q.topic}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                            <span className={`${styles.difficultyBadge} ${styles["difficulty" + q.difficulty]}`}>{q.difficulty}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{q.type}</span>
                          </div>
                        </td>
                        <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.content}</td>
                        <td>{q.answer}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "events" && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Event Title</th>
                    <th>Type</th>
                    <th>Date / Time</th>
                    <th>Platform</th>
                    <th>Instructor</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr><td colSpan={5}>No upcoming events scheduled.</td></tr>
                  ) : (
                    events.map((e) => (
                      <tr key={e.id}>
                        <td style={{ fontWeight: "700" }}>{e.title}</td>
                        <td>{e.type}</td>
                        <td>{new Date(e.date).toLocaleDateString()} {e.time}</td>
                        <td>
                          {e.platform === "ONLINE" && e.link ? (
                            <a href={e.link} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontWeight: "700" }}>Online Link</a>
                          ) : (
                            "Offline Branch"
                          )}
                        </td>
                        <td>{e.instructor}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "liveClasses" && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Class Title</th>
                    <th>Batch</th>
                    <th>Date / Time</th>
                    <th>Meeting Link</th>
                    <th>Recording Replay</th>
                  </tr>
                </thead>
                <tbody>
                  {liveClasses.length === 0 ? (
                    <tr><td colSpan={5}>No live online sessions.</td></tr>
                  ) : (
                    liveClasses.map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: "700" }}>{l.title}</td>
                        <td>{l.batch?.name}</td>
                        <td>{new Date(l.date).toLocaleDateString()} {l.time}</td>
                        <td>
                          <a href={l.meetingLink} target="_blank" rel="noreferrer" className={styles.difficultyBadge} style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                            Join Class
                          </a>
                        </td>
                        <td>
                          {l.recordingLink ? (
                            <a href={l.recordingLink} target="_blank" rel="noreferrer" style={{ color: "var(--success)", fontWeight: "600" }}>Watch Replay</a>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No Recording</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CREATE MODALS DYNAMIC BASED ON TAB */}
        {isAddOpen && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContent}>
              <div className={modalStyles.modalHeader}>
                <h3>Create {tabs.find((t) => t.id === activeTab)?.label}</h3>
                <button onClick={() => setIsAddOpen(false)} className={modalStyles.closeModalButton}>✕</button>
              </div>

              {formError && <div className={modalStyles.errorAlert}>{formError}</div>}

              <form onSubmit={handleAddSubmit} className={modalStyles.form}>
                
                {/* 1. Category Form */}
                {activeTab === "categories" && (
                  <>
                    <div className={modalStyles.formGroup}>
                      <label>Category Name *</label>
                      <input type="text" required value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. IELTS" className={modalStyles.modalInput} />
                    </div>
                    <div className={modalStyles.formGroup}>
                      <label>Description</label>
                      <textarea value={catDesc} onChange={(e) => setCatDesc(e.target.value)} placeholder="Course details..." className={modalStyles.modalTextarea} />
                    </div>
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Material Icon Name</label>
                        <input type="text" value={catIcon} onChange={(e) => setCatIcon(e.target.value)} className={modalStyles.modalInput} />
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Hex Theme Color</label>
                        <input type="color" value={catColor} onChange={(e) => setCatColor(e.target.value)} className={modalStyles.modalInput} style={{ height: "42px" }} />
                      </div>
                    </div>
                  </>
                )}

                {/* 2. Sub-Category Form */}
                {activeTab === "subCategories" && (
                  <>
                    <div className={modalStyles.formGroup}>
                      <label>Sub-Category Name *</label>
                      <input type="text" required value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="e.g. Academic Preparation" className={modalStyles.modalInput} />
                    </div>
                    <div className={modalStyles.formGroup}>
                      <label>Course Category *</label>
                      <select required value={subCatId} onChange={(e) => setSubCatId(e.target.value)} className={modalStyles.modalSelect}>
                        <option value="">Select Category...</option>
                        {metadata.categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* 3. Subject Form */}
                {activeTab === "subjects" && (
                  <>
                    <div className={modalStyles.formGroup}>
                      <label>Subject Name *</label>
                      <input type="text" required value={subNameSubject} onChange={(e) => setSubNameSubject(e.target.value)} placeholder="e.g. IELTS Writing" className={modalStyles.modalInput} />
                    </div>
                    <div className={modalStyles.formGroup}>
                      <label>Course Category *</label>
                      <select required value={subjectCatId} onChange={(e) => setSubjectCatId(e.target.value)} className={modalStyles.modalSelect}>
                        <option value="">Select Category...</option>
                        {metadata.categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* 4. Batch Form */}
                {activeTab === "batches" && (
                  <>
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Batch Name *</label>
                        <input type="text" required value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="e.g. Morning IELTS Batch A" className={modalStyles.modalInput} />
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Sub-Category *</label>
                        <select required value={batchSubCatId} onChange={(e) => setBatchSubCatId(e.target.value)} className={modalStyles.modalSelect}>
                          <option value="">Select Sub-Category...</option>
                          {metadata.subCategories.map((s) => (
                            <option key={s.id} value={s.id}>{s.name} ({s.category?.name})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Schedules Days *</label>
                        <input type="text" required value={batchDays} onChange={(e) => setBatchDays(e.target.value)} placeholder="e.g. Mon/Wed/Fri" className={modalStyles.modalInput} />
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Timings Slot *</label>
                        <input type="text" required value={batchTiming} onChange={(e) => setBatchTiming(e.target.value)} placeholder="e.g. 09:00 AM - 11:00 AM" className={modalStyles.modalInput} />
                      </div>
                    </div>
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Start Date *</label>
                        <input type="date" required value={batchStart} onChange={(e) => setBatchStart(e.target.value)} className={modalStyles.modalInput} />
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>End Date *</label>
                        <input type="date" required value={batchEnd} onChange={(e) => setBatchEnd(e.target.value)} className={modalStyles.modalInput} />
                      </div>
                    </div>
                    <div className={modalStyles.formGroup}>
                      <label>Assigned Coach / Teacher *</label>
                      <select required value={batchTeacherId} onChange={(e) => setBatchTeacherId(e.target.value)} className={modalStyles.modalSelect}>
                        <option value="">Select Teacher...</option>
                        {metadata.teachers.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.franchise})</option>
                        ))}
                      </select>
                    </div>
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Max Seats Capacity *</label>
                        <input type="number" required value={batchCapacity} onChange={(e) => setBatchCapacity(e.target.value)} className={modalStyles.modalInput} />
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Monthly Fee Amount (₹) *</label>
                        <input type="number" step="0.01" required value={batchFee} onChange={(e) => setBatchFee(e.target.value)} className={modalStyles.modalInput} />
                      </div>
                    </div>
                  </>
                )}

                {/* 5. Notice Form */}
                {activeTab === "notices" && (
                  <>
                    <div className={modalStyles.formGroup}>
                      <label>Notice Title *</label>
                      <input type="text" required value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} placeholder="e.g. IELTS Exam Mock Test Schedule" className={modalStyles.modalInput} />
                    </div>
                    <div className={modalStyles.formGroup}>
                      <label>Content Message *</label>
                      <textarea required value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)} placeholder="Notice text message..." className={modalStyles.modalTextarea} />
                    </div>
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Target Audience *</label>
                        <select required value={noticeAudience} onChange={(e) => setNoticeAudience(e.target.value)} className={modalStyles.modalSelect}>
                          <option value="ALL">All Students</option>
                          <option value="BATCH">Specific Batch</option>
                          <option value="TEACHERS">All Teachers</option>
                        </select>
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Notice Category *</label>
                        <select required value={noticeType} onChange={(e) => setNoticeType(e.target.value)} className={modalStyles.modalSelect}>
                          <option value="GENERAL">GENERAL</option>
                          <option value="URGENT">URGENT</option>
                          <option value="HOLIDAY">HOLIDAY</option>
                          <option value="EXAM_REMINDER">EXAM REMINDER</option>
                        </select>
                      </div>
                    </div>
                    {noticeAudience === "BATCH" && (
                      <div className={modalStyles.formGroup}>
                        <label>Target Batch ID *</label>
                        <select required value={noticeAudienceId} onChange={(e) => setNoticeAudienceId(e.target.value)} className={modalStyles.modalSelect}>
                          <option value="">Select Target Batch...</option>
                          {metadata.batches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className={modalStyles.formGroup}>
                      <label>Scheduled Post Time</label>
                      <input type="datetime-local" value={noticeScheduled} onChange={(e) => setNoticeScheduled(e.target.value)} className={modalStyles.modalInput} />
                    </div>
                  </>
                )}

                {/* 6. Question Form */}
                {activeTab === "questions" && (
                  <>
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Subject Link *</label>
                        <select required value={qSubjectId} onChange={(e) => setQSubjectId(e.target.value)} className={modalStyles.modalSelect}>
                          <option value="">Select Subject...</option>
                          {metadata.subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Topic Name *</label>
                        <input type="text" required value={qTopic} onChange={(e) => setQTopic(e.target.value)} placeholder="e.g. Essay Writing Task 2" className={modalStyles.modalInput} />
                      </div>
                    </div>
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Difficulty *</label>
                        <select required value={qDifficulty} onChange={(e) => setQDifficulty(e.target.value)} className={modalStyles.modalSelect}>
                          <option value="EASY">EASY</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HARD">HARD</option>
                        </select>
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Question Type *</label>
                        <select required value={qType} onChange={(e) => setQType(e.target.value)} className={modalStyles.modalSelect}>
                          <option value="MCQ">MCQ</option>
                          <option value="FILL_IN_THE_BLANK">FILL IN THE BLANK</option>
                          <option value="DESCRIPTIVE">DESCRIPTIVE</option>
                        </select>
                      </div>
                    </div>
                    <div className={modalStyles.formGroup}>
                      <label>Question Content/Prompt *</label>
                      <textarea required value={qContent} onChange={(e) => setQContent(e.target.value)} placeholder="Question context..." className={modalStyles.modalTextarea} />
                    </div>
                    <div className={modalStyles.formGroup}>
                      <label>Answer Key / Model Answer *</label>
                      <textarea required value={qAnswer} onChange={(e) => setQAnswer(e.target.value)} placeholder="Answer value..." className={modalStyles.modalTextarea} />
                    </div>
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Explanation Notes</label>
                        <input type="text" value={qExplain} onChange={(e) => setQExplain(e.target.value)} className={modalStyles.modalInput} />
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>IELTS Band Target</label>
                        <input type="text" value={qBand} onChange={(e) => setQBand(e.target.value)} placeholder="e.g. Band 7.5+" className={modalStyles.modalInput} />
                      </div>
                    </div>
                  </>
                )}

                {/* 7. Event Form */}
                {activeTab === "events" && (
                  <>
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Event Title *</label>
                        <input type="text" required value={evtTitle} onChange={(e) => setEvtTitle(e.target.value)} placeholder="e.g. Overseas Admission Workshop" className={modalStyles.modalInput} />
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Event Type *</label>
                        <select required value={evtType} onChange={(e) => setEvtType(e.target.value)} className={modalStyles.modalSelect}>
                          <option value="DEMO_CLASS">DEMO CLASS</option>
                          <option value="WORKSHOP">WORKSHOP</option>
                          <option value="WEBINAR">WEBINAR</option>
                        </select>
                      </div>
                    </div>
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Date *</label>
                        <input type="date" required value={evtDate} onChange={(e) => setEvtDate(e.target.value)} className={modalStyles.modalInput} />
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Time Slot *</label>
                        <input type="text" required value={evtTime} onChange={(e) => setEvtTime(e.target.value)} placeholder="e.g. 05:00 PM" className={modalStyles.modalInput} />
                      </div>
                    </div>
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Instructor / Speaker *</label>
                        <input type="text" required value={evtInstructor} onChange={(e) => setEvtInstructor(e.target.value)} placeholder="Speaker name" className={modalStyles.modalInput} />
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Platform *</label>
                        <select required value={evtPlatform} onChange={(e) => setEvtPlatform(e.target.value)} className={modalStyles.modalSelect}>
                          <option value="OFFLINE">OFFLINE BRANCH</option>
                          <option value="ONLINE">ONLINE</option>
                        </select>
                      </div>
                    </div>
                    {evtPlatform === "ONLINE" && (
                      <div className={modalStyles.formGroup}>
                        <label>Google Meet / Zoom URL</label>
                        <input type="url" value={evtLink} onChange={(e) => setEvtLink(e.target.value)} placeholder="https://meet.google.com/xyz" className={modalStyles.modalInput} />
                      </div>
                    )}
                  </>
                )}

                {/* 8. Live Class Form */}
                {activeTab === "liveClasses" && (
                  <>
                    <div className={modalStyles.formGroup}>
                      <label>Class Topic Title *</label>
                      <input type="text" required value={liveTitle} onChange={(e) => setLiveTitle(e.target.value)} placeholder="e.g. Speaking Part 3 Advanced Cue Cards" className={modalStyles.modalInput} />
                    </div>
                    <div className={modalStyles.formGroup}>
                      <label>Google Meet / Zoom Link *</label>
                      <input type="url" required value={liveLink} onChange={(e) => setLiveLink(e.target.value)} placeholder="https://zoom.us/j/12345" className={modalStyles.modalInput} />
                    </div>
                    <div className={modalStyles.formGroup}>
                      <label>Target Batch *</label>
                      <select required value={liveBatchId} onChange={(e) => setLiveBatchId(e.target.value)} className={modalStyles.modalSelect}>
                        <option value="">Select Batch...</option>
                        {metadata.batches.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Date *</label>
                        <input type="date" required value={liveDate} onChange={(e) => setLiveDate(e.target.value)} className={modalStyles.modalInput} />
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Time Slot *</label>
                        <input type="text" required value={liveTime} onChange={(e) => setLiveTime(e.target.value)} placeholder="e.g. 10:00 AM" className={modalStyles.modalInput} />
                      </div>
                    </div>
                    <div className={modalStyles.formGroup}>
                      <label>Recording Replay Link (Optional)</label>
                      <input type="url" value={liveRecord} onChange={(e) => setLiveRecord(e.target.value)} placeholder="Replay recording link" className={modalStyles.modalInput} />
                    </div>
                  </>
                )}

                <div className={modalStyles.modalFooter}>
                  <button type="button" onClick={() => setIsAddOpen(false)} className={modalStyles.cancelButton} disabled={isPending}>
                    Cancel
                  </button>
                  <button type="submit" className={modalStyles.submitButton} disabled={isPending}>
                    {isPending ? "Creating..." : "Save " + tabs.find((t) => t.id === activeTab)?.label}
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
