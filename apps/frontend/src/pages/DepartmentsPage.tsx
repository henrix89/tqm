import { useEffect, useMemo, useState } from "react";
import {
  createDepartment,
  listCompanies,
  listDepartments,
  listUsers,
  type AuthUser,
  type Company,
  type Department,
} from "../lib/api";

export default function DepartmentsPage({ token, currentUser }: { token: string; currentUser: AuthUser }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  return (
    <div className="page">
      <section className="page-hero">
        <div className="page-intro">
          <p className="section-label">Avdelingsadministrasjon</p>
          <h2 className="page-hero__title">Bygg opp struktur for avdelinger og lederansvar.</h2>
          <p>Avdelinger kobles til firma og kan knyttes til en navngitt leder allerede i første versjon.</p>
        </div>
        <div className="hero-panel">
          <p className="section-label">Oversikt</p>
          <h3>{departments.length} avdelinger er registrert.</h3>
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}

      <section className="incident-layout">
        <article className="card">
          <div className="table-toolbar">
            <div>
              <h2>Avdelinger</h2>
              <p className="table-caption">{loading ? "Laster..." : `${departments.length} avdelinger tilgjengelig`}</p>
            </div>
          </div>

          <div className="incident-list">
            {departments.map((department) => (
              <article key={department.id} className="incident-card">
                <div className="incident-card__head">
                  <div className="page-intro">
                    <h3>{department.name}</h3>
                    <p>{department.code || "Ingen kode"}</p>
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
        </article>

        <article className="card">
          <div className="page-intro">
            <p className="section-label">Ny avdeling</p>
            <h2>Opprett avdeling og tildel leder.</h2>
          </div>

          {!canManage ? (
            <div className="empty-state">
              <h3>Kun firmaadmin eller superadmin kan opprette avdelinger</h3>
              <p>Du kan se oversikten, men ikke opprette nye avdelinger med din rolle.</p>
            </div>
          ) : (
            <form className="incident-form" onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="department-name">Avdelingsnavn</label>
                <input id="department-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="department-code">Kode</label>
                <input id="department-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="department-company">Firma</label>
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
                <label htmlFor="department-manager">Avdelingsleder</label>
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
        </article>
      </section>
    </div>
  );
}
