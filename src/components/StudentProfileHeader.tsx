"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "../app/students/page.module.css";
import StudentModal from "./StudentModal";
import { useRouter } from "next/navigation";

interface StudentProfileHeaderProps {
  student: any;
  batches: any[];
}

export default function StudentProfileHeader({ student, batches }: StudentProfileHeaderProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <header className={styles.pageHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "1.5rem" }}>
        <div className={styles.titleArea}>
          <Link href="/students" className={styles.backButton}>
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
              arrow_back
            </span>
            Back to Students
          </Link>
          <h1 style={{ margin: "0.5rem 0" }}>Student Profile: {student.name}</h1>
          <p>Roll Number: {student.rollNo || <span className={styles.noneText}>Unassigned</span>}</p>
        </div>
        <button
          onClick={() => setIsEditOpen(true)}
          className={styles.addStudentBtn}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "1.2rem" }}>
            edit
          </span>
          Edit Profile
        </button>
      </header>

      <StudentModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
        batches={batches}
        student={student}
      />
    </>
  );
}
