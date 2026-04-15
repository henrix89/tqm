import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import InfoHint from "../components/InfoHint";
import {
  createDepartment,
  createUser,
  deactivateUser,
  listCompanies,
  listDepartments,
  listUsers,
  updateUser,
  type AuthUser,
  type Company,
  type Department,
  type Role,
} from "../lib/api";
import { getMissingCoreDepartmentNames } from "../lib/departments";
import { getAssignableRoles, roleLabels } from "../lib/roles";

type Props = {
  token: string;
  currentUser: AuthUser;
  moduleView?: "list" | "create";
};

type UserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  jobTitle: string;
  departmentId: string;
  companyId: string;
  reportsToUserId: string;
};

function getInitialForm(currentUser: AuthUser, defaultRole: Role): UserFormState {
  return {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: defaultRole,
    jobTitle: "",
    departmentId: "",
    companyId: currentUser.companyId,
    reportsToUserId: "",
  };
}

function userToFormState(user: AuthUser): UserFormState {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: "",
    role: user.role,
    jobTitle: user.jobTitle || "",
    departmentId: user.departmentId || "",
    companyId: user.companyId,
    reportsToUserId: user.reportsToUserId || "",
  };
}

export default function UsersPage({ token, currentUser, moduleView = "list" }: Props) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creatingCoreDepartments, setCreatingCoreDepartments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(() => getInitialForm(currentUser, "employee"));

  const canManageUsers = currentUser.role === "superadmin" || currentUser.role === "company_admin" || currentUser.role === "manager";
  const canManageDepartments = currentUser.role === "superadmin" || currentUser.role === "company_admin";
  const assignableRoles = getAssignableRoles(currentUser.role);
  const showList = moduleView !== "create";
  const showCreate = moduleView === "create";

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

  function resetForm() {
    setEditingUserId(null);
    setForm(getInitialForm(currentUser, assignableRoles[0] ?? "employee"));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingUserId) {
        await updateUser(token, editingUserId, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          role: form.role,
          jobTitle: form.jobTitle,
          departmentId: form.departmentId || null,
          companyId: form.companyId,
          reportsToUserId: form.reportsToUserId || null,
        });
      } else {
        await createUser(token, {
          ...form,
          departmentId: form.departmentId || null,
          reportsToUserId: form.reportsToUserId || null,
        });
      }
      resetForm();
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? (editingUserId ? "Kunne ikke oppdatere bruker" : "Kunne ikke opprette bruker"));
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
  const companyUsers = users.filter((user) => user.companyId === form.companyId && user.isActive);
  const missingCoreDepartments = getMissingCoreDepartmentNames(departments, form.companyId);

  async function createMissingCoreDepartments() {
    if (!canManageDepartments || missingCoreDepartments.length === 0) return;
    setCreatingCoreDepartments(true);
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
      setCreatingCoreDepartments(false);
    }
  }

  function startEditingUser(user: AuthUser) {
    setEditingUserId(user.id);
    setForm(userToFormState(user));
  }

  return (
    <div className="page">
      <section className="page-hero page-hero--tight">
        <div className="page-intro">
          <p className="section-label">Brukere</p>
          <div className="header-inline">
            <h2 className="page-hero__title">Brukeradministrasjon</h2>
            <InfoHint text="Her administrerer du tilgang, avdeling og lederlinje for brukerne i systemet." />
          </div>
        </div>
        <div className="hero-panel hero-panel--compact">
          <p className="section-label">Aktive</p>
          <h3>{users.filter((user) => user.isActive).length}</h3>
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}

      <section className="crm-module-nav">
        <NavLink to="/users" className="crm-module-nav__link">
          Brukeroversikt
        </NavLink>
        <NavLink to="/users/new" className="crm-module-nav__link">
          Ny bruker
        </NavLink>
      </section>

      <section className="incident-layout">
        {showList ? <div className="stack">
          <article className="card">
            <div className="table-toolbar">
              <div className="card-headline">
                <h2>Brukeroversikt</h2>
                <InfoHint text="Viser brukere i ditt synlige område basert på rollen din." />
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
                    <span className="chip">
                      {user.departmentId
                        ? departments.find((department) => department.id === user.departmentId)?.name || "Ukjent avdeling"
                        : "Ingen avdeling"}
                    </span>
                  </div>

                  <div className="incident-card__footer">
                    <span className="muted">{user.mustChangePassword ? "Må bytte passord" : "Passordstatus OK"}</span>
                    {canManageUsers ? (
                      <div className="form-actions">
                        <button className="btn-secondary" type="button" onClick={() => startEditingUser(user)}>
                          Rediger
                        </button>
                        {user.isActive && user.id !== currentUser.id ? (
                          <button className="btn-secondary" type="button" onClick={() => onDeactivate(user.id)}>
                            Deaktiver
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}

              {!loading && users.length === 0 ? (
                <div className="empty-state">
                  <h3>Ingen brukere tilgjengelig</h3>
                </div>
              ) : null}
            </div>
          </article>
        </div> : null}

        {showCreate ? <div className="stack">
          <article className="card">
            <div className="card-headline">
              <h2>{editingUserId ? "Rediger bruker" : "Ny bruker"}</h2>
              <InfoHint text="Nye brukere får midlertidig passord og kan knyttes til både avdeling og nærmeste leder." />
            </div>

            {!canManageUsers ? (
              <div className="empty-state">
                <h3>Du har kun lesetilgang</h3>
              </div>
            ) : (
              <form className="incident-form compact-form" onSubmit={onSubmit}>
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
                  <span className="label-with-info">
                    <label htmlFor="password">Midlertidig passord</label>
                    <InfoHint text="Brukeren må bytte dette ved første innlogging." />
                  </span>
                  {editingUserId ? (
                    <div className="inline-panel">
                      <div className="inline-panel__copy">
                        <strong>Passord endres ikke her</strong>
                        <span>Dette skjemaet oppdaterer brukerdata, rolle, avdeling og lederlinje.</span>
                      </div>
                    </div>
                  ) : (
                    <input
                      id="password"
                      type="password"
                      minLength={8}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                  )}
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
                    <span className="label-with-info">
                      <label htmlFor="companyId">Firma</label>
                      <InfoHint text="Kun superadmin kan opprette brukere på tvers av firma." />
                    </span>
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

                {missingCoreDepartments.length > 0 ? (
                  <div className="inline-panel">
                    <div className="inline-panel__copy">
                      <strong>Standardavdelinger mangler</strong>
                      <span>
                        CRM-varsler og ansvarsfordeling fungerer best når `Salg`, `Teknisk` og `Administrasjon` finnes som avdelinger.
                      </span>
                    </div>
                    {canManageDepartments ? (
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => void createMissingCoreDepartments()}
                        disabled={creatingCoreDepartments}
                      >
                        {creatingCoreDepartments
                          ? "Oppretter avdelinger..."
                          : `Opprett ${missingCoreDepartments.join(", ")}`}
                      </button>
                    ) : (
                      <span className="muted">Be firmaadministrasjon opprette disse avdelingene.</span>
                    )}
                  </div>
                ) : null}

                <div className="field">
                  <span className="label-with-info">
                    <label htmlFor="reportsToUserId">Rapporterer til</label>
                    <InfoHint text="Velg nærmeste leder dersom brukeren skal inngå i en lederlinje." />
                  </span>
                  <select id="reportsToUserId" value={form.reportsToUserId} onChange={(e) => setForm({ ...form, reportsToUserId: e.target.value })}>
                    <option value="">Ingen leder valgt</option>
                    {companyUsers
                      .filter((user) => user.id !== editingUserId)
                      .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName}
                      </option>
                      ))}
                  </select>
                </div>

                <div className="form-actions">
                  {editingUserId ? (
                    <button className="btn-secondary" type="button" onClick={resetForm}>
                      Avbryt
                    </button>
                  ) : null}
                  <button className="btn" type="submit" disabled={submitting || assignableRoles.length === 0}>
                    {submitting ? (editingUserId ? "Lagrer..." : "Oppretter...") : editingUserId ? "Lagre endringer" : "Opprett bruker"}
                  </button>
                </div>
              </form>
            )}
          </article>
        </div> : null}
      </section>
    </div>
  );
}
