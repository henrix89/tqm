import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { getMyProfile, type AuthUser } from "./lib/api";
import { clearStoredAuth, readStoredAuth, writeStoredAuth, type StoredAuth } from "./lib/auth";
import { roleLabels } from "./lib/roles";
import CompaniesPage from "./pages/CompaniesPage";
import CrmCustomersPage from "./pages/CrmCustomersPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import DocumentsPage from "./pages/DocumentsPage";
import IncidentTypesPage from "./pages/IncidentTypesPage";
import IncidentsPage from "./pages/IncidentsPage";
import InspectionsPage from "./pages/InspectionsPage";
import KpiPage from "./pages/KpiPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import SurveysPage from "./pages/SurveysPage";
import UsersPage from "./pages/UsersPage";

type IconName =
  | "home"
  | "triangle"
  | "briefcase"
  | "folder"
  | "clipboard"
  | "shield"
  | "building"
  | "sitemap"
  | "tag"
  | "users"
  | "user"
  | "menu"
  | "moon"
  | "sun"
  | "logout";

type NavItem = {
  to: string;
  label: string;
  icon: IconName;
  roles?: AuthUser["role"][];
};

const navigation: NavItem[] = [
  { to: "/kpi", label: "Oversikt", icon: "home" },
  { to: "/incidents", label: "Avvik", icon: "triangle" },
  { to: "/crm/customers", label: "CRM", icon: "briefcase" },
  { to: "/documents", label: "Dokumenter", icon: "folder" },
  { to: "/surveys", label: "Undersøkelser", icon: "clipboard" },
  { to: "/inspections", label: "Vernerunder", icon: "shield" },
  { to: "/companies", label: "Firma", icon: "building", roles: ["superadmin"] },
  { to: "/departments", label: "Avdelinger", icon: "sitemap", roles: ["superadmin", "company_admin"] },
  { to: "/incident-types", label: "Avvikstyper", icon: "tag", roles: ["superadmin", "company_admin"] },
  { to: "/users", label: "Brukere", icon: "users", roles: ["superadmin", "company_admin", "manager"] },
  { to: "/profile", label: "Min profil", icon: "user" },
];

const copy = {
  darkMode: "Mørk modus",
  qualitySuite: "Kvalitet, risiko og oppfølging samlet i ett arbeidsverktøy.",
  clearTheme: "Lys modus",
};

