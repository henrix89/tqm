const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api/v1";
const DEV_USER_ID = import.meta.env.VITE_DEV_USER_ID || "";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type Role = "superadmin" | "company_admin" | "manager" | "employee" | "viewer";

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: Role;
  jobTitle: string;
  departmentId: string | null;
  companyId: string;
  reportsToUserId: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthLoginResponse = {
  token: string;
  user: AuthUser;
  mustChangePassword: boolean;
};

export type Department = {
  id: string;
  name: string;
  code?: string;
  companyId: string;
  managerUserId?: string | null;
  isActive: boolean;
};

export type Company = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type IncidentType = {
  id: string;
  name: string;
  slug: string;
  description: string;
  companyId: string;
  isActive: boolean;
};

export type Incident = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  severity: string;
  assignee_user_id?: string | null;
  measures?: string | null;
  status: string;
  due_date?: string | null;
  closed_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  attachmentCount?: number;
};

export type FileAsset = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: string;
};

export type CrmCustomerStatus = "PROSPEKT" | "AKTIV" | "INAKTIV";
export type CrmActivityType = "BESOK" | "TELEFON" | "EPOST" | "MOTE" | "OPPFOLGING";
export type CrmIssueSeverity = "LAV" | "MIDDELS" | "HOY" | "KRITISK";
export type CrmIssueStatus = "APEN" | "PAGAR" | "LUKKET";
export type CrmResponsibilityScope = "SALES" | "TECHNICAL" | "ADMIN";

export type CrmResponsibilityAssignment = {
  scope: CrmResponsibilityScope;
  departmentId: string | null;
  userIds: string[];
};

