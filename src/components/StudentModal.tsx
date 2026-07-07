"use client";

import React, { useState, useEffect, useTransition } from "react";
import styles from "../app/students/page.module.css";
import { createStudent } from "@/app/students/actions";
import DragDropUpload from "@/components/DragDropUpload";

interface Category {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
  category?: Category;
}

interface Batch {
  id: string;
  name: string;
  timing: string;
  feeAmount: any;
  subCategory?: SubCategory;
}

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batches: Batch[];
}

export default function StudentModal({ isOpen, onClose, onSuccess, batches }: StudentModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [address, setAddress] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // Linked selection
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");

  // Spreadsheet-specific fields
  const [courseEndDate, setCourseEndDate] = useState("");
  const [installments, setInstallments] = useState("Lumpsump");
  const [feesPaidAmt, setFeesPaidAmt] = useState("");
  const [feesPaidDate, setFeesPaidDate] = useState(() => {
    return new Date().toISOString().substring(0, 10);
  });
  const [feesDueAmt, setFeesDueAmt] = useState("");
  const [feesDueDate, setFeesDueDate] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset SubCategory when Course changes
  useEffect(() => {
    setSelectedSubCategoryId("");
    setSelectedBatchId("");
  }, [selectedCategoryId]);

  // Reset Batch when SubCategory changes
  useEffect(() => {
    setSelectedBatchId("");
  }, [selectedSubCategoryId]);

  if (!isOpen) return null;

  // Extract unique courses (categories)
  const uniqueCoursesMap = new Map<string, Category>();
  batches.forEach((b) => {
    const cat = b.subCategory?.category;
    if (cat) {
      uniqueCoursesMap.set(cat.id, { id: cat.id, name: cat.name });
    }
  });
  const coursesList = Array.from(uniqueCoursesMap.values());

  // Extract unique levels (sub-categories) for the selected Course
  const levelsList = selectedCategoryId
    ? Array.from(
        batches
          .filter((b) => b.subCategory?.category?.id === selectedCategoryId)
          .reduce((map, b) => {
            const sub = b.subCategory;
            if (sub) {
              map.set(sub.id, { id: sub.id, name: sub.name });
            }
            return map;
          }, new Map<string, Category>())
          .values()
      )
    : [];

  // Extract timings (batches) for the selected Level
  const timingsList = selectedSubCategoryId
    ? batches.filter((b) => b.subCategory?.id === selectedSubCategoryId)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !phone) {
      setError("Name and Phone number are required.");
      return;
    }

    if (!selectedBatchId) {
      setError("Please select a Course Level and Batch Timing.");
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
      formData.append("courseEndDate", courseEndDate);
      formData.append("installments", installments);
      formData.append("feesPaidAmt", feesPaidAmt);
      formData.append("feesPaidDate", feesPaidDate);
      formData.append("feesDueAmt", feesDueAmt);
      formData.append("feesDueDate", feesDueDate);

      const res = await createStudent(formData, [selectedBatchId]);

      if (res.error) {
        setError(res.error);
      } else {
        // Reset states
        setName("");
        setEmail("");
        setPhone("");
        setRollNo("");
        setAddress("");
        setParentName("");
        setParentPhone("");
        setPhotoUrl("");
        setSelectedCategoryId("");
        setSelectedSubCategoryId("");
        setSelectedBatchId("");
        setCourseEndDate("");
        setInstallments("Lumpsump");
        setFeesPaidAmt("");
        setFeesPaidDate(new Date().toISOString().substring(0, 10));
        setFeesDueAmt("");
        setFeesDueDate("");
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ maxWidth: "650px", overflowY: "auto", maxHeight: "90vh" }}>
        <div className={styles.modalHeader}>
          <h3>Register New Student</h3>
          <button onClick={onClose} className={styles.closeModalButton}>✕</button>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          
          <h4 style={{ margin: "0.5rem 0", color: "var(--primary)", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.25rem" }}>
            1. Student Information
          </h4>
          <div className={styles.formGroupDouble}>
            <div className={styles.formGroup}>
              <label htmlFor="student-name">Full Name *</label>
              <input
                id="student-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Student Name"
                className={styles.modalInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="student-phone">Contact Number *</label>
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
          </div>

          <div className={styles.formGroupDouble}>
            <div className={styles.formGroup}>
              <label htmlFor="student-rollNo">Roll Number</label>
              <input
                id="student-rollNo"
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="e.g. GER-102"
                className={styles.modalInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="student-email">Email Address</label>
              <input
                id="student-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (Optional)"
                className={styles.modalInput}
              />
            </div>
          </div>

          <h4 style={{ margin: "1.25rem 0 0.5rem 0", color: "var(--primary)", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.25rem" }}>
            2. Course & Batch Enrollment
          </h4>
          <div className={styles.formGroupDouble}>
            <div className={styles.formGroup}>
              <label>Select Course (Subject) *</label>
              <select
                required
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className={styles.modalSelect}
              >
                <option value="">-- Choose Course --</option>
                {coursesList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Select Course Level *</label>
              <select
                required
                disabled={!selectedCategoryId}
                value={selectedSubCategoryId}
                onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                className={styles.modalSelect}
              >
                <option value="">-- Choose Level --</option>
                {levelsList.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroupDouble}>
            <div className={styles.formGroup}>
              <label>Select Batch Timing *</label>
              <select
                required
                disabled={!selectedSubCategoryId}
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className={styles.modalSelect}
              >
                <option value="">-- Choose Timing --</option>
                {timingsList.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.timing})</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Date of Course End (DO Course End)</label>
              <input
                type="date"
                value={courseEndDate}
                onChange={(e) => setCourseEndDate(e.target.value)}
                className={styles.modalInput}
              />
            </div>
          </div>

          <h4 style={{ margin: "1.25rem 0 0.5rem 0", color: "var(--primary)", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.25rem" }}>
            3. Financial & Admission Details
          </h4>
          <div className={styles.formGroupDouble}>
            <div className={styles.formGroup}>
              <label>Fees Paid Amount (₹)</label>
              <input
                type="number"
                placeholder="0.00"
                value={feesPaidAmt}
                onChange={(e) => setFeesPaidAmt(e.target.value)}
                className={styles.modalInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Fees Paid Date</label>
              <input
                type="date"
                value={feesPaidDate}
                onChange={(e) => setFeesPaidDate(e.target.value)}
                className={styles.modalInput}
              />
            </div>
          </div>

          <div className={styles.formGroupDouble}>
            <div className={styles.formGroup}>
              <label>Fees Due Amount (₹)</label>
              <input
                type="number"
                placeholder="0.00"
                value={feesDueAmt}
                onChange={(e) => setFeesDueAmt(e.target.value)}
                className={styles.modalInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Fees Due Date</label>
              <input
                type="date"
                value={feesDueDate}
                onChange={(e) => setFeesDueDate(e.target.value)}
                className={styles.modalInput}
              />
            </div>
          </div>

          <div className={styles.formGroupDouble}>
            <div className={styles.formGroup}>
              <label>Installment Details</label>
              <select
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className={styles.modalSelect}
              >
                <option value="Lumpsump">Lumpsump (Lump sum)</option>
                <option value="Installment 1">Installment 1</option>
                <option value="Installment 2">Installment 2</option>
                <option value="Installments List">Installments List</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Physical Address / Notes</label>
              <input
                type="text"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={styles.modalInput}
              />
            </div>
          </div>

          <h4 style={{ margin: "1.25rem 0 0.5rem 0", color: "var(--primary)", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.25rem" }}>
            4. Parent Contacts & Photo
          </h4>
          <div className={styles.formGroupDouble}>
            <div className={styles.formGroup}>
              <label>Parent/Guardian Name</label>
              <input
                type="text"
                placeholder="Parent Name"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className={styles.modalInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Parent Phone</label>
              <input
                type="tel"
                placeholder="Parent Contact Number"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className={styles.modalInput}
              />
            </div>
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
