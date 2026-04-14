import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { clearStoredAuth, readStoredAuth, writeStoredAuth, type StoredAuth } from "./lib/auth";
import { getMyProfile, type AuthUser } from "./lib/api";
import DocumentsPage from "./pages/DocumentsPage";
import CompaniesPage from "./pages/CompaniesPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import IncidentTypesPage from "./pages/IncidentTypesPage";
import IncidentsPage from "./pages/IncidentsPage";
import InspectionsPage from "./pages/InspectionsPage";
import KpiPage from "./pages/KpiPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import SurveysPage from "./pages/SurveysPage";
import UsersPage from "./pages/UsersPage";

type NavItem = {
  to: string;
  label: string;
  icon: string;
  roles?: AuthUser["role"][];
};

const navigation: NavItem[] = [
  { to: "/kpi", label: "Oversikt", icon: "OV" },
  { to: "/incidents", label: "Avvik", icon: "AV" },
  { to: "/documents", label: "Dokumenter", icon: "DO" },
  { to: "/surveys", label: "Unders\u00F8kelser", icon: "UN" },
  { to: "/inspections", label: "Vernerunder", icon: "VR" },
  { to: "/companies", label: "Firma", icon: "FI", roles: ["superadmin"] },
  { to: "/departments", label: "Avdelinger", icon: "AD", roles: ["superadmin", "company_admin"] },
  { to: "/incident-types", label: "Avvikstyper", icon: "AT", roles: ["superadmin", "company_admin"] },
  { to: "/users", label: "Brukere", icon: "BR", roles: ["superadmin", "company_admin", "manager"] },
  { to: "/profile", label: "Min profil", icon: "PR" },
];

const copy = {
  darkMode: "M\u00F8rk modus",
  qualitySuite: "Kvalitet, risiko og oppf\u00F8lging samlet i ett arbeidsverkt\u00F8y.",
  focusTitle: "F\u00E5 oversikt raskt og jobb videre uten st\u00F8y.",
  focusText: "Systemet er best n\u00E5r neste steg er tydelig i alle moduler.",
};

function ThemeToggle() {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Bytt fargetema"
    >
      <span className="theme-toggle__icon">{theme === "light" ? "DK" : "LY"}</span>
      <span>{theme === "light" ? copy.darkMode : "Lys modus"}</span>
    </button>
  );
}

function Layout({
  user,
  onLogout,
  children,
}: {
  user: AuthUser;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const location = useLocation();

  const visibleNavigation = useMemo(() => {
    return navigation.filter((item) => !item.roles || item.roles.includes(user.role));
  }, [user.role]);

  const currentPage = useMemo(() => {
    return visibleNavigation.find((item) => location.pathname === item.to) ?? visibleNavigation[0];
  }, [location.pathname, visibleNavigation]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__panel">
          <div className="brand">
            <div className="brand__eyebrow">TQM Plattform</div>
            <Link to="/kpi" className="brand__title">
              Styringssystem
            </Link>
            <p className="brand__text">{copy.qualitySuite}</p>
          </div>

          <div className="sidebar__card">
            <p className="sidebar__card-label">Logget inn som</p>
            <strong>{user.fullName}</strong>
            <span>
              {user.role}
              {user.jobTitle ? ` | ${user.jobTitle}` : ""}
            </span>
          </div>

          <nav className="nav">
            {visibleNavigation.map((item) => (
              <NavLink key={item.to} to={item.to} className="nav__link">
                <span className="nav__icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar__card">
            <p className="sidebar__card-label">Dagens fokus</p>
            <strong>{copy.focusTitle}</strong>
            <span>{copy.focusText}</span>
          </div>

          <button className="btn-secondary sidebar__logout" type="button" onClick={onLogout}>
            Logg ut
          </button>
          <ThemeToggle />
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="topbar__eyebrow">Intern kvalitet og styring</p>
            <h1 className="topbar__title">{currentPage?.label ?? "Oversikt"}</h1>
          </div>
          <div className="topbar__status">
            <span className="status-dot" />
            Systemet er klart for arbeid
          </div>
        </header>

        <div className="content">{children}</div>
      </main>
    </div>
  );
}

function ProtectedApp({
  auth,
  onAuthChange,
}: {
  auth: StoredAuth;
  onAuthChange: (value: StoredAuth | null) => void;
}) {
  const [profile, setProfile] = useState<AuthUser>(auth.user);

  useEffect(() => {
    setProfile(auth.user);
  }, [auth.user]);

  useEffect(() => {
    let active = true;

    getMyProfile(auth.token)
      .then((user) => {
        if (!active) return;
        setProfile(user);
        onAuthChange({ token: auth.token, user });
      })
      .catch(() => {
        if (!active) return;
        onAuthChange(null);
      });

    return () => {
      active = false;
    };
  }, [auth.token, onAuthChange]);

  function handleLogout() {
    clearStoredAuth();
    onAuthChange(null);
  }

  return (
    <Layout user={profile} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/kpi" replace />} />
        <Route path="/login" element={<Navigate to="/kpi" replace />} />
        <Route path="/kpi" element={<KpiPage />} />
        <Route path="/incidents" element={<IncidentsPage token={auth.token} />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/surveys" element={<SurveysPage />} />
        <Route path="/inspections" element={<InspectionsPage />} />
        <Route path="/profile" element={<ProfilePage user={profile} />} />
        <Route
          path="/companies"
          element={
            profile.role !== "superadmin" ? (
              <Navigate to="/profile" replace />
            ) : (
              <CompaniesPage token={auth.token} currentUser={profile} />
            )
          }
        />
        <Route
          path="/departments"
          element={
            profile.role === "employee" || profile.role === "viewer" || profile.role === "manager" ? (
              <Navigate to="/profile" replace />
            ) : (
              <DepartmentsPage token={auth.token} currentUser={profile} />
            )
          }
        />
        <Route
          path="/incident-types"
          element={
            profile.role === "employee" || profile.role === "viewer" || profile.role === "manager" ? (
              <Navigate to="/profile" replace />
            ) : (
              <IncidentTypesPage token={auth.token} currentUser={profile} />
            )
          }
        />
        <Route
          path="/users"
          element={
            profile.role === "employee" || profile.role === "viewer" ? (
              <Navigate to="/profile" replace />
            ) : (
              <UsersPage token={auth.token} currentUser={profile} />
            )
          }
        />
        <Route path="*" element={<Navigate to="/kpi" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  const [auth, setAuth] = useState<StoredAuth | null>(() => readStoredAuth());

  function handleAuthenticated(token: string, user: AuthUser) {
    const value = { token, user };
    writeStoredAuth(value);
    setAuth(value);
  }

  if (!auth) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage onAuthenticated={handleAuthenticated} />} />
      </Routes>
    );
  }

  return <ProtectedApp auth={auth} onAuthChange={setAuth} />;
}
