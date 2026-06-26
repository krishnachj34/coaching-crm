"use client";

import React, { useState, useTransition } from "react";
import Sidebar from "@/components/Sidebar";
import styles from "@/app/user-manager/page.module.css";
import modalStyles from "@/app/students/page.module.css"; // Reuse modal styling classes
import { useRouter } from "next/navigation";
import { createStaffProfile, updateStaffPermissions } from "@/app/user-manager/actions";

interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  permissions: any;
  phone: string | null;
  active: boolean;
  createdAt: Date;
}

interface UserManagerClientProps {
  initialProfiles: Profile[];
  errorMsg?: string;
}

const MODULES = [
  { key: "leads", label: "Lead Manager" },
  { key: "students", label: "Student Manager" },
  { key: "academics", label: "Academics Manager" },
  { key: "teachers", label: "Teacher Manager" },
  { key: "library", label: "Library Manager" },
  { key: "exams", label: "Exam Manager" },
  { key: "users", label: "User Manager" }
];

export default function UserManagerClient({ initialProfiles, errorMsg }: UserManagerClientProps) {
  const [profiles] = useState<Profile[]>(initialProfiles);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("STAFF");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(true);
  const [permissions, setPermissions] = useState<Record<string, string>>({
    leads: "NONE",
    students: "NONE",
    academics: "NONE",
    teachers: "NONE",
    library: "NONE",
    exams: "NONE",
    users: "NONE"
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handlePermissionChange = (moduleKey: string, value: string) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleKey]: value
    }));
  };

  const openCreateModal = () => {
    setName("");
    setEmail("");
    setPhone("");
    setRole("STAFF");
    setPassword("");
    setPermissions({
      leads: "NONE",
      students: "NONE",
      academics: "NONE",
      teachers: "NONE",
      library: "NONE",
      exams: "NONE",
      users: "NONE"
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (profile: Profile) => {
    setSelectedProfile(profile);
    setName(profile.name || "");
    setEmail(profile.email);
    setPhone(profile.phone || "");
    setRole(profile.role);
    setActive(profile.active);
    
    // Parse permissions from profile or fallback
    const profilePerms = profile.permissions || {};
    const loadedPerms: Record<string, string> = {};
    MODULES.forEach((m) => {
      loadedPerms[m.key] = profilePerms[m.key] || "NONE";
    });
    setPermissions(loadedPerms);
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !email || !password || !role) {
      setFormError("All required fields (*) must be filled.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("role", role);
      formData.append("password", password);

      const res = await createStaffProfile(formData, JSON.stringify(permissions));
      if (res.error) {
        setFormError(res.error);
      } else {
        setIsCreateOpen(false);
        router.refresh();
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedProfile) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("role", role);
      formData.append("active", active ? "true" : "false");

      const res = await updateStaffPermissions(selectedProfile.id, formData, JSON.stringify(permissions));
      if (res.error) {
        setFormError(res.error);
      } else {
        setIsEditOpen(false);
        router.refresh();
      }
    });
  };

  const getRoleClass = (roleName: string) => {
    switch (roleName) {
      case "SUPER_ADMIN":
      case "ADMIN":
        return styles.roleAdmin;
      case "COUNSELLOR":
        return styles.roleCounsellor;
      case "TEACHER":
        return styles.roleTeacher;
      case "RECEPTIONIST":
        return styles.roleReceptionist;
      case "LIBRARIAN":
        return styles.roleLibrarian;
      default:
        return styles.roleStaff;
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar currentPhase={2} />

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1>User Manager</h1>
            <p>Control staff roles, access privileges, and module-level permission matrices.</p>
          </div>
          <button onClick={openCreateModal} className={styles.addBtn}>
            + Create Staff Account
          </button>
        </header>

        {errorMsg && (
          <div className={modalStyles.errorAlert} style={{ margin: 0 }}>
            {errorMsg}
          </div>
        )}

        {/* Staff Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                    No staff accounts found. Create one to get started.
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td style={{ fontWeight: "700" }}>{profile.name || "N/A"}</td>
                    <td>{profile.email}</td>
                    <td>{profile.phone || <span className={modalStyles.noneText}>None</span>}</td>
                    <td>
                      <span className={`${styles.roleBadge} ${getRoleClass(profile.role)}`}>
                        {profile.role}
                      </span>
                    </td>
                    <td>
                      <div className={styles.permissionsSummary}>
                        {MODULES.map((m) => {
                          const level = profile.permissions?.[m.key] || "NONE";
                          if (level === "NONE") return null;
                          return (
                            <span 
                              key={m.key} 
                              className={`${styles.summaryBadge} ${level === "EDIT" ? styles.summaryBadgeEdit : ""}`}
                            >
                              {m.label.split(" ")[0]}: {level}
                            </span>
                          );
                        })}
                        {(!profile.permissions || Object.values(profile.permissions).every(v => v === "NONE")) && (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                            No Access
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {profile.active ? (
                        <span className={styles.statusActive}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} /> Active
                        </span>
                      ) : (
                        <span className={styles.statusInactive}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} /> Inactive
                        </span>
                      )}
                    </td>
                    <td>
                      <button onClick={() => openEditModal(profile)} className={styles.editBtn}>
                        Edit Permissions
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create Staff Account Modal */}
        {isCreateOpen && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContent} style={{ maxWidth: "600px" }}>
              <div className={modalStyles.modalHeader}>
                <h3>Create Staff Account</h3>
                <button onClick={() => setIsCreateOpen(false)} className={modalStyles.closeModalButton}>✕</button>
              </div>

              {formError && <div className={modalStyles.errorAlert}>{formError}</div>}

              <form onSubmit={handleCreateSubmit} className={modalStyles.form}>
                <div className={modalStyles.formGroupDouble}>
                  <div className={modalStyles.formGroup}>
                    <label>Full Name *</label>
                    <input 
                      type="text" required value={name} onChange={(e) => setName(e.target.value)} 
                      placeholder="e.g. John Doe" className={modalStyles.modalInput} 
                    />
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Role *</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className={modalStyles.modalSelect}>
                      <option value="ADMIN">ADMIN</option>
                      <option value="COUNSELLOR">COUNSELLOR</option>
                      <option value="TEACHER">TEACHER</option>
                      <option value="RECEPTIONIST">RECEPTIONIST</option>
                      <option value="LIBRARIAN">LIBRARIAN</option>
                      <option value="STAFF">STAFF</option>
                    </select>
                  </div>
                </div>

                <div className={modalStyles.formGroupDouble}>
                  <div className={modalStyles.formGroup}>
                    <label>Email *</label>
                    <input 
                      type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                      placeholder="staff@institute.com" className={modalStyles.modalInput} 
                    />
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Password *</label>
                    <input 
                      type="password" required value={password} onChange={(e) => setPassword(e.target.value)} 
                      placeholder="••••••••" className={modalStyles.modalInput} 
                    />
                  </div>
                </div>

                <div className={modalStyles.formGroup}>
                  <label>Phone Number</label>
                  <input 
                    type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} 
                    placeholder="e.g. +91 99999 88888" className={modalStyles.modalInput} 
                  />
                </div>

                <div className={modalStyles.formGroup}>
                  <label>Module Permissions Matrix</label>
                  <div className={styles.matrixGrid}>
                    {MODULES.map((m) => (
                      <div key={m.key} className={styles.matrixItem}>
                        <label>{m.label}</label>
                        <select 
                          value={permissions[m.key]} 
                          onChange={(e) => handlePermissionChange(m.key, e.target.value)}
                          className={styles.matrixSelect}
                        >
                          <option value="NONE">No Access</option>
                          <option value="VIEW">View Only</option>
                          <option value="EDIT">Full Edit</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={modalStyles.modalFooter}>
                  <button 
                    type="button" onClick={() => setIsCreateOpen(false)} 
                    className={modalStyles.cancelButton} disabled={isPending}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" className={modalStyles.submitButton} disabled={isPending}
                  >
                    {isPending ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Staff Account / Permissions Modal */}
        {isEditOpen && selectedProfile && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContent} style={{ maxWidth: "600px" }}>
              <div className={modalStyles.modalHeader}>
                <h3>Edit Staff Account: {selectedProfile.email}</h3>
                <button onClick={() => setIsEditOpen(false)} className={modalStyles.closeModalButton}>✕</button>
              </div>

              {formError && <div className={modalStyles.errorAlert}>{formError}</div>}

              <form onSubmit={handleEditSubmit} className={modalStyles.form}>
                <div className={modalStyles.formGroupDouble}>
                  <div className={modalStyles.formGroup}>
                    <label>Full Name *</label>
                    <input 
                      type="text" required value={name} onChange={(e) => setName(e.target.value)} 
                      className={modalStyles.modalInput} 
                    />
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Role *</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className={modalStyles.modalSelect}>
                      <option value="ADMIN">ADMIN</option>
                      <option value="COUNSELLOR">COUNSELLOR</option>
                      <option value="TEACHER">TEACHER</option>
                      <option value="RECEPTIONIST">RECEPTIONIST</option>
                      <option value="LIBRARIAN">LIBRARIAN</option>
                      <option value="STAFF">STAFF</option>
                    </select>
                  </div>
                </div>

                <div className={modalStyles.formGroupDouble}>
                  <div className={modalStyles.formGroup}>
                    <label>Phone Number</label>
                    <input 
                      type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} 
                      className={modalStyles.modalInput} 
                    />
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Status</label>
                    <select 
                      value={active ? "true" : "false"} 
                      onChange={(e) => setActive(e.target.value === "true")} 
                      className={modalStyles.modalSelect}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className={modalStyles.formGroup}>
                  <label>Module Permissions Matrix</label>
                  <div className={styles.matrixGrid}>
                    {MODULES.map((m) => (
                      <div key={m.key} className={styles.matrixItem}>
                        <label>{m.label}</label>
                        <select 
                          value={permissions[m.key]} 
                          onChange={(e) => handlePermissionChange(m.key, e.target.value)}
                          className={styles.matrixSelect}
                        >
                          <option value="NONE">No Access</option>
                          <option value="VIEW">View Only</option>
                          <option value="EDIT">Full Edit</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={modalStyles.modalFooter}>
                  <button 
                    type="button" onClick={() => setIsEditOpen(false)} 
                    className={modalStyles.cancelButton} disabled={isPending}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" className={modalStyles.submitButton} disabled={isPending}
                  >
                    {isPending ? "Saving..." : "Save Changes"}
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
