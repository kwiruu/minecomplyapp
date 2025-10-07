import { apiGet, apiPost } from "./api";

// Shapes mirror backend responses
export type ComplianceMe = {
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
  };
  organizations: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  assignments: Array<{
    id: string;
    role: string;
    project: {
      id: string;
      name: string;
      organization: { id: string; name: string };
    };
  }>;
  projects: Array<{
    id: string;
    name: string;
    organization: { id: string; name: string };
    _count: { submissions: number; conditions: number };
  }>;
};

export type ProjectList = { projects: ComplianceMe["projects"] };

export type CreateSubmissionPayload = {
  title: string;
  summary?: string;
  reportingFrom?: string;
  reportingTo?: string;
};

export function getMe() {
  return apiGet<ComplianceMe>("/compliance/me");
}

export function listProjects() {
  return apiGet<ProjectList>("/compliance/projects");
}

export function getProjectConditions(projectId: string) {
  return apiGet<{ project: any; conditions: any[] }>(
    `/compliance/projects/${projectId}/conditions`
  );
}

export function listProjectSubmissions(projectId: string) {
  return apiGet<{ project: any; submissions: any[] }>(
    `/compliance/projects/${projectId}/submissions`
  );
}

export function createSubmission(
  projectId: string,
  payload: CreateSubmissionPayload
) {
  return apiPost<any>(`/compliance/projects/${projectId}/submissions`, payload);
}

export function getSubmission(submissionId: string) {
  return apiGet<any>(`/compliance/submissions/${submissionId}`);
}

export function listSubmissionRecords(submissionId: string) {
  return apiGet<{ submission: any; records: any[] }>(
    `/compliance/submissions/${submissionId}/records`
  );
}

export function addComplianceRecord(submissionId: string, payload: any) {
  return apiPost<any>(
    `/compliance/submissions/${submissionId}/records`,
    payload
  );
}
