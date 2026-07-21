export type InstituteId = "STUDY_ABROAD" | "FOREIGN_LANGUAGE" | "ALL";

export interface InstituteMetadata {
  id: InstituteId;
  name: string;
  shortName: string;
  tagline: string;
  badge: string;
  icon: string;
  primaryColor: string;
  gradient: string;
  features: string[];
}

export const INSTITUTES: Record<InstituteId, InstituteMetadata> = {
  STUDY_ABROAD: {
    id: "STUDY_ABROAD",
    name: "Study Abroad Wala",
    shortName: "Study Abroad",
    tagline: "Overseas Education, Visas & Global Admissions Portal",
    badge: "Study Abroad CRM",
    icon: "flight_takeoff",
    primaryColor: "#0ea5e9",
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
    features: ["University Applications", "Visa Tracking", "Target Countries", "Passport & SOP Checklist"],
  },
  FOREIGN_LANGUAGE: {
    id: "FOREIGN_LANGUAGE",
    name: "Foreign Language Wala",
    shortName: "Foreign Language",
    tagline: "Language Coaching, IELTS, German & French Academy",
    badge: "Language CRM",
    icon: "translate",
    primaryColor: "#4f46e5",
    gradient: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
    features: ["Language Batches", "IELTS/Mock Tests", "Live Classes", "Attendance & Scores"],
  },
  ALL: {
    id: "ALL",
    name: "Unified Institute Group",
    shortName: "All Institutes",
    tagline: "Combined Dual Institute Master Management",
    badge: "Global CRM",
    icon: "hub",
    primaryColor: "#8b5cf6",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    features: ["Dual Institute Overview", "Combined Analytics", "Cross-Institute Staffing", "Global Financials"],
  },
};

export interface InstituteContext {
  activeInstituteId: InstituteId;
  metadata: InstituteMetadata;
  isGlobal: boolean;
  role: string;
}
