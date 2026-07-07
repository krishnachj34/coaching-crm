"use client";

import React, { useEffect, useState } from "react";
import { getBranches, setActiveBranch, getCurrentBranchContext } from "@/app/branchActions";
import styles from "./BranchSwitcher.module.css";

interface Branch {
  id: string;
  name: string;
  location: string | null;
}

export default function BranchSwitcher() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selected, setSelected] = useState<string>("ALL");
  const [role, setRole] = useState<string>("STAFF");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const context = await getCurrentBranchContext();
        setSelected(context.selectedBranchId);
        setRole(context.role);

        // Fetch active branches
        const branchList = await getBranches();
        
        if (context.role === "ADMIN" || context.role === "SUPER_ADMIN") {
          setBranches(branchList as Branch[]);
        } else {
          // Normal staff only see their assigned branch
          setBranches((branchList as Branch[]).filter((b) => b.id === context.branchId));
        }
      } catch (e) {
        console.error("Error loading branch context:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelected(value);
    await setActiveBranch(value);
    
    // Refresh page to apply new branch filters across all data
    window.location.reload();
  };

  if (loading) {
    return <div className={styles.loading}>Loading franchise context...</div>;
  }

  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  if (!isAdmin) {
    const myBranch = branches.find((b) => b.id === selected);
    return (
      <div className={styles.lockedBranch}>
        <span className="material-symbols-outlined">location_on</span>
        <span className={styles.branchName}>{myBranch ? myBranch.name : "Unassigned Branch"}</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        <span className="material-symbols-outlined">location_on</span>
        <span>Active Franchise</span>
      </label>
      <select value={selected} onChange={handleChange} className={styles.select}>
        <option value="ALL">✨ All Franchises</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            📍 {b.name}
          </option>
        ))}
      </select>
    </div>
  );
}
