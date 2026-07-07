"use client";

import React, { useState, useEffect, useTransition } from "react";
import Sidebar from "@/components/Sidebar";
import styles from "@/app/staff/page.module.css";
import modalStyles from "@/app/students/page.module.css"; // Reuse modal styling classes
import { useRouter } from "next/navigation";
import { 
  createStaffMember, 
  updateStaffMember, 
  createTeacherLeave, 
  approveTeacherLeave 
} from "@/app/staff/actions";
import DragDropUpload from "@/components/DragDropUpload";

interface UnifiedMember {
  id: string;
  teacherId: string | null;
  email: string;
  name: string;
  phone: string;
  role: string;
  permissions: any;
  active: boolean;
  branchId: string | null;
  hasLogin: boolean;
  // Teacher specific fields
  qualification: string | null;
  specialization: string | null;
  franchise: string | null;
  joiningDate: Date | string | null;
  employmentType: string | null;
  photoUrl: string | null;
  address: string | null;
  batches: any[];
  leaves: any[];
}

interface Leave {
  id: string;
  teacherId: string;
  startDate: Date | string;
  endDate: Date | string;
  reason: string;
  status: string;
  substituteTeacherId: string | null;
  createdAt: Date | string;
  teacher: {
    name: string;
  };
}

interface Branch {
  id: string;
  name: string;
}

interface StaffManagerClientProps {
  initialMembers: UnifiedMember[];
  initialLeaves: Leave[];
  branches: Branch[];
  errorMsg?: string;
}

const MODULES = [
  { key: "leads", label: "Lead Manager" },
  { key: "students", label: "Student Manager" },
  { key: "academics", label: "Academics Manager" },
  { key: "exams", label: "Exam Manager" },
  { key: "users", label: "Staff Manager" }
];

