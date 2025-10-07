// User roles in the mining compliance system
export type UserRole = "proponent" | "mmt" | "regulator";

// Status of compliance submissions
export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "requires_changes";

// Types of compliance reports
export type ReportType = "CMR" | "CMVR"; // Compliance Monitoring Report, Compliance Monitoring Verification Report

// Evidence/Document types
export type EvidenceType =
  | "photo"
  | "document"
  | "video"
  | "gps_location"
  | "measurement";

// Base user interface
export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  organization?: string;
  createdAt: string;
  updatedAt: string;
}

// Evidence/Media attachment
export interface Evidence {
  id: string;
  submissionId: string;
  type: EvidenceType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  capturedAt: string;
  uploadedAt: string;
}

// Main compliance submission
export interface Submission {
  id: string;
  title: string;
  reportType: ReportType;
  status: SubmissionStatus;
  proponentId: string;
  proponent?: User;
  assignedMMT?: User;
  assignedRegulator?: User;

  // Report content
  description: string;
  complianceChecklist: ComplianceItem[];
  evidence: Evidence[];

  // Dates
  reportingPeriod: {
    startDate: string;
    endDate: string;
  };
  submittedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;

  // Review comments
  mmtComments?: string;
  regulatorComments?: string;

  createdAt: string;
  updatedAt: string;
}

// Individual compliance checklist item
export interface ComplianceItem {
  id: string;
  category: string;
  requirement: string;
  status:
    | "compliant"
    | "non_compliant"
    | "not_applicable"
    | "pending_verification";
  evidence?: string[]; // Evidence IDs
  comments?: string;
  verifiedBy?: string; // MMT/Regulator ID
  verifiedAt?: string;
}

// Dashboard statistics
export interface DashboardStats {
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  overdueSubmissions: number;
}

// Notification/Alert
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  read: boolean;
  createdAt: string;
}