export type CrmCustomer = {
  id: string;
  name: string;
  organizationNumber: string;
  industry: string;
  status: CrmCustomerStatus;
  address: string;
  website: string;
  notes: string;
  ownerUserId: string;
  companyId: string;
  departmentId: string | null;
  sharedWithUserIds: string[];
  responsibilityAssignments: CrmResponsibilityAssignment[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CrmContact = {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CrmActivity = {
  id: string;
  customerId: string;
  contactId: string | null;
  type: CrmActivityType;
  date: string;
  summary: string;
  details: string;
  ownerUserId: string;
  notificationScope?: CrmResponsibilityScope | null;
  createdAt: string;
  updatedAt: string;
};

export type CrmNote = {
  id: string;
  customerId: string;
  body: string;
  authorUserId: string;
  notificationScope?: CrmResponsibilityScope | null;
  createdAt: string;
  updatedAt: string;
};

export type CrmIssue = {
  id: string;
  customerId: string;
  title: string;
  description: string;
  category: string;
  severity: CrmIssueSeverity;
  status: CrmIssueStatus;
  dueDate?: string | null;
  ownerUserId?: string | null;
  notificationScope?: CrmResponsibilityScope | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationItem = {
  id: string;
  userId: string;
  companyId: string;
  customerId: string;
  scope: CrmResponsibilityScope;
  type: "customer_note" | "customer_activity" | "customer_issue";
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdByUserId: string;
  readAt?: string | null;
  createdAt: string;
};

export type CrmCustomerDetail = {
  customer: CrmCustomer;
  contacts: CrmContact[];
  activities: CrmActivity[];
  notes: CrmNote[];
  issues: CrmIssue[];
  attachments: FileAsset[];
};

export type SurveyStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type SurveyQuestionType = "TEXT" | "SCALE" | "YES_NO";

export type Survey = {
  id: string;
  title: string;
  description: string;
  status: SurveyStatus;
  isAnonymous: boolean;
  companyId: string;
  departmentId: string | null;
  createdBy: string;
  questionCount: number;
  responseCount: number;
  publishedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SurveyQuestion = {
  id: string;
  text: string;
  type: SurveyQuestionType;
  required: boolean;
};

export type SurveyResponse = {
  id: string;
  responderId: string | null;
  answers: { questionId: string; value: string }[];
  submittedAt: string;
};

export type SurveyDetail = Survey & {
  questions: SurveyQuestion[];
  responses: SurveyResponse[];
};

export type InspectionStatus = "PLANNED" | "COMPLETED";
export type FindingSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type FindingStatus = "OPEN" | "IN_PROGRESS" | "DONE";

export type Inspection = {
  id: string;
  title: string;
  location: string;
  departmentId: string | null;
  companyId: string;
  plannedFor: string;
  status: InspectionStatus;
  createdBy: string;
  findingCount: number;
  openFindingCount: number;
  createdAt: string;
  updatedAt: string;
};

export type InspectionFinding = {
  id: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  assigneeUserId: string | null;
  dueDate?: string | null;
  incidentId?: string | null;
};

export type InspectionDetail = Inspection & {
  findings: InspectionFinding[];
};

type RequestOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  } else if (DEV_USER_ID) {
    headers["x-user-id"] = DEV_USER_ID;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }

  return res.json();
}

async function apiBlob(path: string, token?: string | null) {
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (DEV_USER_ID) {
    headers["x-user-id"] = DEV_USER_ID;
  }

  const res = await fetch(`${API_BASE}${path}`, { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }

  return res.blob();
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function mapFilesForUpload(files: File[]) {
  return Promise.all(
    files.map(async (file) => ({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      dataBase64: await fileToBase64(file),
    }))
  );
}

export async function login(email: string, password: string): Promise<AuthLoginResponse> {
  return apiRequest<AuthLoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function changePassword(token: string, currentPassword: string, newPassword: string) {
  return apiRequest<{ token: string; user: AuthUser }>("/auth/change-password", {
    method: "POST",
    token,
    body: { currentPassword, newPassword },
  });
}

export async function getMyProfile(token: string) {
  return apiRequest<AuthUser>("/auth/me", { token });
}

export async function listMyReports(token: string) {
  return apiRequest<{ items: AuthUser[] }>("/auth/me/reports", { token });
}

export async function listUsers(token: string, params: Record<string, unknown> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") qs.append(key, String(value));
  });
  return apiRequest<{ items: AuthUser[] }>(`/users?${qs.toString()}`, { token });
}

export async function createUser(token: string, body: Record<string, unknown>) {
  return apiRequest<AuthUser>("/users", {
    method: "POST",
    token,
    body,
  });
}

export async function updateUser(token: string, userId: string, body: Record<string, unknown>) {
  return apiRequest<AuthUser>(`/users/${userId}`, {
    method: "PATCH",
    token,
    body,
  });
}

export async function deactivateUser(token: string, userId: string) {
  return apiRequest<AuthUser>(`/users/${userId}/deactivate`, {
    method: "POST",
    token,
  });
}

export async function listDepartments(token: string) {
  return apiRequest<{ items: Department[] }>("/departments", { token });
}

export async function listCompanies(token: string) {
  return apiRequest<{ items: Company[] }>("/companies", { token });
}

export async function createCompany(token: string, body: Record<string, unknown>) {
  return apiRequest<Company>("/companies", {
    method: "POST",
    token,
    body,
  });
}

export async function updateCompany(token: string, companyId: string, body: Record<string, unknown>) {
  return apiRequest<Company>(`/companies/${companyId}`, {
    method: "PATCH",
    token,
    body,
  });
}

export async function createDepartment(token: string, body: Record<string, unknown>) {
  return apiRequest<Department>("/departments", {
    method: "POST",
    token,
    body,
  });
}

export async function updateDepartment(token: string, departmentId: string, body: Record<string, unknown>) {
  return apiRequest<Department>(`/departments/${departmentId}`, {
    method: "PATCH",
    token,
    body,
  });
}

export async function listIncidentTypes(token: string, params: Record<string, unknown> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") qs.append(key, String(value));
  });
  return apiRequest<{ items: IncidentType[] }>(`/incident-types?${qs.toString()}`, { token });
}

export async function createIncidentType(token: string, body: Record<string, unknown>) {
  return apiRequest<IncidentType>("/incident-types", {
    method: "POST",
    token,
    body,
  });
}

export async function listIncidents(params: Record<string, unknown> = {}, token?: string | null): Promise<Paginated<Incident>> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
  });
  return apiRequest<Paginated<Incident>>(`/incidents?${qs.toString()}`, { token });
}

export async function createIncident(body: Record<string, unknown>, token?: string | null): Promise<Incident> {
  return apiRequest<Incident>("/incidents", {
    method: "POST",
    token,
    body,
  });
}

export async function listIncidentAttachments(token: string, incidentId: string) {
  return apiRequest<{ items: FileAsset[] }>(`/incidents/${incidentId}/attachments`, { token });
}

export async function uploadIncidentFiles(token: string, incidentId: string, files: File[]) {
  return apiRequest<{ items: FileAsset[] }>(`/incidents/${incidentId}/attachments`, {
    method: "POST",
    token,
    body: { files: await mapFilesForUpload(files) },
  });
}

export async function listCrmCustomers(token: string, params: Record<string, unknown> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") qs.append(key, String(value));
  });
  return apiRequest<{ items: CrmCustomer[] }>(`/crm/customers?${qs.toString()}`, { token });
}

