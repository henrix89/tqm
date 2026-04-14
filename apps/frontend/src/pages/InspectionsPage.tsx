const inspectionCards = [
  { title: "Planlegg runder", text: "Sett tidspunkt, lokasjon og deltakere uten å rote bort historikk." },
  { title: "Registrer funn", text: "Knytt observasjoner til risiko, bilder og anbefalte tiltak." },
  { title: "Følg opp", text: "La funn bli konkrete oppgaver med ansvarlig og frist." },
];

export default function InspectionsPage() {
  return (
    <div className="page">
      <section className="page-hero">
        <div className="page-intro">
          <p className="section-label">Vernerunder</p>
          <h2 className="page-hero__title">Fra sjekkliste til oppfølging i en arbeidsflyt som er lett å stole på.</h2>
          <p>
            Siden er satt opp som en fremtidig base for planlegging, gjennomføring og oppfølging av vernerunder.
          </p>
        </div>
        <div className="hero-panel">
          <p className="section-label">Mest nyttig når</p>
          <h3>Teamet trenger oversikt over observasjoner, ansvar og fremdrift på ett sted.</h3>
          <div className="hero-panel__grid">
            <div className="hero-panel__item">
              <span className="hero-panel__value">1</span>
              <span>samlet arbeidsflate for funn og tiltak</span>
            </div>
            <div className="hero-panel__item">
              <span className="hero-panel__value">0</span>
              <span>unødige hopp mellom lister og notater</span>
            </div>
          </div>
        </div>
      </section>

      <section className="placeholder-grid">
        {inspectionCards.map((card) => (
          <article key={card.title} className="placeholder-card">
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
