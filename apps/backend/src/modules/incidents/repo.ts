import { getDb } from "../../core/db";
import type { Incident } from "@shared/models";
import type { IncidentCreateDTO, IncidentUpdateDTO } from "@shared/types";

export interface IncidentListFilters {
  q?: string;
  status?: string;
  category?: string;
  severity?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export async function listIncidents(filters: IncidentListFilters) {
  const db = getDb();
  const where: string[] = [];
  const params: any[] = [];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    where.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }
  if (filters.status) {
    params.push(filters.status);
    where.push(`status = $${params.length}`);
  }
  if (filters.category) {
    params.push(filters.category);
    where.push(`category = $${params.length}`);
  }
  if (filters.severity) {
    params.push(filters.severity);
    where.push(`severity = $${params.length}`);
  }
  if (filters.from) {
    params.push(filters.from);
    where.push(`date >= $${params.length}`);
  }
  if (filters.to) {
    params.push(filters.to);
    where.push(`date <= $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  const listSql = `SELECT * FROM incidents ${whereSql} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${
    params.length + 2
  }`;
  const countSql = `SELECT COUNT(*)::int AS count FROM incidents ${whereSql}`;

  const listParams = [...params, limit, offset];

  const [list, count] = await Promise.all([
    db.query(listSql, listParams),
    db.query(countSql, params),
  ]);

  return { items: list.rows as Incident[], total: (count.rows[0]?.count as number) ?? 0 };
}

export async function getIncident(id: string) {
  const db = getDb();
  const res = await db.query("SELECT * FROM incidents WHERE id = $1", [id]);
  return res.rows[0] as Incident | undefined;
}

export async function createIncident(input: IncidentCreateDTO & { createdBy: string }) {
  const db = getDb();
  const res = await db.query(
    `INSERT INTO incidents (title, description, date, category, severity, assignee_user_id, measures, status, due_date, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'ÅPEN',$8,$9)
     RETURNING *`,
    [
      input.title,
      input.description,
      input.date,
      input.category,
      input.severity,
      input.assigneeUserId ?? null,
      input.measures ?? null,
      input.dueDate ?? null,
      input.createdBy,
    ]
  );
  return res.rows[0] as Incident;
}

export async function updateIncident(id: string, input: IncidentUpdateDTO, changedBy: string) {
  const db = getDb();
  const before = await getIncident(id);
  if (!before) return undefined;

  const fields: string[] = [];
  const values: any[] = [];
  const entries = Object.entries(input).filter(([_, v]) => v !== undefined);
  for (const [key, value] of entries) {
    fields.push(`${key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)} = $${fields.length + 1}`);
    values.push(value);
  }
  if (!fields.length) return before;

  values.push(id);
  const sql = `UPDATE incidents SET ${fields.join(", ")}, updated_at = now() WHERE id = $${values.length} RETURNING *`;
  const res = await db.query(sql, values);
  const after = res.rows[0] as Incident;

  // history per field
  const historyRows: Array<{ field: string; oldValue: string | null; newValue: string | null }> = [];
  for (const [key, value] of entries) {
    const k = key as keyof Incident;
    const oldVal = (before as any)[k];
    const newVal = (after as any)[k];
    if (oldVal !== newVal) {
      historyRows.push({ field: key, oldValue: oldVal?.toString() ?? null, newValue: newVal?.toString() ?? null });
    }
  }
  if (historyRows.length) {
    const valuesFlat: any[] = [];
    const placeholders: string[] = [];
    historyRows.forEach((h, idx) => {
      const base = idx * 5;
      placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
      valuesFlat.push(id, h.field, h.oldValue, h.newValue, changedBy);
    });
    await db.query(
      `INSERT INTO incident_history (incident_id, field, old_value, new_value, changed_by) VALUES ${placeholders.join(",")}`,
      valuesFlat
    );
  }
  return after;
}

export async function listComments(incidentId: string) {
  const db = getDb();
  const res = await db.query(
    `SELECT c.* FROM incident_comments c WHERE c.incident_id = $1 ORDER BY c.created_at ASC`,
    [incidentId]
  );
  return res.rows as { id: string; user_id: string; body: string; created_at: string }[];
}

export async function addComment(incidentId: string, userId: string, body: string) {
  const db = getDb();
  const res = await db.query(
    `INSERT INTO incident_comments (incident_id, user_id, body) VALUES ($1,$2,$3) RETURNING *`,
    [incidentId, userId, body]
  );
  return res.rows[0];
}
