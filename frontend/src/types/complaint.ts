import type { UserProfile } from "./auth";

export type ComplaintStatus = 
  | 'PENDING' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'AWAITING_VERIFICATION' 
  | 'RESOLVED' 
  | 'CLOSED';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Complaint {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string | null;
  priority: ComplaintPriority | string;
  status: ComplaintStatus;
  user?: UserProfile | null;
  worker?: UserProfile | null;
  adminInstructions?: string | null;
  deadline?: string | null;
  resolutionNotes?: string | null;
  assignedAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ComplaintStats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  awaitingVerification: number;
  resolved: number;
  closed: number;
  pendingVerificationReports?: number;
}

export interface CreateComplaintInput {
  title: string;
  description: string;
  category: string;
  location?: string;
  priority?: string;
}

export interface AssignWorkerInput {
  workerId: number;
  instructions?: string;
  deadline?: string;
}

export interface ProgressInput {
  notes: string;
  materialsUsed?: string;
  remarks?: string;
  proofDetails?: string;
}

export interface CompletionReportInput {
  workDescription: string;
  materialsUsed?: string;
  remarks?: string;
  proofDetails?: string;
}

export interface WorkReport {
  id: number;
  complaint?: Complaint;
  worker?: UserProfile;
  reportType?: 'PROGRESS' | 'COMPLETION' | string;
  workDescription: string;
  materialsUsed?: string | null;
  remarks?: string | null;
  proofDetails?: string | null;
  reviewDecision: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  adminComments?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  complaintId?: number;
  complaintTitle?: string;
  complaintCategory?: string;
  complaintLocation?: string;
  workerName?: string;
  workerPhone?: string;
  workerEmail?: string;
}

export interface ComplaintHistory {
  id: number;
  complaint?: Complaint;
  previousStatus?: string | null;
  newStatus: string;
  changedByUserId?: number | null;
  changedByName?: string | null;
  changedByRole?: string | null;
  action?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  performedByName?: string | null;
  performedByRole?: string | null;
  remarks?: string | null;
  createdAt: string;
}

export interface WorkerWithWorkload {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  village?: string | null;
  role: string;
  active: boolean;
  activeTasks: number;
  totalTasks: number;
}