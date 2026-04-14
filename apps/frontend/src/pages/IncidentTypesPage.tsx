import { useEffect, useMemo, useState } from "react";
import { createIncidentType, listCompanies, listIncidentTypes, type AuthUser, type Company, type IncidentType } from "../lib/api";

export default function IncidentTypesPage({ token, currentUser }: { token: string; currentUser: AuthUser }) {
  const [items, setItems] = useState<IncidentType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    companyId: currentUser.companyId,
  });

  const canManage = currentUser.role === "superadmin" || currentUser.role === "company_admin";

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const [result, companiesResult] = await Promise.all([listIncidentTypes(token), listCompanies(token)]);
      setItems(result.items);
      setCompanies(companiesResult.items);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke laste avvikstyper");
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
      await createIncidentType(token, form);
      setForm({
        name: "",
        slug: "",
        description: "",
        companyId: currentUser.companyId,
      });
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke opprette avvikstype");
    } finally {
      setSubmitting(false);
    }
  }

  const companyNames = useMemo(() => new Map(companies.map((company) => [company.id, company.name])), [companies]);

  return (
    <div className="page">
      <section className="page-hero">
        <div className="page-intro">
          <p className="section-label">Avvikstyper</p>
          <h2 className="page-hero__title">Definer hvilke typer avvik som skal brukes i systemet.</h2>
          <p>Avvikstyper gjør det lettere å standardisere registrering og rapportering senere.</p>
        </div>
        <div className="hero-panel">
          <p className="section-label">Oversikt</p>
          <h3>{items.length} avvikstyper er registrert.</h3>
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}

      <section className="incident-layout">
        <article className="card">
          <div className="table-toolbar">
            <div>
              <h2>Avvikstyper</h2>
              <p className="table-caption">{loading ? "Laster..." : `${items.length} typer tilgjengelig`}</p>
            </div>
          </div>

          <div className="incident-list">
            {items.map((item) => (
              <article key={item.id} className="incident-card">
                <div className="incident-card__head">
                  <div className="page-intro">
                    <h3>{item.name}</h3>
                    <p>{item.slug}</p>
                  </div>
                  <span className="status-pill" data-tone={item.isActive ? "DONE" : "REJECTED"}>
                    {item.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
                <div className="incident-card__meta">
                  <span className="chip">{companyNames.get(item.companyId) || "Ukjent firma"}</span>
                </div>
                <div className="incident-card__footer">
                  <span className="muted">{item.description || "Ingen beskrivelse"}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="page-intro">
            <p className="section-label">Ny avvikstype</p>
            <h2>Opprett en ny type som brukerne kan velge senere.</h2>
          </div>

          {!canManage ? (
            <div className="empty-state">
              <h3>Kun firmaadmin eller superadmin kan opprette avvikstyper</h3>
              <p>Du kan se oversikten, men ikke opprette nye typer med din rolle.</p>
            </div>
          ) : (
            <form className="incident-form" onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="incident-type-name">Navn</label>
                <input id="incident-type-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="incident-type-slug">Slug</label>
                <input id="incident-type-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="incident-type-description">Beskrivelse</label>
                <textarea
                  id="incident-type-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="incident-type-company">Firma</label>
                <select
                  id="incident-type-company"
                  value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                  disabled={currentUser.role !== "superadmin"}
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn" type="submit" disabled={submitting}>
                {submitting ? "Oppretter..." : "Opprett avvikstype"}
              </button>
            </form>
          )}
        </article>
      </section>
    </div>
  );
}
