import { useEffect, useMemo, useState } from "react";
import InfoHint from "../components/InfoHint";
import { createIncidentType, listCompanies, listIncidentTypes, type AuthUser, type Company, type IncidentType } from "../lib/api";

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function IncidentTypesPage({ token, currentUser }: { token: string; currentUser: AuthUser }) {
  const [items, setItems] = useState<IncidentType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    companyId: currentUser.companyId,
  });

  const canManage = currentUser.role === "superadmin" || currentUser.role === "company_admin";
  const slugPreview = useMemo(() => toSlug(form.name), [form.name]);

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
      await createIncidentType(token, { ...form, slug: slugPreview });
      setForm({
        name: "",
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
      <section className="page-hero page-hero--tight">
        <div className="page-intro">
          <p className="section-label">Avvikstyper</p>
          <div className="header-inline">
            <h2 className="page-hero__title">Typebibliotek</h2>
            <InfoHint text="Avvikstyper gjør registreringen mer konsekvent og gir bedre filtrering og rapportering senere." />
          </div>
        </div>
        <div className="hero-panel hero-panel--compact">
          <p className="section-label">Antall</p>
          <h3>{items.length}</h3>
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}

      <section className="incident-layout">
        <article className="card">
          <div className="table-toolbar">
            <div className="card-headline">
              <h2>Avvikstyper</h2>
              <InfoHint text="Hver type tilhører et firma og kan brukes videre i avviksregistrering." />
            </div>
          </div>

          <div className="incident-list">
            {items.map((item) => (
              <article key={item.id} className="incident-card">
                <div className="incident-card__head">
                  <div className="page-intro">
                    <h3>{item.name}</h3>
                  </div>
                  <span className="status-pill" data-tone={item.isActive ? "DONE" : "REJECTED"}>
                    {item.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
                <div className="incident-card__meta">
                  <span className="chip">{companyNames.get(item.companyId) || "Ukjent firma"}</span>
                </div>
                {item.description ? (
                  <div className="incident-card__footer">
                    <span className="muted">{item.description}</span>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="card-headline">
            <h2>Ny avvikstype</h2>
            <InfoHint text="Teknisk identifikator opprettes automatisk. Du trenger bare navn, beskrivelse og firma." />
          </div>

          {!canManage ? (
            <div className="empty-state">
              <h3>Kun firmaadmin eller superadmin kan opprette avvikstyper</h3>
            </div>
          ) : (
            <form className="incident-form compact-form" onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="incident-type-name">Navn</label>
                <input id="incident-type-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field">
                <span className="label-with-info">
                  <label htmlFor="incident-type-description">Beskrivelse</label>
                  <InfoHint text="Valgfritt. Bruk bare dette feltet hvis navnet alene ikke er tydelig nok." />
                </span>
                <textarea
                  id="incident-type-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="field">
                <span className="label-with-info">
                  <label htmlFor="incident-type-company">Firma</label>
                  <InfoHint text="Kun superadmin kan velge firma på tvers." />
                </span>
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
              <button className="btn" type="submit" disabled={submitting || !slugPreview}>
                {submitting ? "Oppretter..." : "Opprett avvikstype"}
              </button>
            </form>
          )}
        </article>
      </section>
    </div>
  );
}
