"use client";

import React, { useState, useRef } from "react";
import styles from "./DragDropUpload.module.css";

interface DragDropUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  placeholder?: string;
  label?: string;
}

export default function DragDropUpload({
  value,
  onChange,
  accept = "image/*,application/pdf",
  placeholder = "Drag & drop your file here, or click to browse",
  label,
}: DragDropUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to upload file");
      }

      onChange(data.url);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "File upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await uploadFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadFile(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isPdf = value.toLowerCase().endsWith(".pdf") || value.includes("/uploads/") && value.toLowerCase().includes("pdf");
  const isImage = !isPdf && (accept.includes("image") || value.match(/\.(jpg|jpeg|png|webp|gif)/i));

  return (
    <div className={styles.container}>
      {label && <label className={styles.fieldLabel}>{label}</label>}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className={styles.hiddenInput}
      />

      {value ? (
        <div className={styles.previewContainer}>
          {isImage ? (
            <img src={value} alt="Preview" className={styles.previewImage} />
          ) : (
            <div className={styles.filePreviewBlock}>
              <span className="material-symbols-outlined" style={{ fontSize: "2.5rem", color: "var(--primary)" }}>
                description
              </span>
              <span className={styles.fileName}>
                {value.split("/").pop()?.substring(14) || "Uploaded Document"}
              </span>
            </div>
          )}
          <button type="button" onClick={handleRemove} className={styles.removeBtn} aria-label="Remove File">
            <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>
              close
            </span>
          </button>
        </div>
      ) : (
        <div
          className={`${styles.uploadZone} ${isDragActive ? styles.uploadZoneActive : ""} ${
            error ? styles.uploadZoneError : ""
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          {uploading ? (
            <div className={styles.statusBlock}>
              <div className={styles.spinner} />
              <span>Uploading file...</span>
            </div>
          ) : (
            <div className={styles.statusBlock}>
              <span className={`material-symbols-outlined ${styles.uploadIcon}`}>cloud_upload</span>
              <span className={styles.placeholderText}>{placeholder}</span>
              <span className={styles.browseText}>or Click to browse</span>
            </div>
          )}

          {error && <span className={styles.errorText}>{error}</span>}
        </div>
      )}
    </div>
  );
}
