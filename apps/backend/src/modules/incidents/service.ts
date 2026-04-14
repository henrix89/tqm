import type { Incident } from "@shared/models";
import type { IncidentCreateDTO, IncidentListQuery, IncidentUpdateDTO, Paginated } from "@shared/types";
import { addComment, createIncident, getIncident, listComments, listIncidents, updateIncident } from "./repo";

export async function serviceListIncidents(q: IncidentListQuery): Promise<Paginated<Incident>> {
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 20;
  const { items, total } = await listIncidents({
    q: q.q,
    status: q.status,
    category: q.category,
    severity: q.severity,
    from: q.from,
    to: q.to,
    page,
    pageSize,
  });
  return { items, total, page, pageSize };
}

export async function serviceGetIncident(id: string) {
  return getIncident(id);
}

export async function serviceCreateIncident(input: IncidentCreateDTO & { createdBy: string }) {
  return createIncident(input);
}

export async function serviceUpdateIncident(id: string, input: IncidentUpdateDTO, changedBy: string) {
  return updateIncident(id, input, changedBy);
}

export async function serviceListComments(incidentId: string) {
  return listComments(incidentId);
}

export async function serviceAddComment(incidentId: string, userId: string, body: string) {
  return addComment(incidentId, userId, body);
}
