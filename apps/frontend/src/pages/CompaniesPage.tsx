import { useEffect, useMemo, useState } from "react";
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

export default function CompaniesPage({ token, currentUser }: { token: string; currentUser: AuthUser }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = currentUser.role === "superadmin";
  const slugPreview = useMemo(() => toSlug(name), [name]);

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
      <section className="page-hero">
        <div className="page-intro">
          <p className="section-label">Firmaadministrasjon</p>
          <h2 className="page-hero__title">Opprett og administrer firmaer i løsningen.</h2>
          <p>Denne modulen brukes først og fremst av superadmin for å etablere selskapsstrukturen.</p>
        </div>
        <div className="hero-panel">
          <p className="section-label">Oversikt</p>
          <h3>{companies.length} firmaer er registrert.</h3>
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}

      <section className="incident-layout">
        <article className="card">
          <div className="table-toolbar">
            <div>
              <h2>Firmaer</h2>
              <p className="table-caption">{loading ? "Laster..." : `${companies.length} firmaer tilgjengelig`}</p>
            </div>
          </div>

          <div className="incident-list">
            {companies.map((company) => (
              <article key={company.id} className="incident-card">
                <div className="incident-card__head">
                  <div className="page-intro">
                    <h3>{company.name}</h3>
                    <p>{company.slug}</p>
                  </div>
                  <span className="status-pill" data-tone={company.isActive ? "DONE" : "REJECTED"}>
                    {company.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="page-intro">
            <p className="section-label">Nytt firma</p>
            <h2>Registrer et nytt firma.</h2>
          </div>

          {!canCreate ? (
            <div className="empty-state">
              <h3>Kun superadmin kan opprette firmaer</h3>
              <p>Du kan se oversikten, men ikke opprette nye firmaer med din rolle.</p>
            </div>
          ) : (
            <form className="incident-form" onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="company-name">Firmanavn</label>
                <input id="company-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <button className="btn" type="submit" disabled={submitting || !slugPreview}>
                {submitting ? "Oppretter..." : "Opprett firma"}
              </button>
            </form>
          )}
        </article>
      </section>
    </div>
  );
}
