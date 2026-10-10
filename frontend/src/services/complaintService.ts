import { API_BASE_URL, getAuthHeaders } from "./api";
import type { 
  Complaint, 
  ComplaintStats, 
  CreateComplaintInput, 
  AssignWorkerInput, 
  ProgressInput, 
  CompletionReportInput, 
  WorkReport, 
  ComplaintHistory 
} from "../types/complaint";

export async function getComplaints(all = false): Promise<Complaint[]> {
  const url = all ? `${API_BASE_URL}/complaints?all=true` : `${API_BASE_URL}/complaints`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(errorBody || `Failed to fetch complaints (${response.status})`);
  }
  return response.json();
}

export async function getMyComplaints(): Promise<Complaint[]> {
  const response = await fetch(`${API_BASE_URL}/complaints/mine`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(errorBody || `Failed to fetch your complaints (${response.status})`);
  }
  return response.json();
}

export async function getComplaintById(id: number): Promise<Complaint> {
  const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Complaint #${id} not found (${response.status})`);
  }
  return response.json();
}

export async function getComplaintStats(): Promise<ComplaintStats> {
  const response = await fetch(`${API_BASE_URL}/complaints/stats`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch complaint statistics (${response.status})`);
  }
  return response.json();
}

export async function reportComplaint(data: CreateComplaintInput): Promise<Complaint> {
  const response = await fetch(`${API_BASE_URL}/complaints`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(errorBody || `Failed to submit complaint (${response.status})`);
  }

  return response.json();
}

export async function assignComplaint(
  id: number,
  input: AssignWorkerInput | number
): Promise<Complaint> {
  const body = typeof input === "number" ? { workerId: input } : input;
  const response = await fetch(`${API_BASE_URL}/complaints/${id}/assign`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(errorBody || `Failed to assign worker (${response.status})`);
  }

  return response.json();
}

export async function updateComplaintStatus(
  id: number,
  status: string,
  resolutionNotes?: string
): Promise<Complaint> {
  const response = await fetch(`${API_BASE_URL}/complaints/${id}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, resolutionNotes }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(errorBody || `Failed to update status (${response.status})`);
  }

  return response.json();
}

export async function addProgress(
  id: number,
  input: ProgressInput
): Promise<WorkReport> {
  const response = await fetch(`${API_BASE_URL}/complaints/${id}/progress`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(errorBody || `Failed to post progress update (${response.status})`);
  }

  return response.json();
}

export async function submitCompletionReport(
  id: number,
  input: CompletionReportInput
): Promise<WorkReport> {
  const response = await fetch(`${API_BASE_URL}/complaints/${id}/completion-report`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(errorBody || `Failed to submit completion report (${response.status})`);
  }

  return response.json();
}

export async function closeComplaint(id: number): Promise<Complaint> {
  const response = await fetch(`${API_BASE_URL}/complaints/${id}/close`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(errorBody || `Failed to close complaint (${response.status})`);
  }

  return response.json();
}

export async function getComplaintHistory(id: number): Promise<ComplaintHistory[]> {
  const response = await fetch(`${API_BASE_URL}/complaints/${id}/history`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch history for complaint #${id}`);
  }

  return response.json();
}

export async function getComplaintReports(id: number): Promise<WorkReport[]> {
  const response = await fetch(`${API_BASE_URL}/complaints/${id}/reports`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch work reports for complaint #${id}`);
  }

  return response.json();
}

export async function getCompletionReports(decision?: string): Promise<WorkReport[]> {
  const url = decision 
    ? `${API_BASE_URL}/admin/completion-reports?decision=${encodeURIComponent(decision)}`
    : `${API_BASE_URL}/admin/completion-reports`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch completion reports");
  }

  return response.json();
}

export async function approveCompletionReport(id: number, adminComments?: string): Promise<WorkReport> {
  const response = await fetch(`${API_BASE_URL}/completion-reports/${id}/approve`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ adminComments }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(err || "Failed to approve completion report");
  }

  return response.json();
}

export async function rejectCompletionReport(id: number, reason: string): Promise<WorkReport> {
  const response = await fetch(`${API_BASE_URL}/completion-reports/${id}/reject`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(err || "Failed to reject completion report");
  }

  return response.json();
}
