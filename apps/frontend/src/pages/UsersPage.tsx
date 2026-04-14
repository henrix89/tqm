import { useEffect, useState } from "react";
import {
  createUser,
  deactivateUser,
  listCompanies,
  listDepartments,
  listUsers,
  type AuthUser,
  type Company,
  type Department,
  type Role,
} from "../lib/api";
import { getAssignableRoles, roleLabels } from "../lib/roles";

type Props = {
  token: string;
  currentUser: AuthUser;
};

export default function UsersPage({ token, currentUser }: Props) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "employee" as Role,
    jobTitle: "",
    departmentId: "",
    companyId: currentUser.companyId,
    reportsToUserId: "",
  });

  const canManageUsers = currentUser.role === "superadmin" || currentUser.role === "company_admin" || currentUser.role === "manager";
  const assignableRoles = getAssignableRoles(currentUser.role);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const [usersResult, departmentsResult, companiesResult] = await Promise.all([
        listUsers(token),
        listDepartments(token),
        listCompanies(token),
      ]);
      setUsers(usersResult.items);
      setDepartments(departmentsResult.items);
      setCompanies(companiesResult.items);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke laste brukerdata");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [token]);

  useEffect(() => {
    if (!assignableRoles.includes(form.role)) {
      setForm((current) => ({ ...current, role: assignableRoles[0] ?? "employee" }));
    }
  }, [assignableRoles, form.role]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createUser(token, {
        ...form,
        departmentId: form.departmentId || null,
        reportsToUserId: form.reportsToUserId || null,
      });
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: assignableRoles[0] ?? "employee",
        jobTitle: "",
        departmentId: "",
        companyId: currentUser.companyId,
        reportsToUserId: "",
      });
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke opprette bruker");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDeactivate(userId: string) {
    setError(null);

    try {
      await deactivateUser(token, userId);
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke deaktivere bruker");
    }
  }

  const visibleDepartments = departments.filter((department) =>
    currentUser.role === "superadmin" ? true : department.companyId === form.companyId
  );

  return (
    <div className="page">
      <section className="page-hero">
        <div className="page-intro">
          <p className="section-label">Brukeradministrasjon</p>
          <h2 className="page-hero__title">Administrer brukere, roller og tilknytning til avdeling.</h2>
          <p>Her kan du opprette brukere, se lederlinjer og deaktivere kontoer ved behov.</p>
        </div>
        <div className="hero-panel">
          <p className="section-label">Nå i systemet</p>
          <h3>{users.length} brukere er tilgjengelige i din nåværende visning.</h3>
          <div className="hero-panel__grid">
            <div className="hero-panel__item">
              <span className="hero-panel__value">{users.filter((user) => user.isActive).length}</span>
              <span>aktive brukere</span>
            </div>
            <div className="hero-panel__item">
              <span className="hero-panel__value">{departments.length}</span>
              <span>avdelinger tilgjengelige</span>
            </div>
          </div>
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}

      <section className="incident-layout">
        <div className="stack">
          <article className="card">
            <div className="table-toolbar">
              <div>
                <h2>Brukeroversikt</h2>
                <p className="table-caption">{loading ? "Laster brukere..." : `${users.length} brukere i denne visningen`}</p>
              </div>
            </div>

            <div className="incident-list">
              {users.map((user) => (
                <article key={user.id} className="incident-card">
                  <div className="incident-card__head">
                    <div className="page-intro">
                      <h3>{user.fullName}</h3>
                      <p>{user.email}</p>
                    </div>
                    <span className="status-pill" data-tone={user.isActive ? "DONE" : "REJECTED"}>
                      {user.isActive ? "Aktiv" : "Inaktiv"}
                    </span>
                  </div>

                  <div className="incident-card__meta">
                    <span className="chip">{roleLabels[user.role]}</span>
                    <span className="chip">{user.jobTitle || "Uten stillingstittel"}</span>
                    <span className="chip">{user.departmentId || "Ingen avdeling"}</span>
                  </div>

                  <div className="incident-card__footer">
                    <span className="muted">{user.mustChangePassword ? "Må bytte passord" : "Passordstatus OK"}</span>
                    {canManageUsers && user.isActive && user.id !== currentUser.id ? (
                      <button className="btn-secondary" type="button" onClick={() => onDeactivate(user.id)}>
                        Deaktiver
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}

              {!loading && users.length === 0 ? (
                <div className="empty-state">
                  <h3>Ingen brukere tilgjengelig</h3>
                  <p>Opprett en bruker for å komme i gang med organisasjonsmodellen.</p>
                </div>
              ) : null}
            </div>
          </article>
        </div>

        <div className="stack">
          <article className="card">
            <div className="page-intro">
              <p className="section-label">Ny bruker</p>
              <h2>Opprett konto og plasser brukeren riktig i organisasjonen.</h2>
              <p>Skjemaet holder første versjon enkel, men dekker firma, avdeling, rolle og nærmeste leder.</p>
            </div>

            {!canManageUsers ? (
              <div className="empty-state">
                <h3>Du har kun lesetilgang</h3>
                <p>Denne delen krever Avdelingsleder, Firma Administrasjon eller Superadmin.</p>
              </div>
            ) : (
              <form className="incident-form" onSubmit={onSubmit}>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="firstName">Fornavn</label>
                    <input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                  </div>
                  <div className="field">
                    <label htmlFor="lastName">Etternavn</label>
                    <input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="email">E-post</label>
                  <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>

                <div className="field">
                  <label htmlFor="password">Midlertidig passord</label>
                  <input
                    id="password"
                    type="password"
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="role">Rolle</label>
                    <select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                      {assignableRoles.map((role) => (
                        <option key={role} value={role}>
                          {roleLabels[role]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="jobTitle">Stillingstittel</label>
                    <input id="jobTitle" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="companyId">Firma</label>
                    <select
                      id="companyId"
                      value={form.companyId}
                      onChange={(e) => setForm({ ...form, companyId: e.target.value, departmentId: "" })}
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
                    <label htmlFor="departmentId">Avdeling</label>
                    <select id="departmentId" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                      <option value="">Ingen avdeling</option>
                      {visibleDepartments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="reportsToUserId">Rapporterer til</label>
                  <select id="reportsToUserId" value={form.reportsToUserId} onChange={(e) => setForm({ ...form, reportsToUserId: e.target.value })}>
                    <option value="">Ingen leder valgt</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <button className="btn" type="submit" disabled={submitting || assignableRoles.length === 0}>
                  {submitting ? "Oppretter..." : "Opprett bruker"}
                </button>
              </form>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
