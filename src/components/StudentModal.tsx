"use client";

import React, { useState, useTransition } from "react";
import styles from "../app/students/page.module.css";
import { createStudent } from "@/app/students/actions";
import DragDropUpload from "@/components/DragDropUpload";

interface Course {
  id: string;
  title: string;
  feeAmount: any;
}

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courses: Course[];
}

export default function StudentModal({ isOpen, onClose, onSuccess, courses }: StudentModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [address, setAddress] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !phone) {
      setError("Name and Phone number are required.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("rollNo", rollNo);
      formData.append("address", address);
      formData.append("parentName", parentName);
      formData.append("parentPhone", parentPhone);
      formData.append("photoUrl", photoUrl);

      const res = await createStudent(formData, selectedCourses);

      if (res.error) {
        setError(res.error);
      } else {
        setName("");
        setEmail("");
        setPhone("");
        setRollNo("");
        setAddress("");
        setParentName("");
        setParentPhone("");
        setPhotoUrl("");
        setSelectedCourses([]);
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Register New Student</h3>
          <button onClick={onClose} className={styles.closeModalButton}>
            ✕
          </button>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroupDouble}>
            <div className={styles.formGroup}>
              <label htmlFor="student-name">Name *</label>
              <input
                id="student-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className={styles.modalInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="student-rollNo">Roll Number</label>
              <input
                id="student-rollNo"
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="e.g. IELTS-1024"
                className={styles.modalInput}
              />
            </div>
          </div>

          <div className={styles.formGroupDouble}>
            <div className={styles.formGroup}>
              <label htmlFor="student-phone">Phone *</label>
              <input
                id="student-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                className={styles.modalInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="student-email">Email</label>
              <input
                id="student-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className={styles.modalInput}
              />
            </div>
          </div>

          <div className={styles.formGroupDouble}>
            <div className={styles.formGroup}>
              <label htmlFor="student-parentName">Parent Name</label>
              <input
                id="student-parentName"
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Parent Name"
                className={styles.modalInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="student-parentPhone">Parent Phone</label>
              <input
                id="student-parentPhone"
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="Parent Phone"
                className={styles.modalInput}
              />
            </div>
          </div>

          <div className={styles.formGroupDouble}>
            <div className={styles.formGroup}>
              <label htmlFor="student-address">Address</label>
              <input
                id="student-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Home Address"
                className={styles.modalInput}
              />
            </div>
            <div className={styles.formGroup}>
              <DragDropUpload
                value={photoUrl}
                onChange={setPhotoUrl}
                accept="image/*"
                placeholder="Drag & drop student photo here"
                label="Student Photo"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Enroll in Course(s)</label>
            <div className={styles.courseSelectGrid}>
              {courses.length === 0 ? (
                <span className={styles.noneText}>No courses available. Seeding default courses...</span>
              ) : (
                courses.map((course) => (
                  <label key={course.id} className={styles.courseCheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(course.id)}
                      onChange={() => handleCourseToggle(course.id)}
                    />
                    <span>{course.title} (₹{Number(course.feeAmount).toFixed(2)})</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={styles.submitButton}
            >
              {isPending ? "Registering..." : "Register Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
