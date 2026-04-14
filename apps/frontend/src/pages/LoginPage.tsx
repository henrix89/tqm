import { useState } from "react";
import { changePassword, login, type AuthUser } from "../lib/api";

type Props = {
  onAuthenticated: (token: string, user: AuthUser) => void;
};

export default function LoginPage({ onAuthenticated }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await login(email, password);
      if (result.mustChangePassword) {
        setPendingToken(result.token);
        setPendingUser(result.user);
        setCurrentPassword(password);
        return;
      }

      onAuthenticated(result.token, result.user);
    } catch (err: any) {
      setError(err?.message ?? "Innlogging feilet");
    } finally {
      setLoading(false);
    }
  }

  async function onPasswordChangeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingToken || !pendingUser) return;

    setLoading(true);
    setError(null);

    try {
      const result = await changePassword(pendingToken, currentPassword, newPassword);
      onAuthenticated(result.token, result.user);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke endre passord");
    } finally {
      setLoading(false);
    }
  }

  const forcePasswordChange = Boolean(pendingToken && pendingUser);

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <div className="auth-hero">
          <p className="section-label">Internt styringssystem</p>
          <h1>{forcePasswordChange ? "Bytt passord" : "Logg inn"}</h1>
          <p>
            {forcePasswordChange
              ? "Du må bytte passord før du kan fortsette."
              : "Bruk e-post og passord for å få tilgang til avvik, dokumenter, KPI, vernerunder og brukeradministrasjon."}
          </p>
        </div>

        {error ? <div className="alert">{error}</div> : null}

        {!forcePasswordChange ? (
          <form className="stack" onSubmit={onLoginSubmit}>
            <div className="field">
              <label htmlFor="email">E-post</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="password">Passord</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Logger inn..." : "Logg inn"}
            </button>
          </form>
        ) : (
          <form className="stack" onSubmit={onPasswordChangeSubmit}>
            <div className="field">
              <label htmlFor="current-password">Nåværende passord</label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="new-password">Nytt passord</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Oppdaterer..." : "Lagre nytt passord"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
