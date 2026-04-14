import { useEffect, useMemo, useState } from "react";
import { createIncident, listIncidents, type Incident } from "../lib/api";

type Filter = {
  q: string;
  status: string;
  category: string;
  severity: string;
  page: number;
  pageSize: number;
};

const statuses = ["", "\u00C5PEN", "P\u00C5G\u00C5R", "LUKKET", "AVVIST"];
const categories = ["", "HMS", "LEVERANSE", "TEKNISK", "KUNDE", "INTERN_PROSESS"];
const severities = ["", "LAV", "MIDDELS", "H\u00D8Y", "KRITISK"];

const categoryLabels: Record<string, string> = {
  HMS: "HMS",
  LEVERANSE: "Leveranse",
  TEKNISK: "Teknisk",
  KUNDE: "Kunde",
  INTERN_PROSESS: "Intern prosess",
};

const severityLabels: Record<string, string> = {
  LAV: "Lav",
  MIDDELS: "Middels",
  "H\u00D8Y": "H\u00F8y",
  KRITISK: "Kritisk",
};

const statusLabels: Record<string, string> = {
  "\u00C5PEN": "\u00C5pen",
  "P\u00C5G\u00C5R": "P\u00E5g\u00E5r",
  LUKKET: "Lukket",
  AVVIST: "Avvist",
};

function statusTone(status: string) {
  if (status === "\u00C5PEN") return "OPEN";
  if (status === "P\u00C5G\u00C5R") return "PROGRESS";
  if (status === "LUKKET") return "DONE";
  return "REJECTED";
}

function severityValue(level: string) {
  if (level === "KRITISK") return 4;
  if (level === "H\u00D8Y") return 3;
  if (level === "MIDDELS") return 2;
  return 1;
}

function prettyStatus(status: string) {
  return statusLabels[status] ?? status;
}

function prettySeverity(level: string) {
  return severityLabels[level] ?? level;
}

function prettyCategory(category: string) {
  return categoryLabels[category] ?? category;
}

function severityKey(level: string) {
  return level === "H\u00D8Y" ? "HOY" : level;
}

const copy = {
  section: "Avvik og oppf\u00F8lging",
  heroBadge: "Bygget for oppf\u00F8lging",
  heroNow: "N\u00E5 i arbeidsflaten",
  heroTitle: "F\u00E5 status med en gang uten \u00E5 lese deg gjennom en kompakt tabell.",
  highSeverity: "saker med h\u00F8y eller kritisk alvorlighet",
  openCases: "\u00C5pne saker",
  overdue: "Forfalte frister",
  overdueHint: "Baseres p\u00E5 registrert frist",
  searchText: "Bruk s\u00F8k, kategori, status og alvorlighet for \u00E5 snevre inn arbeidslisten.",
  searchLabel: "S\u00F8k",
  searchPlaceholder: "S\u00F8k p\u00E5 tittel eller beskrivelse",
  allLevels: "Alle niv\u00E5er",
  emptyText: "Pr\u00F8v \u00E5 nullstille filter eller registrer en ny sak til h\u00F8yre.",
  formText: "Skjemaet er gjort luftigere og enklere \u00E5 skanne fra topp til bunn.",
  ownerLabel: "Ansvarlig bruker-ID",
  qualityTitle: "God flyt gir bedre kvalitet p\u00E5 registreringen.",
  concreteText: "En tydelig tittel og kort beskrivelse gj\u00F8r oppf\u00F8lging raskere.",
  deadlineText: "Det gj\u00F8r det enklere \u00E5 prioritere saker som krever handling.",
};

