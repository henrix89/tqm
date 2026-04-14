const summary = [
  { value: "24", label: "aktive avvik", hint: "5 trenger oppf\u00F8lging denne uken" },
  { value: "91%", label: "dokumentdekning", hint: "oppdatert siste 90 dager" },
  { value: "3", label: "planlagte vernerunder", hint: "neste gjennomf\u00F8res fredag" },
];

const focusAreas = [
  { title: "Ledelsesoversikt", text: "F\u00E5 en rask status p\u00E5 kvalitet, HMS og forbedringsarbeid i samme bilde." },
  { title: "Trygg oppf\u00F8lging", text: "Se hvilke saker som haster, og hvilke team som trenger st\u00F8tte." },
  { title: "Enklere prioritering", text: "Bruk tall, frister og kategorier for \u00E5 prioritere neste tiltak." },
];

const heroTitle = "Se hva som krever oppmerksomhet, uten \u00E5 lete etter det.";
const heroText =
  "Oversikten samler avvik, dokumentstatus og planlagte aktiviteter i et uttrykk som er tydelig nok for daglig bruk og rolig nok til \u00E5 gi rask kontroll.";
const heroBadge = "Klar for oppf\u00F8lging";
const weekTitle = "Fire saker peker seg ut som viktigst akkurat n\u00E5.";
const highPriority = "\u00E5pne tiltak med h\u00F8y prioritet";
const moduleTitle = "Hver modul skal gi samme opplevelse: tydelig status, tydelig handling.";

export default function KpiPage() {
  return (
    <div className="page">
      <section className="page-hero">
        <div className="page-intro">
          <p className="section-label">Helhetlig styring</p>
          <h2 className="page-hero__title">{heroTitle}</h2>
          <p>{heroText}</p>
          <div className="hero-badges">
            <span className="hero-badge">Samlet status</span>
            <span className="hero-badge">Prioriterte tiltak</span>
            <span className="hero-badge">{heroBadge}</span>
          </div>
        </div>

        <div className="hero-panel">
          <p className="section-label">Ukens status</p>
          <h3>{weekTitle}</h3>
          <div className="hero-panel__grid">
            <div className="hero-panel__item">
              <span className="hero-panel__value">4</span>
              <span>{highPriority}</span>
            </div>
            <div className="hero-panel__item">
              <span className="hero-panel__value">12</span>
              <span>dokumenter til revisjon</span>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {summary.map((item) => (
          <article key={item.label} className="stat-card">
            <span className="stat-card__value">{item.value}</span>
            <strong>{item.label}</strong>
            <p className="stat-card__hint">{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="card">
        <div className="section-header">
          <div className="page-intro">
            <p className="section-label">Arbeidsflate</p>
            <h2>{moduleTitle}</h2>
          </div>
        </div>
        <div className="feature-grid">
          {focusAreas.map((item) => (
            <article key={item.title} className="placeholder-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
