export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IncidentCreateDTO {
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  category: "HMS" | "LEVERANSE" | "TEKNISK" | "KUNDE" | "INTERN_PROSESS";
  severity: "LAV" | "MIDDELS" | "HØY" | "KRITISK";
  assigneeUserId?: string | null;
  measures?: string | null;
  dueDate?: string | null; // YYYY-MM-DD
}

export interface IncidentUpdateDTO {
  title?: string;
  description?: string;
  date?: string; // YYYY-MM-DD
  category?: "HMS" | "LEVERANSE" | "TEKNISK" | "KUNDE" | "INTERN_PROSESS";
  severity?: "LAV" | "MIDDELS" | "HØY" | "KRITISK";
  assigneeUserId?: string | null;
  measures?: string | null;
  status?: "ÅPEN" | "PÅGÅR" | "LUKKET" | "AVVIST";
  dueDate?: string | null; // YYYY-MM-DD
  closedAt?: string | null; // ISO date
}

export interface IncidentListQuery {
  q?: string;
  status?: "ÅPEN" | "PÅGÅR" | "LUKKET" | "AVVIST";
  category?: "HMS" | "LEVERANSE" | "TEKNISK" | "KUNDE" | "INTERN_PROSESS";
  severity?: "LAV" | "MIDDELS" | "HØY" | "KRITISK";
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  page?: number; // 1-based
  pageSize?: number; // default 20
}