function AppIcon({ name, className }: { name: IconName; className?: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      {name === "home" ? (
        <>
          <path {...common} d="M3 10.5 12 3l9 7.5" />
          <path {...common} d="M5.5 9.5V20h13V9.5" />
        </>
      ) : null}
      {name === "triangle" ? (
        <>
          <path {...common} d="M12 4 21 19H3Z" />
          <path {...common} d="M12 9v4.5" />
          <path {...common} d="M12 16.5h.01" />
        </>
      ) : null}
      {name === "briefcase" ? (
        <>
          <path {...common} d="M4 9.5h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
          <path {...common} d="M9 9.5V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2.5" />
          <path {...common} d="M4 12h16" />
        </>
      ) : null}
      {name === "folder" ? (
        <>
          <path {...common} d="M3.5 7.5h5l2 2h10v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
          <path {...common} d="M3.5 7.5V6a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v1.5" />
        </>
      ) : null}
      {name === "clipboard" ? (
        <>
          <path {...common} d="M9 4.5h6" />
          <path {...common} d="M9 3h6a1.5 1.5 0 0 1 1.5 1.5V6H19a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.5V4.5A1.5 1.5 0 0 1 9 3Z" />
          <path {...common} d="M8 11h8M8 15h5" />
        </>
      ) : null}
      {name === "shield" ? (
        <>
          <path {...common} d="M12 3 5 6v5c0 4.4 2.7 8.4 7 10 4.3-1.6 7-5.6 7-10V6Z" />
          <path {...common} d="m9.5 12 1.8 1.8L15 10.2" />
        </>
      ) : null}
      {name === "building" ? (
        <>
          <path {...common} d="M4 20.5h16" />
          <path {...common} d="M6 20.5V6.5h8v14" />
          <path {...common} d="M14 20.5v-10h4v10" />
          <path {...common} d="M8.5 9.5h2M8.5 12.5h2M8.5 15.5h2" />
        </>
      ) : null}
      {name === "sitemap" ? (
        <>
          <path {...common} d="M12 5v5" />
          <path {...common} d="M6 10h12" />
          <rect {...common} x="9" y="3" width="6" height="4" rx="1.2" />
          <rect {...common} x="3" y="10" width="6" height="4" rx="1.2" />
          <rect {...common} x="15" y="10" width="6" height="4" rx="1.2" />
          <rect {...common} x="9" y="17" width="6" height="4" rx="1.2" />
          <path {...common} d="M12 14v3" />
        </>
      ) : null}
      {name === "tag" ? (
        <>
          <path {...common} d="M20 13 11 22l-8-8 9-9h6l2 2Z" />
          <path {...common} d="M15.5 8.5h.01" />
        </>
      ) : null}
      {name === "users" ? (
        <>
          <path {...common} d="M16.5 19a4.5 4.5 0 0 0-9 0" />
          <circle {...common} cx="12" cy="9" r="3" />
          <path {...common} d="M19 18a3.5 3.5 0 0 0-2.8-3.4" />
          <path {...common} d="M16.2 6.6a3 3 0 0 1 0 4.8" />
        </>
      ) : null}
      {name === "user" ? (
        <>
          <circle {...common} cx="12" cy="8.5" r="3.5" />
          <path {...common} d="M5.5 20a6.5 6.5 0 0 1 13 0" />
        </>
      ) : null}
      {name === "menu" ? <path {...common} d="M4 7h16M4 12h16M4 17h16" /> : null}
      {name === "moon" ? <path {...common} d="M19 14.5A7.5 7.5 0 0 1 9.5 5a8 8 0 1 0 9.5 9.5Z" /> : null}
      {name === "sun" ? (
        <>
          <circle {...common} cx="12" cy="12" r="4" />
          <path {...common} d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6" />
        </>
      ) : null}
      {name === "logout" ? (
        <>
          <path {...common} d="M10 6V4.5A1.5 1.5 0 0 1 11.5 3h6A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 10 19.5V18" />
          <path {...common} d="M14 12H5" />
          <path {...common} d="m8.5 8.5-3.5 3.5 3.5 3.5" />
        </>
      ) : null}
    </svg>
  );
}

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const isLight = theme === "light";

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      aria-label="Bytt fargetema"
      title={isLight ? copy.darkMode : copy.clearTheme}
    >
      <span className="theme-toggle__icon">
        <AppIcon name={isLight ? "moon" : "sun"} className="app-icon" />
      </span>
      {!collapsed ? <span>{isLight ? copy.darkMode : copy.clearTheme}</span> : null}
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleNavigation = useMemo(
    () => navigation.filter((item) => !item.roles || item.roles.includes(user.role)),
    [user.role]
  );

  const currentPage = useMemo(
    () => visibleNavigation.find((item) => location.pathname === item.to) ?? visibleNavigation[0],
    [location.pathname, visibleNavigation]
  );

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className={`shell ${sidebarOpen ? "shell--sidebar-open" : "shell--sidebar-collapsed"}`}>
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : "sidebar--collapsed"}`}>
        <div className="sidebar__panel">
          <div className="sidebar__top">
            <button
              className="sidebar__toggle"
              type="button"
              onClick={() => setSidebarOpen((value) => !value)}
              aria-label={sidebarOpen ? "Skjul meny" : "Vis meny"}
            >
              <AppIcon name="menu" className="app-icon" />
            </button>

            <div className={`brand ${sidebarOpen ? "" : "brand--collapsed"}`}>
              <div className="brand__eyebrow">TQM Plattform</div>
              <Link to="/kpi" className="brand__title">
                Styringssystem
              </Link>
              {sidebarOpen ? <p className="brand__text">{copy.qualitySuite}</p> : null}
            </div>
          </div>

          {sidebarOpen ? (
            <div className="sidebar__card">
              <p className="sidebar__card-label">Logget inn som</p>
              <strong>{user.fullName}</strong>
              <span>
                {roleLabels[user.role]}
                {user.jobTitle ? ` | ${user.jobTitle}` : ""}
              </span>
            </div>
          ) : null}

          <nav className="nav">
            {visibleNavigation.map((item) => (
              <NavLink key={item.to} to={item.to} className="nav__link" title={item.label}>
                <span className="nav__icon">
                  <AppIcon name={item.icon} className="app-icon" />
                </span>
                {sidebarOpen ? <span className="nav__label">{item.label}</span> : null}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar__actions">
            <button className="btn-secondary sidebar__logout" type="button" onClick={onLogout} title="Logg ut">
              <span className="theme-toggle__icon">
                <AppIcon name="logout" className="app-icon" />
              </span>
              {sidebarOpen ? <span>Logg ut</span> : null}
            </button>

            <ThemeToggle collapsed={!sidebarOpen} />
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar__intro">
            <p className="topbar__eyebrow">Intern kvalitet og styring</p>
            <h1 className="topbar__title">{currentPage?.label ?? "Oversikt"}</h1>
          </div>
          <div className="topbar__status">
            <span className="status-dot" />
            <span>Klar for arbeid</span>
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
        <Route path="/crm/customers" element={<CrmCustomersPage token={auth.token} currentUser={profile} />} />
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