export default function StaffManagerClient({
  initialMembers,
  initialLeaves,
  branches,
  errorMsg,
}: StaffManagerClientProps) {
  const [activeTab, setActiveTab] = useState("roster");
  const [members] = useState<UnifiedMember[]>(initialMembers);
  const [leaves] = useState<Leave[]>(initialLeaves);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isSubOpen, setIsSubOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<UnifiedMember | null>(null);

  // Form states - Member
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("STAFF");
  const [branchId, setBranchId] = useState("");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(true);
  const [enableLogin, setEnableLogin] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, string>>({
    leads: "NONE",
    students: "NONE",
    academics: "NONE",
    exams: "NONE",
    users: "NONE"
  });

  // Conditional Teacher-specific form states
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [franchise, setFranchise] = useState("Amritsar Branch");
  const [employmentType, setEmploymentType] = useState("FULL_TIME");
  const [address, setAddress] = useState("");
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

  // Load default branch if branches exist
  useEffect(() => {
    if (branches.length > 0 && !branchId) {
      setBranchId(branches[0].id);
    }
  }, [branches, branchId]);

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
    if (branches.length > 0) setBranchId(branches[0].id);
    setPassword("");
    setEnableLogin(false);
    setPermissions({
      leads: "NONE",
      students: "NONE",
      academics: "NONE",
      exams: "NONE",
      users: "NONE"
    });
    // Teacher states
    setQualification("");
    setSpecialization("");
    setFranchise("Amritsar Branch");
    setEmploymentType("FULL_TIME");
    setAddress("");
    setPhotoUrl("");
    setFormError(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (member: UnifiedMember) => {
    setSelectedMember(member);
    setName(member.name);
    setEmail(member.email);
    setPhone(member.phone || "");
    setRole(member.role);
    setBranchId(member.branchId || (branches.length > 0 ? branches[0].id : ""));
    setActive(member.active);
    setEnableLogin(member.hasLogin);

    // Parse permissions from profile or fallback
    const profilePerms = member.permissions || {};
    const loadedPerms: Record<string, string> = {};
    MODULES.forEach((m) => {
      loadedPerms[m.key] = profilePerms[m.key] || "NONE";
    });
    setPermissions(loadedPerms);

    // Load teacher specific details if teacher
    setQualification(member.qualification || "");
    setSpecialization(member.specialization || "");
    setFranchise(member.franchise || "Amritsar Branch");
    setEmploymentType(member.employmentType || "FULL_TIME");
    setAddress(member.address || "");
    setPhotoUrl(member.photoUrl || "");

    setFormError(null);
    setIsEditOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !email) {
      setFormError("Name and Email are required.");
      return;
    }

    if (enableLogin && (!password || !role)) {
      setFormError("Password and Role are required when login is enabled.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("role", role);
      formData.append("branchId", branchId);
      formData.append("enableLogin", enableLogin ? "true" : "false");
      if (enableLogin) {
        formData.append("password", password);
      }

      // Add teacher fields
      formData.append("qualification", qualification);
      formData.append("specialization", specialization);
      formData.append("franchise", franchise);
      formData.append("employmentType", employmentType);
      formData.append("address", address);
      formData.append("photoUrl", photoUrl);

      const res = await createStaffMember(formData, JSON.stringify(permissions));
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

    if (!selectedMember) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("role", role);
      formData.append("branchId", branchId);
      formData.append("active", active ? "true" : "false");

      // Add teacher fields
      formData.append("qualification", qualification);
      formData.append("specialization", specialization);
      formData.append("franchise", franchise);
      formData.append("employmentType", employmentType);
      formData.append("address", address);
      formData.append("photoUrl", photoUrl);

      const res = await updateStaffMember(selectedMember.id, formData, JSON.stringify(permissions));
      if (res.error) {
        setFormError(res.error);
      } else {
        setIsEditOpen(false);
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

  // Filter Roster list
  const filteredMembers = members.filter((member) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      member.name.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower) ||
      member.phone.toLowerCase().includes(searchLower);
    if (!matchesSearch) return false;

    if (roleFilter !== "ALL" && member.role !== roleFilter) {
      return false;
    }

    if (statusFilter !== "ALL") {
      const isActive = statusFilter === "ACTIVE";
      if (member.active !== isActive) return false;
    }

    return true;
  });

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
      default:
        return styles.roleStaff;
    }
  };

  // Extract all active teachers for leaves substitute assignment
  const activeTeachers = members.filter(m => m.role === "TEACHER" && m.active && m.teacherId);

  return (
    <div className={styles.container}>
      <Sidebar currentPhase={2} />

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1>Staff & Instructor Manager</h1>
            <p>Control staff roles, access privileges, teach roster details, and coordinate substitute leaves.</p>
          </div>
          <div className={styles.headerActions}>
            <button 
              onClick={() => setIsLeaveOpen(true)} 
              className={modalStyles.cancelButton} 
              style={{ borderColor: "var(--outline)" }}
            >
              Request Leave
            </button>
            <button onClick={openCreateModal} className={styles.addBtn}>
              + Onboard Staff
            </button>
          </div>
        </header>

        {errorMsg && (
          <div className={modalStyles.errorAlert} style={{ margin: 0 }}>
            {errorMsg}
          </div>
        )}

        {/* Tab Controls */}
        <div className={styles.tabsContainer}>
          <button
            onClick={() => setActiveTab("roster")}
            className={`${styles.tabButton} ${activeTab === "roster" ? styles.activeTabButton : ""}`}
          >
            <span className="material-symbols-outlined">group</span>
            Team Roster ({filteredMembers.length})
          </button>
          <button
            onClick={() => setActiveTab("leaves")}
            className={`${styles.tabButton} ${activeTab === "leaves" ? styles.activeTabButton : ""}`}
          >
            <span className="material-symbols-outlined">receipt_long</span>
            Leave Requests ({leaves.length})
          </button>
        </div>

        {activeTab === "roster" && (
          <div className={styles.tabContent}>
            {/* Roster Filters Toolbar */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: "240px", display: "flex", background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)", padding: "0.5rem 0.75rem", borderRadius: "var(--radius)", alignItems: "center", gap: "0.5rem" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>search</span>
                <input
                  type="text"
                  placeholder="Search staff by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ background: "transparent", border: "none", outline: "none", width: "100%", fontSize: "0.85rem", color: "var(--foreground)" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <select 
                  value={roleFilter} 
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={styles.matrixSelect}
                  style={{ height: "38px" }}
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="COUNSELLOR">Counselor</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="STAFF">General Staff</option>
                </select>

                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles.matrixSelect}
                  style={{ height: "38px" }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Roster Table */}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Access Permissions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                        No staff accounts match the current filter parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <tr key={member.id}>
                        <td style={{ fontWeight: "700" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            {member.photoUrl ? (
                              <img src={member.photoUrl} alt={member.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "0.8rem" }}>
                                {member.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                              </div>
                            )}
                            <div>
                              <span>{member.name}</span>
                              {member.role === "TEACHER" && member.specialization && (
                                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "500" }}>
                                  🎓 {member.specialization}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{member.email}</td>
                        <td>{member.phone || <span className={modalStyles.noneText}>None</span>}</td>
                        <td>
                          <span className={`${styles.roleBadge} ${getRoleClass(member.role)}`}>
                            {member.role}
                          </span>
                        </td>
                        <td>
                          {member.hasLogin ? (
                            <div className={styles.permissionsSummary}>
                              {MODULES.map((m) => {
                                const level = member.permissions?.[m.key] || "NONE";
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
                              {(!member.permissions || Object.values(member.permissions).every(v => v === "NONE")) && (
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                                  No Module Access
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                              Credentials Disabled
                            </span>
                          )}
                        </td>
                        <td>
                          {member.active ? (
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
                          <button onClick={() => openEditModal(member)} className={styles.editBtn}>
                            Edit Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "leaves" && (
          <div className={styles.subGrid}>
            {/* Leave Requests Roster */}
            <div className={styles.leaveTableWrapper}>
              <h2 className={styles.sectionHeader}>Staff Leave Requests</h2>
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
                        No leave logs requested in the current cycle.
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

            {/* Quick Guidance Box */}
            <div className={styles.leaveTableWrapper} style={{ background: "var(--surface-container-lowest)", height: "fit-content" }}>
              <h3 className={styles.sectionHeader}>Leave Guidelines</h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                When a leave request is <strong>Approved</strong>:
              </p>
              <ul style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "0.5rem 0", paddingLeft: "1.25rem", lineHeight: "1.5" }}>
                <li>A substitute teacher can be selected to cover the classes.</li>
                <li>The system automatically triggers notice boards for all active batches assigned to the teacher on leave.</li>
                <li>Notice notifications alert enrolled students about the instructor leave dates and substitute cover.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Create Staff Account Modal */}
        {isCreateOpen && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContent} style={{ maxWidth: "650px", overflowY: "auto", maxHeight: "90vh" }}>
              <div className={modalStyles.modalHeader}>
                <h3>Onboard Staff / Teacher</h3>
                <button onClick={() => setIsCreateOpen(false)} className={modalStyles.closeModalButton}>✕</button>
              </div>

              {formError && <div className={modalStyles.errorAlert}>{formError}</div>}

              <form onSubmit={handleCreateSubmit} className={modalStyles.form}>
                {/* General Info */}
                <h4 style={{ margin: "0.5rem 0", color: "var(--primary)", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.25rem" }}>
                  1. General Information
                </h4>
                <div className={modalStyles.formGroupDouble}>
                  <div className={modalStyles.formGroup}>
                    <label>Full Name *</label>
                    <input 
                      type="text" required value={name} onChange={(e) => setName(e.target.value)} 
                      placeholder="e.g. John Doe" className={modalStyles.modalInput} 
                    />
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className={modalStyles.modalSelect}>
                      <option value="ADMIN">ADMIN</option>
                      <option value="COUNSELLOR">COUNSELLOR</option>
                      <option value="TEACHER">TEACHER</option>
                      <option value="RECEPTIONIST">RECEPTIONIST</option>
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
                    <label>Phone Number</label>
                    <input 
                      type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} 
                      placeholder="e.g. +91 99999 88888" className={modalStyles.modalInput} 
                    />
                  </div>
                </div>

                <div className={modalStyles.formGroupDouble}>
                  <div className={modalStyles.formGroup}>
                    <label>Branch Association</label>
                    <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={modalStyles.modalSelect}>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.25rem" }}>
                    <input
                      id="enable-login-toggle"
                      type="checkbox"
                      checked={enableLogin}
                      onChange={(e) => setEnableLogin(e.target.checked)}
                      style={{ width: "1.1rem", height: "1.1rem", cursor: "pointer" }}
                    />
                    <label htmlFor="enable-login-toggle" style={{ fontWeight: "700", cursor: "pointer", fontSize: "0.85rem" }}>
                      Enable Login Credentials
                    </label>
                  </div>
                </div>

                {/* Login Credentials & Permissions section */}
                {enableLogin && (
                  <>
                    <h4 style={{ margin: "1.25rem 0 0.5rem 0", color: "var(--primary)", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.25rem" }}>
                      2. Authentication & Access Matrix
                    </h4>
                    <div className={modalStyles.formGroup}>
                      <label>Password *</label>
                      <input 
                        type="password" required={enableLogin} value={password} onChange={(e) => setPassword(e.target.value)} 
                        placeholder="••••••••" className={modalStyles.modalInput} 
                      />
                    </div>
                    <div className={modalStyles.formGroup}>
                      <label>Module Access Matrix</label>
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
                  </>
                )}

                {/* Teacher specific Details section */}
                {role === "TEACHER" && (
                  <>
                    <h4 style={{ margin: "1.25rem 0 0.5rem 0", color: "var(--primary)", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.25rem" }}>
                      {enableLogin ? "3." : "2."} Teacher Professional Details
                    </h4>
                    
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Franchise Location *</label>
                        <input 
                          type="text" required value={franchise} onChange={(e) => setFranchise(e.target.value)} 
                          placeholder="e.g. Amritsar Campus" className={modalStyles.modalInput} 
                        />
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Employment Type</label>
                        <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className={modalStyles.modalSelect}>
                          <option value="FULL_TIME">Full Time</option>
                          <option value="PART_TIME">Part Time</option>
                          <option value="VISITING">Visiting Faculty</option>
                        </select>
                      </div>
                    </div>

                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Qualification / Degree</label>
                        <input 
                          type="text" value={qualification} onChange={(e) => setQualification(e.target.value)} 
                          placeholder="e.g. M.A. in English, CELTA" className={modalStyles.modalInput} 
                        />
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Specialization (Course Area)</label>
                        <input 
                          type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} 
                          placeholder="e.g. IELTS Writing Academic" className={modalStyles.modalInput} 
                        />
                      </div>
                    </div>

                    <div className={modalStyles.formGroup}>
                      <label>Profile Picture URL</label>
                      <input 
                        type="text" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} 
                        placeholder="Paste image URL or use drag & drop below" className={modalStyles.modalInput} 
                        style={{ marginBottom: "0.5rem" }}
                      />
                      <DragDropUpload 
                        value={photoUrl} 
                        onChange={setPhotoUrl} 
                        accept="image/*"
                        placeholder="Drag & drop teacher photo, or click to browse"
                      />
                    </div>

                    <div className={modalStyles.formGroup}>
                      <label>Home Address</label>
                      <textarea 
                        value={address} onChange={(e) => setAddress(e.target.value)} 
                        placeholder="Enter teacher's physical residential address..." 
                        className={modalStyles.modalInput} 
                        rows={2}
                      />
                    </div>
                  </>
                )}

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
                    {isPending ? "Onboarding..." : "Onboard Staff"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Staff Account / Permissions Modal */}
        {isEditOpen && selectedMember && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContent} style={{ maxWidth: "650px", overflowY: "auto", maxHeight: "90vh" }}>
              <div className={modalStyles.modalHeader}>
                <h3>Edit Staff Account: {selectedMember.email}</h3>
                <button onClick={() => setIsEditOpen(false)} className={modalStyles.closeModalButton}>✕</button>
              </div>

              {formError && <div className={modalStyles.errorAlert}>{formError}</div>}

              <form onSubmit={handleEditSubmit} className={modalStyles.form}>
                <h4 style={{ margin: "0.5rem 0", color: "var(--primary)", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.25rem" }}>
                  1. General Information
                </h4>
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
                  <label>Branch Association</label>
                  <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={modalStyles.modalSelect}>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Login permissions (if they have login profile) */}
                {enableLogin && (
                  <>
                    <h4 style={{ margin: "1.25rem 0 0.5rem 0", color: "var(--primary)", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.25rem" }}>
                      2. Module Access Matrix
                    </h4>
                    <div className={modalStyles.formGroup}>
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
                  </>
                )}

                {/* Teacher specific fields */}
                {role === "TEACHER" && (
                  <>
                    <h4 style={{ margin: "1.25rem 0 0.5rem 0", color: "var(--primary)", borderBottom: "1px solid var(--outline-variant)", paddingBottom: "0.25rem" }}>
                      {enableLogin ? "3." : "2."} Teacher Professional Details
                    </h4>
                    
                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Franchise Location *</label>
                        <input 
                          type="text" required value={franchise} onChange={(e) => setFranchise(e.target.value)} 
                          className={modalStyles.modalInput} 
                        />
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Employment Type</label>
                        <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className={modalStyles.modalSelect}>
                          <option value="FULL_TIME">Full Time</option>
                          <option value="PART_TIME">Part Time</option>
                          <option value="VISITING">Visiting Faculty</option>
                        </select>
                      </div>
                    </div>

                    <div className={modalStyles.formGroupDouble}>
                      <div className={modalStyles.formGroup}>
                        <label>Qualification / Degree</label>
                        <input 
                          type="text" value={qualification} onChange={(e) => setQualification(e.target.value)} 
                          className={modalStyles.modalInput} 
                        />
                      </div>
                      <div className={modalStyles.formGroup}>
                        <label>Specialization (Course Area)</label>
                        <input 
                          type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} 
                          className={modalStyles.modalInput} 
                        />
                      </div>
                    </div>

                    <div className={modalStyles.formGroup}>
                      <label>Profile Picture URL</label>
                      <input 
                        type="text" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} 
                        className={modalStyles.modalInput} 
                        style={{ marginBottom: "0.5rem" }}
                      />
                      <DragDropUpload 
                        value={photoUrl} 
                        onChange={setPhotoUrl} 
                        accept="image/*"
                      />
                    </div>

                    <div className={modalStyles.formGroup}>
                      <label>Home Address</label>
                      <textarea 
                        value={address} onChange={(e) => setAddress(e.target.value)} 
                        className={modalStyles.modalInput} 
                        rows={2}
                      />
                    </div>
                  </>
                )}

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

        {/* Request Leave Modal */}
        {isLeaveOpen && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContent} style={{ maxWidth: "500px" }}>
              <div className={modalStyles.modalHeader}>
                <h3>Request Teacher Leave</h3>
                <button onClick={() => setIsLeaveOpen(false)} className={modalStyles.closeModalButton}>✕</button>
              </div>

              {formError && <div className={modalStyles.errorAlert}>{formError}</div>}

              <form onSubmit={handleRequestLeave} className={modalStyles.form}>
                <div className={modalStyles.formGroup}>
                  <label>Select Teacher *</label>
                  <select 
                    value={leaveTeacherId} 
                    onChange={(e) => setLeaveTeacherId(e.target.value)} 
                    className={modalStyles.modalSelect}
                    required
                  >
                    <option value="">-- Choose Instructor --</option>
                    {members.filter(m => m.role === "TEACHER" && m.teacherId).map(t => (
                      <option key={t.teacherId} value={t.teacherId!}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className={modalStyles.formGroupDouble}>
                  <div className={modalStyles.formGroup}>
                    <label>Start Date *</label>
                    <input 
                      type="date" required value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} 
                      className={modalStyles.modalInput} 
                    />
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>End Date *</label>
                    <input 
                      type="date" required value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} 
                      className={modalStyles.modalInput} 
                    />
                  </div>
                </div>

                <div className={modalStyles.formGroup}>
                  <label>Reason *</label>
                  <textarea 
                    required value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} 
                    placeholder="Enter leave reason..." className={modalStyles.modalInput} 
                    rows={3}
                  />
                </div>

                <div className={modalStyles.modalFooter}>
                  <button 
                    type="button" onClick={() => setIsLeaveOpen(false)} 
                    className={modalStyles.cancelButton} disabled={isPending}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" className={modalStyles.submitButton} disabled={isPending}
                  >
                    {isPending ? "Submitting..." : "Submit Leave Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Substitute Teacher Selection Modal (for Leave Approval) */}
        {isSubOpen && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContent} style={{ maxWidth: "450px" }}>
              <div className={modalStyles.modalHeader}>
                <h3>Select Substitute Cover</h3>
                <button onClick={() => setIsSubOpen(false)} className={modalStyles.closeModalButton}>✕</button>
              </div>

              <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Choose an active teacher who will conduct classes for this batch during the approved leave period.
              </div>

              <div className={modalStyles.formGroup}>
                <label>Substitute Teacher</label>
                <select 
                  value={subTeacherId} 
                  onChange={(e) => setSubTeacherId(e.target.value)} 
                  className={modalStyles.modalSelect}
                >
                  <option value="">-- No Substitute / Cancel Class --</option>
                  {activeTeachers.map(t => (
                    <option key={t.teacherId} value={t.teacherId!}>{t.name} ({t.specialization || "English"})</option>
                  ))}
                </select>
              </div>

              <div className={modalStyles.modalFooter}>
                <button 
                  type="button" onClick={() => setIsSubOpen(false)} 
                  className={modalStyles.cancelButton} disabled={isPending}
                >
                  Cancel
                </button>
                <button 
                  onClick={submitApproveLeave} 
                  className={modalStyles.submitButton} disabled={isPending}
                >
                  {isPending ? "Approving..." : "Approve & Generate Notice"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
