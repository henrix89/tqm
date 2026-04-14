const cards = [
  {
    title: "Dokumentbibliotek",
    text: "Samle prosedyrer, maler og styrende dokumenter på ett sted med tydelig eierskap.",
  },
  {
    title: "Versjonskontroll",
    text: "Se hva som er gjeldende, hva som er under arbeid, og hva som må arkiveres.",
  },
  {
    title: "Fordeling og lesing",
    text: "Gjør det enklere å bekrefte at riktige personer har tilgang til riktig innhold.",
  },
];

export default function DocumentsPage() {
  return (
    <div className="page">
      <section className="page-hero">
        <div className="page-intro">
          <p className="section-label">Dokumentstyring</p>
          <h2 className="page-hero__title">Gi dokumentene en arbeidsflate som faktisk inviterer til orden.</h2>
          <p>
            Denne siden er klargjort som et tydelig startpunkt for opplasting, versjoner og revisjonskontroll.
          </p>
        </div>
        <div className="hero-panel">
          <p className="section-label">Neste naturlige steg</p>
          <h3>Bygg et bibliotek med filtrering, ansvarlig og revisjonsdato.</h3>
          <div className="hero-panel__grid">
            <div className="hero-panel__item">
              <span className="hero-panel__value">18</span>
              <span>forslag til dokumentkategorier</span>
            </div>
            <div className="hero-panel__item">
              <span className="hero-panel__value">1</span>
              <span>felles arbeidsflate for alle team</span>
            </div>
          </div>
        </div>
      </section>

      <section className="placeholder-grid">
        {cards.map((card) => (
          <article key={card.title} className="placeholder-card">
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </section>

      <section className="card">
        <div className="page-intro">
          <p className="section-label">Anbefalt innhold</p>
          <h2>Et pent arkiv bør føles trygt, lett og forutsigbart.</h2>
          <p>Her kan vi senere legge inn dokumentliste, statusfelt, eier og revisjonshistorikk.</p>
        </div>
      </section>
    </div>
  );
}
