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
