import { NavLink } from "react-router-dom";

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

export default function DocumentsPage({ moduleView = "overview" }: { moduleView?: "overview" | "library" }) {
  const isLibrary = moduleView === "library";
  const cardsToShow = isLibrary ? cards.slice(0, 2) : cards;

  return (
    <div className="page">
      <section className="page-hero">
        <div className="page-intro">
          <p className="section-label">Dokumentstyring</p>
          <h2 className="page-hero__title">
            {isLibrary ? "Få biblioteket over i en tydelig, søkbar arbeidsflate." : "Gi dokumentene en arbeidsflate som faktisk inviterer til orden."}
          </h2>
          <p>
            {isLibrary
              ? "Biblioteksiden skal samle gjeldende dokumenter, filtrering og revisjonskontroll på ett sted."
              : "Denne siden er klargjort som et tydelig startpunkt for opplasting, versjoner og revisjonskontroll."}
          </p>
        </div>
        <div className="hero-panel">
          <p className="section-label">Neste naturlige steg</p>
          <h3>{isLibrary ? "Bygg et søkbart dokumentbibliotek for hele virksomheten." : "Bygg et bibliotek med filtrering, ansvarlig og revisjonsdato."}</h3>
          <div className="hero-panel__grid">
            <div className="hero-panel__item">
              <span className="hero-panel__value">{isLibrary ? 6 : 18}</span>
              <span>{isLibrary ? "foreslåtte filtre og metadatafelt" : "forslag til dokumentkategorier"}</span>
            </div>
            <div className="hero-panel__item">
              <span className="hero-panel__value">1</span>
              <span>felles arbeidsflate for alle team</span>
            </div>
          </div>
        </div>
      </section>

      <section className="crm-module-nav">
        <NavLink to="/documents" className="crm-module-nav__link">
          Dokumentoversikt
        </NavLink>
        <NavLink to="/documents/library" className="crm-module-nav__link">
          Bibliotek
        </NavLink>
      </section>

      <section className="placeholder-grid">
        {cardsToShow.map((card) => (
          <article key={card.title} className="placeholder-card">
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </section>

      <section className="card">
        <div className="page-intro">
          <p className="section-label">{isLibrary ? "Bibliotek" : "Anbefalt innhold"}</p>
          <h2>{isLibrary ? "Biblioteket bør være enkelt å skanne og lett å vedlikeholde." : "Et pent arkiv bør føles trygt, lett og forutsigbart."}</h2>
          <p>
            {isLibrary
              ? "Her kan vi neste steg legge inn dokumentliste, filterchips, eier, versjon og revisjonsdato."
              : "Her kan vi senere legge inn dokumentliste, statusfelt, eier og revisjonshistorikk."}
          </p>
        </div>
      </section>
    </div>
  );
}
