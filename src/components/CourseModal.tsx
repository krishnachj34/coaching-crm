"use client";

import React, { useState, useTransition } from "react";
import styles from "../app/students/page.module.css";
import { createCourse, deleteCourse } from "@/app/students/actions";

interface Course {
  id: string;
  title: string;
  description?: string | null;
  feeAmount: any;
}

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courses: Course[];
}

export default function CourseModal({ isOpen, onClose, onSuccess, courses }: CourseModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title || !feeAmount) {
      setError("Title and Fee Amount are required.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("feeAmount", feeAmount);

      const res = await createCourse(formData);

      if (res.error) {
        setError(res.error);
      } else {
        setTitle("");
        setDescription("");
        setFeeAmount("");
        onSuccess();
      }
    });
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? Existing enrollments will be deleted.")) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await deleteCourse(courseId);
      if (res.error) {
        setError(res.error);
      } else {
        onSuccess();
      }
    });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ maxWidth: "600px" }}>
        <div className={styles.modalHeader}>
          <h3>Manage Courses (Modules)</h3>
          <button onClick={onClose} className={styles.closeModalButton}>
            ✕
          </button>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <div className={styles.courseManagerLayout}>
          {/* Add Course Form */}
          <form onSubmit={handleSubmit} className={styles.form} style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--card-border)", paddingBottom: "1.5rem" }}>
            <h4 style={{ marginBottom: "0.75rem", fontSize: "1rem" }}>Add New Module / Subject</h4>
            <div className={styles.formGroup}>
              <label htmlFor="course-title">Title *</label>
              <input
                id="course-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. IELTS Reading Module"
                className={styles.modalInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="course-description">Description</label>
              <input
                id="course-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of the course modules"
                className={styles.modalInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="course-fee">Fee Amount ($) *</label>
              <input
                id="course-fee"
                type="number"
                step="0.01"
                required
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                placeholder="e.g. 150.00"
                className={styles.modalInput}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className={styles.submitButton}
              style={{ width: "100%", marginTop: "0.5rem" }}
            >
              {isPending ? "Saving..." : "+ Add Course"}
            </button>
          </form>

          {/* List of Courses */}
          <div>
            <h4 style={{ marginBottom: "0.75rem", fontSize: "1rem" }}>Existing Modules ({courses.length})</h4>
            {courses.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No courses available.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "250px", overflowY: "auto" }}>
                {courses.map((course) => (
                  <div
                    key={course.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.75rem",
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--card-border)",
                      borderRadius: "var(--radius)",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "0.9rem" }}>{course.title}</strong>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>
                        {course.description || "No description"} • ${Number(course.feeAmount).toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(course.id)}
                      disabled={isPending}
                      style={{
                        backgroundColor: "#ef4444",
                        color: "#ffffff",
                        border: "none",
                        padding: "0.35rem 0.6rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
