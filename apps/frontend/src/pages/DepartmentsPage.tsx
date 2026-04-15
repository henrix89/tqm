import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import InfoHint from "../components/InfoHint";
import {
  createDepartment,
  listCompanies,
  listDepartments,
  listUsers,
  type AuthUser,
  type Company,
  type Department,
} from "../lib/api";
import { getMissingCoreDepartmentNames } from "../lib/departments";

export default function DepartmentsPage({
  token,
  currentUser,
  moduleView = "list",
}: {
  token: string;
  currentUser: AuthUser;
  moduleView?: "list" | "create";
}) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creatingDefaults, setCreatingDefaults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    companyId: currentUser.companyId,
    managerUserId: "",
  });

  const canManage = currentUser.role === "superadmin" || currentUser.role === "company_admin";

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const [departmentsResult, companiesResult, usersResult] = await Promise.all([
        listDepartments(token),
        listCompanies(token),
        listUsers(token),
      ]);
      setDepartments(departmentsResult.items);
      setCompanies(companiesResult.items);
      setUsers(usersResult.items);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke laste avdelinger");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createDepartment(token, {
        ...form,
        managerUserId: form.managerUserId || null,
      });
      setForm({
        name: "",
        code: "",
        companyId: currentUser.companyId,
        managerUserId: "",
      });
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke opprette avdeling");
    } finally {
      setSubmitting(false);
    }
  }

  const companyNames = useMemo(() => new Map(companies.map((company) => [company.id, company.name])), [companies]);
  const userNames = useMemo(() => new Map(users.map((user) => [user.id, user.fullName])), [users]);
  const visibleUsers = users.filter((user) => user.companyId === form.companyId);
  const missingCoreDepartments = getMissingCoreDepartmentNames(departments, form.companyId);
  const showList = moduleView !== "create";
  const showCreate = moduleView === "create";

  async function createDefaultDepartments() {
    if (!canManage || missingCoreDepartments.length === 0) return;
    setCreatingDefaults(true);
    setError(null);

    try {
      await Promise.all(
        missingCoreDepartments.map((name) =>
          createDepartment(token, {
            name,
            companyId: form.companyId,
            managerUserId: null,
          })
        )
      );
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke opprette standardavdelinger");
    } finally {
      setCreatingDefaults(false);
    }
  }

  return (
    <div className="page">
      <section className="page-hero page-hero--tight">
        <div className="page-intro">
          <p className="section-label">Avdelinger</p>
          <div className="header-inline">
            <h2 className="page-hero__title">Avdelingsstruktur</h2>
            <InfoHint text="Avdelinger kobles til firma og kan ha en ansvarlig leder for enklere tilgangsstyring." />
          </div>
        </div>
        <div className="hero-panel hero-panel--compact">
          <p className="section-label">Antall</p>
          <h3>{departments.length}</h3>
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}

      <section className="crm-module-nav">
        <NavLink to="/departments" className="crm-module-nav__link">
          Avdelingsoversikt
        </NavLink>
        <NavLink to="/departments/new" className="crm-module-nav__link">
          Ny avdeling
        </NavLink>
      </section>

      <section className="incident-layout">
        {showList ? <article className="card">
          <div className="table-toolbar">
            <div className="card-headline">
              <h2>Avdelinger</h2>
              <InfoHint text="Hver avdeling vises med tilhørende firma og valgt leder." />
            </div>
          </div>

          <div className="incident-list">
            {departments.map((department) => (
              <article key={department.id} className="incident-card">
                <div className="incident-card__head">
                  <div className="page-intro">
                    <h3>{department.name}</h3>
                  </div>
                  <span className="status-pill" data-tone={department.isActive ? "DONE" : "REJECTED"}>
                    {department.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
                <div className="incident-card__meta">
                  <span className="chip">{companyNames.get(department.companyId) || "Ukjent firma"}</span>
                  <span className="chip">{department.managerUserId ? userNames.get(department.managerUserId) || "Ukjent leder" : "Ingen leder"}</span>
                </div>
              </article>
            ))}
          </div>
        </article> : null}

        {showCreate ? <article className="card">
          <div className="card-headline">
            <h2>Ny avdeling</h2>
            <InfoHint text="Velg firma og eventuelt avdelingsleder. Tekniske felter er skjult for å holde skjemaet ryddig." />
          </div>

          {!canManage ? (
            <div className="empty-state">
              <h3>Kun firmaadmin eller superadmin kan opprette avdelinger</h3>
            </div>
          ) : (
            <form className="incident-form compact-form" onSubmit={onSubmit}>
              {missingCoreDepartments.length > 0 ? (
                <div className="inline-panel">
                  <div className="inline-panel__copy">
                    <strong>Standardavdelinger</strong>
                    <span>
                      Disse brukes på tvers av CRM, varsler og brukeradministrasjon: {missingCoreDepartments.join(", ")}.
                    </span>
                  </div>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => void createDefaultDepartments()}
                    disabled={creatingDefaults}
                  >
                    {creatingDefaults ? "Oppretter..." : "Opprett standardavdelinger"}
                  </button>
                </div>
              ) : null}

              <div className="field">
                <label htmlFor="department-name">Avdelingsnavn</label>
                <input id="department-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field">
                <span className="label-with-info">
                  <label htmlFor="department-company">Firma</label>
                  <InfoHint text="Kun superadmin kan velge firma på tvers." />
                </span>
                <select
                  id="department-company"
                  value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value, managerUserId: "" })}
                  disabled={currentUser.role !== "superadmin"}
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <span className="label-with-info">
                  <label htmlFor="department-manager">Avdelingsleder</label>
                  <InfoHint text="Kan stå tomt hvis leder skal settes senere." />
                </span>
                <select id="department-manager" value={form.managerUserId} onChange={(e) => setForm({ ...form, managerUserId: e.target.value })}>
                  <option value="">Ingen leder valgt</option>
                  {visibleUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn" type="submit" disabled={submitting}>
                {submitting ? "Oppretter..." : "Opprett avdeling"}
              </button>
            </form>
          )}
        </article> : null}
      </section>
    </div>
  );
}
