const surveySteps = [
  "Lag en mal med tydelige temaer og svarskalaer.",
  "Velg hvem som skal svare og når utsendingen skal skje.",
  "Følg svarene i en ryddig oversikt med anbefalte tiltak.",
];

export default function SurveysPage() {
  return (
    <div className="page">
      <section className="page-hero">
        <div className="page-intro">
          <p className="section-label">Innspill og temperatur</p>
          <h2 className="page-hero__title">Gjør undersøkelser enkle å sende ut, svare på og følge opp.</h2>
          <p>
            Arbeidsflaten er redesignet for å egne seg til korte pulsmålinger, medarbeiderinnspill og forbedringsrunder.
          </p>
        </div>
        <div className="hero-panel">
          <p className="section-label">Bruksmål</p>
          <h3>Passer godt til både jevnlige temperaturmålinger og konkrete forbedringsbehov.</h3>
          <div className="hero-panel__grid">
            <div className="hero-panel__item">
              <span className="hero-panel__value">5 min</span>
              <span>ønsket svartid per skjema</span>
            </div>
            <div className="hero-panel__item">
              <span className="hero-panel__value">100%</span>
              <span>fokus på tydelige neste steg</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="page-intro">
          <p className="section-label">Slik kan siden brukes</p>
          <h2>Et godt undersøkelsesgrensesnitt skal kjennes lett, tydelig og handlingsrettet.</h2>
        </div>
        <ol className="placeholder-list">
          {surveySteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
