import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import InfoHint from "../components/InfoHint";
import { createCompany, listCompanies, type AuthUser, type Company } from "../lib/api";

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

export default function CompaniesPage({
  token,
  currentUser,
  moduleView = "list",
}: {
  token: string;
  currentUser: AuthUser;
  moduleView?: "list" | "create";
}) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = currentUser.role === "superadmin";
  const slugPreview = useMemo(() => toSlug(name), [name]);
  const showList = moduleView !== "create";
  const showCreate = moduleView === "create";

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const result = await listCompanies(token);
      setCompanies(result.items);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke laste firmaer");
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
      await createCompany(token, { name, slug: slugPreview });
      setName("");
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke opprette firma");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <section className="page-hero page-hero--tight">
        <div className="page-intro">
          <p className="section-label">Firma</p>
          <div className="header-inline">
            <h2 className="page-hero__title">Firmastruktur</h2>
            <InfoHint text="Firma brukes til å skille data, brukere og administrasjon mellom ulike selskaper i løsningen." />
          </div>
        </div>
        <div className="hero-panel hero-panel--compact">
          <p className="section-label">Antall</p>
          <h3>{companies.length}</h3>
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}

      <section className="crm-module-nav">
        <NavLink to="/companies" className="crm-module-nav__link">
          Firmaoversikt
        </NavLink>
        <NavLink to="/companies/new" className="crm-module-nav__link">
          Nytt firma
        </NavLink>
      </section>

      <section className="incident-layout">
        {showList ? <article className="card">
          <div className="table-toolbar">
            <div className="card-headline">
              <h2>Firmaer</h2>
              <InfoHint text="Listen viser registrerte firmaer du har tilgang til." />
            </div>
          </div>

          <div className="incident-list">
            {companies.map((company) => (
              <article key={company.id} className="incident-card">
                <div className="incident-card__head">
                  <div className="page-intro">
                    <h3>{company.name}</h3>
                  </div>
                  <span className="status-pill" data-tone={company.isActive ? "DONE" : "REJECTED"}>
                    {company.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </article> : null}

        {showCreate ? <article className="card">
          <div className="card-headline">
            <h2>Nytt firma</h2>
            <InfoHint text="Tekniske felter opprettes automatisk. Du trenger bare firmanavn." />
          </div>

          {!canCreate ? (
            <div className="empty-state">
              <h3>Kun superadmin kan opprette firmaer</h3>
            </div>
          ) : (
            <form className="incident-form compact-form" onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="company-name">Firmanavn</label>
                <input id="company-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <button className="btn" type="submit" disabled={submitting || !slugPreview}>
                {submitting ? "Oppretter..." : "Opprett firma"}
              </button>
            </form>
          )}
        </article> : null}
      </section>
    </div>
  );
}
