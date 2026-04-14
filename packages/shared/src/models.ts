import type {
  DocumentCategory,
  FindingSeverity,
  FindingStatus,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
  InspectionStatus,
  SurveyQuestionType,
  SurveyStatus,
  SurveyType,
} from "./enums";
import type { Role } from "./roles";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  departmentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface FileAsset {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  date: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  assigneeUserId: string | null;
  measures: string | null;
  status: IncidentStatus;
  dueDate: string | null;
  closedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentComment {
  id: string;
  incidentId: string;
  userId: string;
  body: string;
  createdAt: string;
}

export interface IncidentHistory {
  id: string;
  incidentId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  changedAt: string;
}

export interface Document {
  id: string;
  title: string;
  category: DocumentCategory;
  currentVersionId: string | null;
  createdBy: string;
  createdAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: string;
  fileId: string;
  createdBy: string;
  createdAt: string;
  notes?: string | null;
}

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  type: SurveyType;
  isAnonymous: boolean;
  status: SurveyStatus;
  createdBy: string;
  createdAt: string;
  publishedAt: string | null;
  closedAt: string | null;
}

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  type: SurveyQuestionType;
  text: string;
  options?: unknown[] | null;
  required: boolean;
  order: number;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  responderId?: string | null;
  submittedAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface SurveyAnswer {
  id: string;
  responseId: string;
  questionId: string;
  value: unknown;
}

export interface ChecklistTemplate {
  id: string;
  title: string;
  createdBy: string;
  createdAt: string;
}

export interface ChecklistTemplateItem {
  id: string;
  templateId: string;
  text: string;
  order: number;
}

export interface InspectionRound {
  id: string;
  title: string;
  departmentId: string | null;
  performedBy: string | null;
  performedAt: string | null;
  status: InspectionStatus;
  createdBy: string;
  createdAt: string;
}

export interface InspectionFinding {
  id: string;
  inspectionId: string;
  templateItemId?: string | null;
  description: string;
  severity: FindingSeverity;
  action: string | null;
  assigneeUserId: string | null;
  status: FindingStatus;
  dueDate: string | null;
  createdBy: string;
  createdAt: string;
  closedAt: string | null;
  incidentId?: string | null;
}

