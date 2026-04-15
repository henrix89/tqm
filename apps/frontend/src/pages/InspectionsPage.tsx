import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  createIncidentFromFinding,
  createInspection,
  createInspectionFinding,
  getInspectionDetail,
  listDepartments,
  listInspections,
  listUsers,
  type AuthUser,
  type Department,
  type FindingSeverity,
  type Inspection,
  type InspectionDetail,
} from "../lib/api";

const severityOptions: FindingSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const severityLabels: Record<FindingSeverity, string> = {
  LOW: "Lav",
  MEDIUM: "Middels",
  HIGH: "Høy",
  CRITICAL: "Kritisk",
};

export default function InspectionsPage({
  token,
  moduleView = "list",
}: {
  token: string;
  moduleView?: "list" | "create";
}) {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [detail, setDetail] = useState<InspectionDetail | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [inspectionForm, setInspectionForm] = useState({
    title: "",
    location: "",
    departmentId: "",
    plannedFor: new Date().toISOString().slice(0, 10),
  });

  const [findingForm, setFindingForm] = useState({
    title: "",
    description: "",
    severity: "LOW" as FindingSeverity,
    assigneeUserId: "",
    dueDate: "",
  });
  const showList = moduleView === "list";
  const showCreate = moduleView === "create";

  const userMap = useMemo(() => new Map(users.map((user) => [user.id, user.fullName])), [users]);

  async function refreshInspections(preferredId?: string) {
    setLoading(true);
    setError(null);
    try {
      const [inspectionResult, departmentResult, userResult] = await Promise.all([
        listInspections(token),
        listDepartments(token),
        listUsers(token),
      ]);

      setInspections(inspectionResult.items);
      setDepartments(departmentResult.items);
      setUsers(userResult.items);

      const nextId =
        preferredId && inspectionResult.items.some((item) => item.id === preferredId)
          ? preferredId
          : inspectionResult.items[0]?.id ?? "";
      setSelectedInspectionId(nextId);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke laste vernerunder");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(inspectionId: string) {
    if (!inspectionId) {
      setDetail(null);
      return;
    }

    setDetailLoading(true);
    try {
      setDetail(await getInspectionDetail(token, inspectionId));
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke laste vernerunden");
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    refreshInspections();
  }, [token]);

  useEffect(() => {
    loadDetail(selectedInspectionId);
  }, [selectedInspectionId, token]);

  async function handleCreateInspection(event: React.FormEvent) {
    event.preventDefault();
    setSaving("inspection");
    try {
      const created = await createInspection(token, {
        ...inspectionForm,
        departmentId: inspectionForm.departmentId || null,
      });
      setInspectionForm({
        title: "",
        location: "",
        departmentId: "",
        plannedFor: new Date().toISOString().slice(0, 10),
      });
      await refreshInspections(created.id);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke opprette vernerunde");
    } finally {
      setSaving(null);
    }
  }

  async function handleCreateFinding(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedInspectionId) return;

    setSaving("finding");
    try {
      await createInspectionFinding(token, selectedInspectionId, {
        ...findingForm,
        assigneeUserId: findingForm.assigneeUserId || null,
        dueDate: findingForm.dueDate || null,
      });
      setFindingForm({
        title: "",
        description: "",
        severity: "LOW",
        assigneeUserId: "",
        dueDate: "",
      });
      await loadDetail(selectedInspectionId);
      await refreshInspections(selectedInspectionId);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke registrere funn");
    } finally {
      setSaving(null);
    }
  }

  async function handleCreateIncident(findingId: string) {
    setSaving(`incident-${findingId}`);
    try {
      await createIncidentFromFinding(token, findingId);
      await loadDetail(selectedInspectionId);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke opprette avvik fra funn");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="page">
      <section className="page-hero page-hero--tight">
        <div className="page-intro">
          <p className="section-label">Vernerunder</p>
          <h2 className="page-hero__title">Planlegg runder, registrer funn og løft dem videre til avvik.</h2>
          <p>Modulen håndterer planlagte runder, observasjoner og kobling til avviksflyten.</p>
        </div>
        <div className="hero-panel hero-panel--compact">
          <p className="section-label">Runder</p>
          <h3>{inspections.length}</h3>
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}

      <section className="crm-module-nav">
        <NavLink to="/inspections" className="crm-module-nav__link">
          Vernerunder
        </NavLink>
        <NavLink to="/inspections/new" className="crm-module-nav__link">
          Ny vernerunde
        </NavLink>
      </section>

      <section className="crm-layout">
        <aside className="crm-sidebar">
          {showList ? <article className="card">
            <div className="card-headline">
              <h2>Planlagte vernerunder</h2>
            </div>
            <div className="crm-customer-list">
              {loading ? (
                <div className="empty-state">
                  <h3>Laster vernerunder</h3>
                </div>
              ) : inspections.length === 0 ? (
                <div className="empty-state">
                  <h3>Ingen vernerunder ennå</h3>
                </div>
              ) : (
                inspections.map((inspection) => (
                  <button
                    key={inspection.id}
                    type="button"
                    className={`crm-customer-item ${selectedInspectionId === inspection.id ? "crm-customer-item--active" : ""}`}
                    onClick={() => setSelectedInspectionId(inspection.id)}
                  >
                    <span className="crm-customer-item__title">{inspection.title}</span>
                    <span className="crm-customer-item__meta">
                      <span className="chip">{inspection.openFindingCount} åpne funn</span>
                      <span className="muted">{new Date(inspection.plannedFor).toLocaleDateString("nb-NO")}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </article> : null}

          {showCreate ? <article className="card">
            <div className="card-headline">
              <h2>Ny vernerunde</h2>
            </div>
            <form className="incident-form compact-form" onSubmit={handleCreateInspection}>
              <div className="field">
                <label htmlFor="inspection-title">Tittel</label>
                <input
                  id="inspection-title"
                  value={inspectionForm.title}
                  onChange={(event) => setInspectionForm({ ...inspectionForm, title: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="inspection-location">Lokasjon</label>
                <input
                  id="inspection-location"
                  value={inspectionForm.location}
                  onChange={(event) => setInspectionForm({ ...inspectionForm, location: event.target.value })}
                />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="inspection-department">Avdeling</label>
                  <select
                    id="inspection-department"
                    value={inspectionForm.departmentId}
                    onChange={(event) => setInspectionForm({ ...inspectionForm, departmentId: event.target.value })}
                  >
                    <option value="">Ingen avdeling</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="inspection-date">Planlagt dato</label>
                  <input
                    id="inspection-date"
                    type="date"
                    value={inspectionForm.plannedFor}
                    onChange={(event) => setInspectionForm({ ...inspectionForm, plannedFor: event.target.value })}
                  />
                </div>
              </div>
              <button className="btn" type="submit" disabled={saving === "inspection"}>
                {saving === "inspection" ? "Lagrer..." : "Opprett vernerunde"}
              </button>
            </form>
          </article> : null}
        </aside>

        <div className="crm-detail">
          {!selectedInspectionId ? (
            <article className="card empty-state">
              <h3>Velg en vernerunde</h3>
            </article>
          ) : detailLoading || !detail ? (
            <article className="card empty-state">
              <h3>Laster vernerunde</h3>
            </article>
          ) : (
            <>
              <article className="card">
                <div className="section-header">
                  <div className="page-intro">
                    <p className="section-label">Detaljer</p>
                    <h2>{detail.title}</h2>
                    <p>
                      {detail.location || "Ingen lokasjon satt"} · {new Date(detail.plannedFor).toLocaleDateString("nb-NO")}
                    </p>
                  </div>
                  <div className="hero-badges">
                    <span className="hero-badge">{detail.findingCount} funn</span>
                    <span className="hero-badge">{detail.openFindingCount} åpne</span>
                  </div>
                </div>
              </article>

              <section className="crm-split">
                <article className="card">
                  <div className="card-headline">
                    <h2>Funn</h2>
                  </div>
                  <div className="incident-list">
                    {detail.findings.length === 0 ? (
                      <div className="empty-state">
                        <h3>Ingen funn registrert</h3>
                      </div>
                    ) : (
                      detail.findings.map((finding) => (
                        <article key={finding.id} className="incident-card">
                          <div className="incident-card__head">
                            <div className="page-intro">
                              <h3>{finding.title}</h3>
                              <p>{finding.description || "Ingen beskrivelse"}</p>
                            </div>
                            <span className="chip">{severityLabels[finding.severity]}</span>
                          </div>
                          <div className="incident-card__footer">
                            <span className="muted">
                              {finding.assigneeUserId ? userMap.get(finding.assigneeUserId) || "Ukjent" : "Ingen ansvarlig"}
                            </span>
                            <span className="muted">
                              {finding.dueDate ? new Date(finding.dueDate).toLocaleDateString("nb-NO") : "Ingen frist"}
                            </span>
                          </div>
                          <div className="incident-card__footer">
                            {finding.incidentId ? (
                              <span className="chip">Avvik opprettet</span>
                            ) : (
                              <button
                                className="btn-secondary"
                                type="button"
                                onClick={() => void handleCreateIncident(finding.id)}
                                disabled={saving === `incident-${finding.id}`}
                              >
                                {saving === `incident-${finding.id}` ? "Oppretter..." : "Lag avvik"}
                              </button>
                            )}
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </article>

                <article className="card">
                  <form className="incident-form compact-form" onSubmit={handleCreateFinding}>
                    <h2>Nytt funn</h2>
                    <div className="field">
                      <label htmlFor="finding-title">Tittel</label>
                      <input
                        id="finding-title"
                        value={findingForm.title}
                        onChange={(event) => setFindingForm({ ...findingForm, title: event.target.value })}
                        required
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="finding-description">Beskrivelse</label>
                      <textarea
                        id="finding-description"
                        value={findingForm.description}
                        onChange={(event) => setFindingForm({ ...findingForm, description: event.target.value })}
                      />
                    </div>
                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor="finding-severity">Alvorlighet</label>
                        <select
                          id="finding-severity"
                          value={findingForm.severity}
                          onChange={(event) =>
                            setFindingForm({
                              ...findingForm,
                              severity: event.target.value as FindingSeverity,
                            })
                          }
                        >
                          {severityOptions.map((severity) => (
                            <option key={severity} value={severity}>
                              {severityLabels[severity]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label htmlFor="finding-assignee">Ansvarlig</label>
                        <select
                          id="finding-assignee"
                          value={findingForm.assigneeUserId}
                          onChange={(event) => setFindingForm({ ...findingForm, assigneeUserId: event.target.value })}
                        >
                          <option value="">Ingen</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="field">
                      <label htmlFor="finding-due">Frist</label>
                      <input
                        id="finding-due"
                        type="date"
                        value={findingForm.dueDate}
                        onChange={(event) => setFindingForm({ ...findingForm, dueDate: event.target.value })}
                      />
                    </div>
                    <button className="btn" type="submit" disabled={saving === "finding"}>
                      {saving === "finding" ? "Lagrer..." : "Registrer funn"}
                    </button>
                  </form>
                </article>
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