export async function getCrmCustomerDetail(token: string, customerId: string) {
  return apiRequest<CrmCustomerDetail>(`/crm/customers/${customerId}`, { token });
}

export async function listCrmCustomerAttachments(token: string, customerId: string) {
  return apiRequest<{ items: FileAsset[] }>(`/crm/customers/${customerId}/attachments`, { token });
}

export async function createCrmCustomer(token: string, body: Record<string, unknown>) {
  return apiRequest<CrmCustomer>("/crm/customers", {
    method: "POST",
    token,
    body,
  });
}

export async function updateCrmCustomer(token: string, customerId: string, body: Record<string, unknown>) {
  return apiRequest<CrmCustomer>(`/crm/customers/${customerId}`, {
    method: "PATCH",
    token,
    body,
  });
}

export async function createCrmContact(token: string, customerId: string, body: Record<string, unknown>) {
  return apiRequest<CrmContact>(`/crm/customers/${customerId}/contacts`, {
    method: "POST",
    token,
    body,
  });
}

export async function createCrmActivity(token: string, customerId: string, body: Record<string, unknown>) {
  return apiRequest<CrmActivity>(`/crm/customers/${customerId}/activities`, {
    method: "POST",
    token,
    body,
  });
}

export async function createCrmNote(token: string, customerId: string, body: Record<string, unknown>) {
  return apiRequest<CrmNote>(`/crm/customers/${customerId}/notes`, {
    method: "POST",
    token,
    body,
  });
}

export async function createCrmIssue(token: string, customerId: string, body: Record<string, unknown>) {
  return apiRequest<CrmIssue>(`/crm/customers/${customerId}/issues`, {
    method: "POST",
    token,
    body,
  });
}

export async function listNotifications(token: string) {
  return apiRequest<{ items: NotificationItem[]; unreadCount: number }>("/notifications", { token });
}

export async function markNotificationRead(token: string, notificationId: string) {
  return apiRequest<NotificationItem>(`/notifications/${notificationId}/read`, {
    method: "POST",
    token,
  });
}

export async function markAllNotificationsRead(token: string) {
  return apiRequest<{ ok: true }>("/notifications/read-all", {
    method: "POST",
    token,
  });
}

export async function uploadCrmCustomerFiles(token: string, customerId: string, files: File[]) {
  return apiRequest<{ items: FileAsset[] }>(`/crm/customers/${customerId}/attachments`, {
    method: "POST",
    token,
    body: { files: await mapFilesForUpload(files) },
  });
}

export async function downloadFile(token: string, fileId: string) {
  return apiBlob(`/files/${fileId}/content`, token);
}

export async function listSurveys(token: string) {
  return apiRequest<{ items: Survey[] }>("/surveys", { token });
}

export async function createSurvey(token: string, body: Record<string, unknown>) {
  return apiRequest<Survey>("/surveys", {
    method: "POST",
    token,
    body,
  });
}

export async function getSurveyDetail(token: string, surveyId: string) {
  return apiRequest<SurveyDetail>(`/surveys/${surveyId}`, { token });
}

export async function createSurveyQuestion(token: string, surveyId: string, body: Record<string, unknown>) {
  return apiRequest<SurveyQuestion>(`/surveys/${surveyId}/questions`, {
    method: "POST",
    token,
    body,
  });
}

export async function publishSurvey(token: string, surveyId: string) {
  return apiRequest<{ ok: true; status: SurveyStatus; publishedAt?: string | null }>(`/surveys/${surveyId}/publish`, {
    method: "POST",
    token,
  });
}

export async function submitSurveyResponse(token: string, surveyId: string, body: Record<string, unknown>) {
  return apiRequest<{ id: string; submittedAt: string }>(`/surveys/${surveyId}/submit`, {
    method: "POST",
    token,
    body,
  });
}

export async function listInspections(token: string) {
  return apiRequest<{ items: Inspection[] }>("/inspections", { token });
}

export async function createInspection(token: string, body: Record<string, unknown>) {
  return apiRequest<Inspection>("/inspections", {
    method: "POST",
    token,
    body,
  });
}

export async function getInspectionDetail(token: string, inspectionId: string) {
  return apiRequest<InspectionDetail>(`/inspections/${inspectionId}`, { token });
}

export async function createInspectionFinding(token: string, inspectionId: string, body: Record<string, unknown>) {
  return apiRequest<InspectionFinding>(`/inspections/${inspectionId}/findings`, {
    method: "POST",
    token,
    body,
  });
}

export async function createIncidentFromFinding(token: string, findingId: string) {
  return apiRequest<{ incidentId: string }>(`/inspections/findings/${findingId}/create-incident`, {
    method: "POST",
    token,
  });
}
