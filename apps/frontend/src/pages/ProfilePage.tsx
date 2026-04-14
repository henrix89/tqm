import type { AuthUser } from "../lib/api";

type Props = {
  user: AuthUser;
};

export default function ProfilePage({ user }: Props) {
  const fields = [
    { label: "Navn", value: user.fullName },
    { label: "E-post", value: user.email },
    { label: "Rolle", value: user.role },
    { label: "Stilling", value: user.jobTitle || "Ikke satt" },
    { label: "Avdeling", value: user.departmentId || "Ikke koblet til avdeling" },
    { label: "Firma", value: user.companyId },
    { label: "Nærmeste leder", value: user.reportsToUserId || "Ikke satt" },
    { label: "Siste innlogging", value: user.lastLoginAt || "Ingen registrert innlogging" },
  ];

  return (
    <div className="page">
      <section className="page-hero">
        <div className="page-intro">
          <p className="section-label">Min profil</p>
          <h2 className="page-hero__title">Se kontoinformasjon, rolle og organisasjonstilknytning.</h2>
          <p>Denne siden samler det viktigste om deg som bruker i systemet.</p>
        </div>
        <div className="hero-panel">
          <p className="section-label">Status</p>
          <h3>{user.mustChangePassword ? "Passordbytte kreves" : "Kontoen er klar til bruk"}</h3>
          <div className="hero-panel__grid">
            <div className="hero-panel__item">
              <span className="hero-panel__value">{user.role}</span>
              <span>aktiv rolle i systemet</span>
            </div>
            <div className="hero-panel__item">
              <span className="hero-panel__value">{user.isActive ? "Aktiv" : "Inaktiv"}</span>
              <span>tilgangsstatus</span>
            </div>
          </div>
        </div>
      </section>

      <section className="placeholder-grid">
        {fields.map((field) => (
          <article key={field.label} className="placeholder-card">
            <p className="section-label">{field.label}</p>
            <h3>{field.value}</h3>
          </article>
        ))}
      </section>
    </div>
  );
}