export default function IncidentsPage({ token }: { token: string }) {
  const [filter, setFilter] = useState<Filter>({
    q: "",
    status: "",
    category: "",
    severity: "",
    page: 1,
    pageSize: 6,
  });
  const [data, setData] = useState<{ items: Incident[]; total: number; page: number; pageSize: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    category: "HMS",
    severity: "LAV",
    assigneeUserId: "",
    measures: "",
    dueDate: "",
  });

  const params = useMemo(() => ({ ...filter, page: filter.page, pageSize: filter.pageSize }), [filter]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listIncidents(params, token)
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [params, token]);

  const items = data?.items ?? [];
  const highSeverityCount = items.filter((item) => severityValue(item.severity) >= 3).length;
  const openCount = items.filter((item) => statusTone(item.status) === "OPEN").length;
  const overdueCount = items.filter((item) => item.due_date && item.due_date < new Date().toISOString().slice(0, 10)).length;

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      await createIncident(
        {
        ...form,
        assigneeUserId: form.assigneeUserId || null,
        measures: form.measures || null,
        dueDate: form.dueDate || null,
        },
        token
      );

      setForm((current) => ({
        ...current,
        title: "",
        description: "",
        measures: "",
        assigneeUserId: "",
        dueDate: "",
      }));

      const fresh = await listIncidents(params, token);
      setData(fresh);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="page">
      <section className="page-hero">
        <div className="page-intro">
          <p className="section-label">{copy.section}</p>
          <h2 className="page-hero__title">Et tydelig sted for registrering, vurdering og videre handling.</h2>
          <p>
            Siden kombinerer rask filtrering, registrering av nye saker og en mer lesbar presentasjon av aktive avvik.
          </p>
          <div className="hero-badges">
            <span className="hero-badge">Rask registrering</span>
            <span className="hero-badge">Bedre lesbarhet</span>
            <span className="hero-badge">{copy.heroBadge}</span>
          </div>
        </div>

        <div className="hero-panel">
          <p className="section-label">{copy.heroNow}</p>
          <h3>{copy.heroTitle}</h3>
          <div className="hero-panel__grid">
            <div className="hero-panel__item">
              <span className="hero-panel__value">{data?.total ?? 0}</span>
              <span>registrerte avvik i utvalget</span>
            </div>
            <div className="hero-panel__item">
              <span className="hero-panel__value">{highSeverityCount}</span>
              <span>{copy.highSeverity}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <p className="meta-label">{copy.openCases}</p>
          <span className="metric-card__value">{openCount}</span>
          <span className="muted">I denne siden av resultatet</span>
        </article>
        <article className="metric-card">
          <p className="meta-label">{copy.overdue}</p>
          <span className="metric-card__value">{overdueCount}</span>
          <span className="muted">{copy.overdueHint}</span>
        </article>
        <article className="metric-card">
          <p className="meta-label">Filtertreff</p>
          <span className="metric-card__value">{data?.total ?? 0}</span>
          <span className="muted">Oppdateres automatisk</span>
        </article>
      </section>

      {error && <div className="alert">{error}</div>}

      <section className="incident-layout">
        <div className="stack">
          <article className="card">
            <div className="section-header">
              <div className="page-intro">
                <p className="section-label">Finn riktig sak</p>
                <h2>Filtrer listen uten friksjon.</h2>
                <p>{copy.searchText}</p>
              </div>
              <button
                className="btn-secondary"
                type="button"
                onClick={() =>
                  setFilter({
                    q: "",
                    status: "",
                    category: "",
                    severity: "",
                    page: 1,
                    pageSize: filter.pageSize,
                  })
                }
              >
                Nullstill filter
              </button>
            </div>

            <form className="form-grid form-grid--wide" onSubmit={(e) => e.preventDefault()}>
              <div className="field field--full">
                <label htmlFor="incident-search">{copy.searchLabel}</label>
                <input
                  id="incident-search"
                  placeholder={copy.searchPlaceholder}
                  value={filter.q}
                  onChange={(e) => setFilter({ ...filter, q: e.target.value, page: 1 })}
                />
              </div>

              <div className="field">
                <label htmlFor="incident-status">Status</label>
                <select
                  id="incident-status"
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value, page: 1 })}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status ? prettyStatus(status) : "Alle statuser"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="incident-category">Kategori</label>
                <select
                  id="incident-category"
                  value={filter.category}
                  onChange={(e) => setFilter({ ...filter, category: e.target.value, page: 1 })}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category ? prettyCategory(category) : "Alle kategorier"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="incident-severity">Alvorlighet</label>
                <select
                  id="incident-severity"
                  value={filter.severity}
                  onChange={(e) => setFilter({ ...filter, severity: e.target.value, page: 1 })}
                >
                  {severities.map((severity) => (
                    <option key={severity} value={severity}>
                      {severity ? prettySeverity(severity) : copy.allLevels}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="incident-page-size">Vis per side</label>
                <select
                  id="incident-page-size"
                  value={filter.pageSize}
                  onChange={(e) => setFilter({ ...filter, pageSize: Number(e.target.value), page: 1 })}
                >
                  {[6, 10, 20].map((size) => (
                    <option key={size} value={size}>
                      {size} saker
                    </option>
                  ))}
                </select>
              </div>
            </form>
          </article>

          <article className="card">
            <div className="table-toolbar">
              <div>
                <h2>Arbeidsliste</h2>
                <p className="table-caption">
                  {loading ? "Laster saker..." : `${data?.total ?? 0} treff med gjeldende filter`}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="empty-state">
                <h3>Henter avvik</h3>
                <p>Vi laster inn saker og oppdaterer arbeidslisten.</p>
              </div>
            ) : items.length === 0 ? (
              <div className="empty-state">
                <h3>Ingen avvik matcher filtrene</h3>
                <p>{copy.emptyText}</p>
              </div>
            ) : (
              <div className="incident-list">
                {items.map((item) => {
                  const dueDateLabel = item.due_date ? `Frist ${item.due_date}` : "Ingen frist satt";

                  return (
                    <article key={item.id} className="incident-card">
                      <div className="incident-card__head">
                        <div className="page-intro">
                          <h3>{item.title}</h3>
                          <p>{item.description}</p>
                        </div>
                        <span className="status-pill" data-tone={statusTone(item.status)}>
                          {prettyStatus(item.status)}
                        </span>
                      </div>

                      <div className="incident-card__meta">
                        <span className="chip">{item.date}</span>
                        <span className="chip">{prettyCategory(item.category)}</span>
                        <span className="chip">
                          <span className="severity-dot" data-level={severityKey(item.severity)} />
                          {prettySeverity(item.severity)}
                        </span>
                      </div>

                      <div className="incident-card__footer">
                        <span className="muted">{dueDateLabel}</span>
                        {item.measures ? <span className="muted">Tiltak: {item.measures}</span> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="pager">
              <button
                type="button"
                onClick={() => setFilter({ ...filter, page: Math.max(1, filter.page - 1) })}
                disabled={filter.page <= 1}
              >
                Forrige
              </button>
              <span className="muted">Side {filter.page}</span>
              <button
                type="button"
                onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
                disabled={data ? filter.page * filter.pageSize >= data.total : true}
              >
                Neste
              </button>
            </div>
          </article>
        </div>

        <div className="stack">
          <article className="card">
            <div className="page-intro">
              <p className="section-label">Registrer nytt avvik</p>
              <h2>Legg inn saken mens detaljene fortsatt er ferske.</h2>
              <p>{copy.formText}</p>
            </div>

            <form className="incident-form" onSubmit={onCreate}>
              <div className="field">
                <label htmlFor="title">Tittel</label>
                <input
                  id="title"
                  required
                  placeholder="Kort og tydelig sammendrag"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="description">Beskrivelse</label>
                <textarea
                  id="description"
                  required
                  placeholder="Beskriv hendelsen, konsekvens og hva som ble observert"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="date">Dato</label>
                  <input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>

                <div className="field">
                  <label htmlFor="dueDate">Frist</label>
                  <input
                    id="dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label htmlFor="category">Kategori</label>
                  <select id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {categories.filter(Boolean).map((category) => (
                      <option key={category} value={category}>
                        {prettyCategory(category)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="severity">Alvorlighet</label>
                  <select id="severity" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                    {severities.filter(Boolean).map((severity) => (
                      <option key={severity} value={severity}>
                        {prettySeverity(severity)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="measures">Tiltak</label>
                <input
                  id="measures"
                  placeholder="Valgfritt forslag til tiltak"
                  value={form.measures}
                  onChange={(e) => setForm({ ...form, measures: e.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="assigneeUserId">{copy.ownerLabel}</label>
                <input
                  id="assigneeUserId"
                  placeholder="Valgfritt"
                  value={form.assigneeUserId}
                  onChange={(e) => setForm({ ...form, assigneeUserId: e.target.value })}
                />
                <p className="field-hint">Kan brukes dersom saken allerede har en tydelig eier.</p>
              </div>

              <button className="btn" type="submit" disabled={creating}>
                {creating ? "Lagrer..." : "Registrer avvik"}
              </button>
            </form>
          </article>

          <article className="card">
            <div className="page-intro">
              <p className="section-label">Praktiske tips</p>
              <h2>{copy.qualityTitle}</h2>
            </div>
            <div className="insight-grid">
              <div className="insight-item">
                <strong>Skriv konkret</strong>
                <span className="muted">{copy.concreteText}</span>
              </div>
              <div className="insight-item">
                <strong>Legg til frist ved behov</strong>
                <span className="muted">{copy.deadlineText}</span>
              </div>
              <div className="insight-item">
                <strong>Bruk kategori aktivt</strong>
                <span className="muted">Kategorisering hjelper senere rapportering og trendanalyse.</span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
