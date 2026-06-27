"use client";

import React, { useState, useTransition } from "react";
import Sidebar from "@/components/Sidebar";
import styles from "@/app/teachers/page.module.css";
import modalStyles from "@/app/students/page.module.css"; // Reuse modal styles
import { useRouter } from "next/navigation";
import { createTeacher, createTeacherLeave, approveTeacherLeave } from "@/app/teachers/actions";

interface Leave {
  id: string;
  teacherId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: string;
  substituteTeacherId: string | null;
  createdAt: Date;
  teacher: {
    name: string;
  };
}

interface Teacher {
  id: string;
  name: string;
  photoUrl: string | null;
  phone: string;
  email: string;
  address: string | null;
  qualification: string | null;
  specialization: string | null;
  franchise: string;
  joiningDate: Date;
  employmentType: string;
  active: boolean;
  batches: any[];
}

interface TeachersManagerClientProps {
  teachers: Teacher[];
  leaves: Leave[];
}

export default function TeachersManagerClient({ teachers, leaves }: TeachersManagerClientProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isSubOpen, setIsSubOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);

  // Form states - Teacher
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [franchise, setFranchise] = useState("Amritsar Branch");
  const [employmentType, setEmploymentType] = useState("FULL_TIME");
  const [photoUrl, setPhotoUrl] = useState("");

  // Form states - Leave Request
  const [leaveTeacherId, setLeaveTeacherId] = useState("");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  // Substitute teacher selection
  const [subTeacherId, setSubTeacherId] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !email || !phone || !franchise) {
      setFormError("Required fields (*) must be filled.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("address", address);
      formData.append("qualification", qualification);
      formData.append("specialization", specialization);
      formData.append("franchise", franchise);
      formData.append("employmentType", employmentType);
      formData.append("photoUrl", photoUrl);

      const res = await createTeacher(formData);
      if (res.error) {
        setFormError(res.error);
      } else {
        setIsAddOpen(false);
        setName(""); setEmail(""); setPhone(""); setAddress("");
        setQualification(""); setSpecialization(""); setPhotoUrl("");
        router.refresh();
      }
    });
  };

  const handleRequestLeave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!leaveTeacherId || !leaveStart || !leaveEnd || !leaveReason) {
      setFormError("All leave fields are required.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("teacherId", leaveTeacherId);
      formData.append("startDate", leaveStart);
      formData.append("endDate", leaveEnd);
      formData.append("reason", leaveReason);

      const res = await createTeacherLeave(formData);
      if (res.error) {
        setFormError(res.error);
      } else {
        setIsLeaveOpen(false);
        setLeaveTeacherId(""); setLeaveStart(""); setLeaveEnd(""); setLeaveReason("");
        router.refresh();
      }
    });
  };

  const handleApproveLeave = (leaveId: string) => {
    setSelectedLeaveId(leaveId);
    setSubTeacherId("");
    setIsSubOpen(true);
  };

  const submitApproveLeave = () => {
    if (!selectedLeaveId) return;

    startTransition(async () => {
      const res = await approveTeacherLeave(selectedLeaveId, "APPROVED", subTeacherId || undefined);
      if (res.error) {
        alert(res.error);
      } else {
        setIsSubOpen(false);
        setSelectedLeaveId(null);
        router.refresh();
      }
    });
  };

  const handleRejectLeave = (leaveId: string) => {
    if (!confirm("Are you sure you want to reject this leave request?")) return;

    startTransition(async () => {
      const res = await approveTeacherLeave(leaveId, "REJECTED");
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className={styles.container}>
      <Sidebar currentPhase={4} />

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1>Teacher Manager</h1>
            <p>Onboard teaching staff, manage active timetables, and coordinate substitute teacher leaves.</p>
          </div>
          <div className={styles.headerActions}>
            <button onClick={() => setIsLeaveOpen(true)} className={modalStyles.cancelButton} style={{ borderColor: "var(--outline)" }}>
              Request Leave
            </button>
            <button onClick={() => setIsAddOpen(true)} className={styles.addBtn}>
              + Onboard Teacher
            </button>
          </div>
        </header>

        {/* Dynamic Two-Column Layout */}
        <div className={styles.subGrid}>
          {/* Column Left: Teacher Roster */}
          <div>
            <h2 className={styles.sectionHeader}>Instructor Roster</h2>
            <div className={styles.teacherGrid}>
              {teachers.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No teachers registered yet.</p>
              ) : (
                teachers.map((teacher) => (
                  <div key={teacher.id} className={styles.teacherCard}>
                    <div className={styles.profileHeader}>
                      {teacher.photoUrl ? (
                        <img src={teacher.photoUrl} alt={teacher.name} className={styles.avatar} />
                      ) : (
                        <div className={styles.avatarFallback}>
                          {teacher.name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)}
                        </div>
                      )}
                      <div className={styles.profileName}>
                        <h3>{teacher.name}</h3>
                        <span>{teacher.employmentType} • {teacher.qualification || "No Degree"}</span>
                      </div>
                    </div>

                    <div className={styles.infoList}>
                      <div className={styles.infoItem}>
                        <strong>📞 Phone</strong>
                        <span>{teacher.phone}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <strong>✉️ Email</strong>
                        <span>{teacher.email}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <strong>📚 Specialization</strong>
                        <span>{teacher.specialization || "General English"}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <strong>🏫 Active Batches</strong>
                        <span>{teacher.batches?.length || 0} Batches</span>
                      </div>
                    </div>

                    <span className={styles.franchiseBadge}>
                      📍 {teacher.franchise}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column Right: Leaves approvals */}
          <div>
            <h2 className={styles.sectionHeader}>Staff Leave Requests</h2>
            <div className={styles.leaveTableWrapper}>
              <table className={styles.leaveTable}>
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Dates / Duration</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ color: "var(--text-muted)", textAlign: "center", padding: "1.5rem" }}>
                        No leaves requested.
                      </td>
                    </tr>
                  ) : (
                    leaves.map((leave) => (
                      <tr key={leave.id}>
                        <td style={{ fontWeight: "700" }}>{leave.teacher?.name}</td>
                        <td style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                          <div>{new Date(leave.startDate).toLocaleDateString()}</div>
                          <div style={{ color: "var(--text-muted)" }}>to {new Date(leave.endDate).toLocaleDateString()}</div>
                        </td>
                        <td style={{ fontSize: "0.8rem" }}>{leave.reason}</td>
                        <td>
                          <span style={{
                            fontWeight: "800",
                            fontSize: "0.75rem",
                            color: leave.status === "APPROVED" ? "var(--success)" : leave.status === "REJECTED" ? "var(--danger)" : "var(--warning)"
                          }}>
                            {leave.status}
                          </span>
                        </td>
                        <td>
                          {leave.status === "PENDING" ? (
                            <div className={styles.leaveActions}>
                              <button onClick={() => handleApproveLeave(leave.id)} className={styles.approveBtn}>Approve</button>
                              <button onClick={() => handleRejectLeave(leave.id)} className={styles.rejectBtn}>Reject</button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>Handled</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* MODAL: ONBOARD TEACHER */}
        {isAddOpen && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContent}>
              <div className={modalStyles.modalHeader}>
                <h3>Onboard Instructor</h3>
                <button onClick={() => setIsAddOpen(false)} className={modalStyles.closeModalButton}>✕</button>
              </div>

              {formError && <div className={modalStyles.errorAlert}>{formError}</div>}

              <form onSubmit={handleAddTeacher} className={modalStyles.form}>
                <div className={modalStyles.formGroupDouble}>
                  <div className={modalStyles.formGroup}>
                    <label>Full Name *</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah Connor" className={modalStyles.modalInput} />
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Email Address *</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@institute.com" className={modalStyles.modalInput} />
                  </div>
                </div>

                <div className={modalStyles.formGroupDouble}>
                  <div className={modalStyles.formGroup}>
                    <label>Phone Number *</label>
                    <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +91 99999 88888" className={modalStyles.modalInput} />
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Franchise Branch *</label>
                    <input type="text" required value={franchise} onChange={(e) => setFranchise(e.target.value)} placeholder="e.g. Amritsar Branch" className={modalStyles.modalInput} />
                  </div>
                </div>

                <div className={modalStyles.formGroupDouble}>
                  <div className={modalStyles.formGroup}>
                    <label>Qualification</label>
                    <input type="text" value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g. MA in Linguistics" className={modalStyles.modalInput} />
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Specialization Topic</label>
                    <input type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. IELTS Writing Task 2" className={modalStyles.modalInput} />
                  </div>
                </div>

                <div className={modalStyles.formGroupDouble}>
                  <div className={modalStyles.formGroup}>
                    <label>Employment Type</label>
                    <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className={modalStyles.modalSelect}>
                      <option value="FULL_TIME">FULL-TIME STAFF</option>
                      <option value="PART_TIME">PART-TIME COACH</option>
                      <option value="VISITING">VISITING FACULTY</option>
                    </select>
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Photo URL</label>
                    <input type="url" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://example.com/avatar.jpg" className={modalStyles.modalInput} />
                  </div>
                </div>

                <div className={modalStyles.formGroup}>
                  <label>Residential Address</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street name, City..." className={modalStyles.modalInput} />
                </div>

                <div className={modalStyles.modalFooter}>
                  <button type="button" onClick={() => setIsAddOpen(false)} className={modalStyles.cancelButton} disabled={isPending}>
                    Cancel
                  </button>
                  <button type="submit" className={modalStyles.submitButton} disabled={isPending}>
                    {isPending ? "Saving..." : "Onboard Instructor"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: SUBMIT LEAVE REQUEST */}
        {isLeaveOpen && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContent}>
              <div className={modalStyles.modalHeader}>
                <h3>Submit Leave Request</h3>
                <button onClick={() => setIsLeaveOpen(false)} className={modalStyles.closeModalButton}>✕</button>
              </div>

              {formError && <div className={modalStyles.errorAlert}>{formError}</div>}

              <form onSubmit={handleRequestLeave} className={modalStyles.form}>
                <div className={modalStyles.formGroup}>
                  <label>Select Teacher *</label>
                  <select required value={leaveTeacherId} onChange={(e) => setLeaveTeacherId(e.target.value)} className={modalStyles.modalSelect}>
                    <option value="">Choose Teacher...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.franchise})</option>
                    ))}
                  </select>
                </div>

                <div className={modalStyles.formGroupDouble}>
                  <div className={modalStyles.formGroup}>
                    <label>Start Date *</label>
                    <input type="date" required value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} className={modalStyles.modalInput} />
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>End Date *</label>
                    <input type="date" required value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} className={modalStyles.modalInput} />
                  </div>
                </div>

                <div className={modalStyles.formGroup}>
                  <label>Reason for Leave *</label>
                  <textarea required value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Detailed reason..." className={modalStyles.modalTextarea} />
                </div>

                <div className={modalStyles.modalFooter}>
                  <button type="button" onClick={() => setIsLeaveOpen(false)} className={modalStyles.cancelButton} disabled={isPending}>
                    Cancel
                  </button>
                  <button type="submit" className={modalStyles.submitButton} disabled={isPending}>
                    {isPending ? "Submitting..." : "Submit Leave"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ASSIGN SUBSTITUTE & APPROVE LEAVE */}
        {isSubOpen && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContent}>
              <div className={modalStyles.modalHeader}>
                <h3>Approve Leave &amp; Reassign Batch</h3>
                <button onClick={() => setIsSubOpen(false)} className={modalStyles.closeModalButton}>✕</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.875rem", color: "var(--foreground)" }}>
                <p>
                  You are approving this leave request. Would you like to select a substitute teacher to cover their active batches and notify students automatically?
                </p>

                <div className={modalStyles.formGroup}>
                  <label>Select Substitute Teacher</label>
                  <select value={subTeacherId} onChange={(e) => setSubTeacherId(e.target.value)} className={modalStyles.modalSelect}>
                    <option value="">No substitute (Independent study)...</option>
                    {teachers
                      .filter((t) => t.id !== leaves.find((l) => l.id === selectedLeaveId)?.teacherId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.franchise})</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className={modalStyles.modalFooter} style={{ marginTop: "2rem" }}>
                <button type="button" onClick={() => setIsSubOpen(false)} className={modalStyles.cancelButton} disabled={isPending}>
                  Cancel
                </button>
                <button type="button" onClick={submitApproveLeave} className={modalStyles.submitButton} style={{ background: "var(--success)" }} disabled={isPending}>
                  {isPending ? "Processing..." : "Approve & Notify"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
