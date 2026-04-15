import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { getMyProfile, listNotifications, markAllNotificationsRead, markNotificationRead, type AuthUser, type NotificationItem } from "./lib/api";
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
  | "dashboard"
  | "users"
  | "building"
  | "reports"
  | "documents"
  | "surveys"
  | "shield"
  | "settings"
  | "briefcase"
  | "triangle"
  | "profile"
  | "menu"
  | "moon"
  | "sun"
  | "logout"
  | "home"
  | "bell"
  | "help";

type NavItem = {
  to: string;
  label: string;
  icon?: IconName;
  roles?: AuthUser["role"][];
  children?: NavItem[];
};

const navigation: NavItem[] = [
  { to: "/kpi", label: "Dashboard", icon: "dashboard" },
  {
    to: "/users",
    label: "Brukere",
    icon: "users",
    roles: ["superadmin", "company_admin", "manager"],
    children: [
      { to: "/users", label: "Brukeroversikt" },
      { to: "/users/new", label: "Ny bruker" },
    ],
  },
  {
    to: "/departments",
    label: "Avdelinger",
    icon: "building",
    roles: ["superadmin", "company_admin"],
    children: [
      { to: "/departments", label: "Avdelingsoversikt" },
      { to: "/departments/new", label: "Ny avdeling" },
    ],
  },
  {
    to: "/crm/customers",
    label: "CRM",
    icon: "briefcase",
    children: [
      { to: "/crm/customers", label: "Kunderegister" },
      { to: "/crm/customers/new", label: "Ny kunde" },
      { to: "/crm/activities", label: "Aktiviteter" },
      { to: "/crm/messages", label: "Meldinger" },
      { to: "/crm/issues", label: "Kundeavvik" },
    ],
  },
  {
    to: "/incidents",
    label: "Avvik",
    icon: "triangle",
    children: [
      { to: "/incidents", label: "Avviksoversikt" },
      { to: "/incidents/new", label: "Nytt avvik" },
    ],
  },
  {
    to: "/documents",
    label: "Dokumenter",
    icon: "documents",
    children: [
      { to: "/documents", label: "Dokumentoversikt" },
      { to: "/documents/library", label: "Bibliotek" },
    ],
  },
  {
    to: "/surveys",
    label: "Undersøkelser",
    icon: "surveys",
    children: [
      { to: "/surveys", label: "Undersøkelsesoversikt" },
      { to: "/surveys/new", label: "Ny undersøkelse" },
    ],
  },
  {
    to: "/inspections",
    label: "Vernerunder",
    icon: "shield",
    children: [
      { to: "/inspections", label: "Vernerundeoversikt" },
      { to: "/inspections/new", label: "Ny vernerunde" },
    ],
  },
  {
    to: "/incident-types",
    label: "Avvikstyper",
    icon: "reports",
    roles: ["superadmin", "company_admin"],
    children: [
      { to: "/incident-types", label: "Typeoversikt" },
      { to: "/incident-types/new", label: "Ny avvikstype" },
    ],
  },
  {
    to: "/companies",
    label: "Firma",
    icon: "settings",
    roles: ["superadmin"],
    children: [
      { to: "/companies", label: "Firmaoversikt" },
      { to: "/companies/new", label: "Nytt firma" },
    ],
  },
  { to: "/profile", label: "Min profil", icon: "profile" },
];

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
      {name === "dashboard" ? (
        <>
          <rect {...common} x="3.5" y="3.5" width="7" height="7" rx="1.4" />
          <rect {...common} x="13.5" y="3.5" width="7" height="4.5" rx="1.4" />
          <rect {...common} x="13.5" y="10.5" width="7" height="10" rx="1.4" />
          <rect {...common} x="3.5" y="13" width="7" height="7.5" rx="1.4" />
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
      {name === "building" ? (
        <>
          <path {...common} d="M4 20.5h16" />
          <path {...common} d="M6 20.5V6.5h8v14" />
          <path {...common} d="M14 20.5v-10h4v10" />
          <path {...common} d="M8.5 9.5h2M8.5 12.5h2M8.5 15.5h2" />
        </>
      ) : null}
      {name === "reports" ? (
        <>
          <path {...common} d="M6 19.5h12" />
          <path {...common} d="M8 16V9" />
          <path {...common} d="M12 16V5" />
          <path {...common} d="M16 16v-7" />
        </>
      ) : null}
      {name === "documents" ? (
        <>
          <path {...common} d="M6 3.5h8l4 4v13H6z" />
          <path {...common} d="M14 3.5v4h4" />
          <path {...common} d="M9 12h6M9 16h6" />
        </>
      ) : null}
      {name === "surveys" ? (
        <>
          <path {...common} d="M8 6h8" />
          <path {...common} d="M8 12h8" />
          <path {...common} d="M8 18h5" />
          <rect {...common} x="4" y="4" width="16" height="16" rx="2" />
        </>
      ) : null}
      {name === "shield" ? (
        <>
          <path {...common} d="M12 3 5 6v5c0 4.4 2.7 8.4 7 10 4.3-1.6 7-5.6 7-10V6Z" />
          <path {...common} d="m9.5 12 1.8 1.8L15 10.2" />
        </>
      ) : null}
      {name === "settings" ? (
        <>
          <path {...common} d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
          <path {...common} d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4.8a8 8 0 0 0-1.7-1L14.5 3h-5l-.3 2.8a8 8 0 0 0-1.7 1L5 6l-2 3.5L5 11a7 7 0 0 0 0 2l-2 1.5L5 18l2.5-.8a8 8 0 0 0 1.7 1l.3 2.8h5l.3-2.8a8 8 0 0 0 1.7-1l2.4.8 2-3.5-2-1.5c.1-.3.1-.7.1-1Z" />
        </>
      ) : null}
      {name === "briefcase" ? (
        <>
          <path {...common} d="M4 9.5h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
          <path {...common} d="M9 9.5V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2.5" />
          <path {...common} d="M4 12h16" />
        </>
      ) : null}
      {name === "triangle" ? (
        <>
          <path {...common} d="M12 4 21 19H3Z" />
          <path {...common} d="M12 9v4.5" />
          <path {...common} d="M12 16.5h.01" />
        </>
      ) : null}
      {name === "profile" ? (
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
      {name === "home" ? (
        <>
          <path {...common} d="M3 10.5 12 3l9 7.5" />
          <path {...common} d="M5.5 9.5V20h13V9.5" />
        </>
      ) : null}
      {name === "bell" ? (
        <>
          <path {...common} d="M7.5 17h9" />
          <path {...common} d="M9 20a3 3 0 0 0 6 0" />
          <path {...common} d="M18 17V11a6 6 0 1 0-12 0v6l-1.5 1.5h15Z" />
        </>
      ) : null}
      {name === "help" ? (
        <>
          <circle {...common} cx="12" cy="12" r="9" />
          <path {...common} d="M9.5 9.5a2.8 2.8 0 1 1 4.2 2.4c-.8.4-1.2.9-1.2 1.6v.5" />
          <path {...common} d="M12 17.5h.01" />
        </>
      ) : null}
    </svg>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const isLight = theme === "light";

  return (
    <button
      className="dashboard-theme-toggle"
      type="button"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      aria-label="Bytt fargetema"
      title={isLight ? "Mørk modus" : "Lys modus"}
    >
      <AppIcon name={isLight ? "moon" : "sun"} className="app-icon" />
    </button>
  );
}

function Layout({
  token,
  user,
  onLogout,
  children,
}: {
  token: string;
  user: AuthUser;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const visibleNavigation = useMemo(
    () => navigation.filter((item) => !item.roles || item.roles.includes(user.role)),
    [user.role]
  );

  const currentPage = useMemo(() => {
    function find(items: NavItem[]): NavItem | undefined {
      for (const item of items) {
        if (location.pathname === item.to) return item;
        if (item.children) {
          const child = item.children.find((entry) => location.pathname === entry.to);
          if (child) return child;
        }
      }

      return items.find((item) => location.pathname.startsWith(item.to)) ?? items[0];
    }

    return find(visibleNavigation);
  }, [location.pathname, visibleNavigation]);

  function isGroupOpen(item: NavItem) {
    return Boolean(item.children?.length) && location.pathname.startsWith(item.to);
  }

  useEffect(() => {
    let active = true;

    listNotifications(token)
      .then((result) => {
        if (!active) return;
        setNotifications(result.items);
        setUnreadCount(result.unreadCount);
      })
      .catch(() => {
        if (!active) return;
      });

    return () => {
      active = false;
    };
  }, [location.pathname, token]);

  async function handleNotificationClick(item: NotificationItem) {
    try {
      if (!item.isRead) {
        await markNotificationRead(token, item.id);
        setNotifications((current) => current.map((entry) => (entry.id === item.id ? { ...entry, isRead: true } : entry)));
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch {}

    setNotificationsOpen(false);
    navigate(item.link || "/crm/customers");
  }

  async function handleReadAll() {
    try {
      await markAllNotificationsRead(token);
      setNotifications((current) => current.map((entry) => ({ ...entry, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }

  return (
    <div className={`shell dashboard-shell ${sidebarOpen ? "shell--sidebar-open" : "shell--sidebar-collapsed"}`}>
      <aside className={`sidebar dashboard-sidebar ${sidebarOpen ? "sidebar--open" : "sidebar--collapsed"}`}>
        <div className="sidebar__panel dashboard-sidebar__panel">
          <div className="dashboard-brand">
            <div className="dashboard-brand__avatar">
              <AppIcon name="profile" className="app-icon" />
            </div>
            {sidebarOpen ? (
              <div className="dashboard-brand__copy">
                <div className="dashboard-brand__title">Admin Dashboard</div>
                <div className="dashboard-brand__subtitle">TQM Platform</div>
              </div>
            ) : null}
          </div>

          <nav className="nav dashboard-nav">
            {visibleNavigation.map((item) => (
              <div key={item.to} className="dashboard-nav__group">
                <NavLink to={item.to} className="nav__link dashboard-nav__link" title={item.label}>
                  {item.icon ? (
                    <span className="nav__icon dashboard-nav__icon">
                      <AppIcon name={item.icon} className="app-icon" />
                    </span>
                  ) : null}
                  {sidebarOpen ? <span className="nav__label">{item.label}</span> : null}
                </NavLink>

                {sidebarOpen && isGroupOpen(item) && item.children?.length ? (
                  <div className="dashboard-subnav">
                    {item.children.map((child) => (
                      <NavLink key={child.to} to={child.to} className="dashboard-subnav__link" title={child.label}>
                        <span>{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>

          <div className="dashboard-sidebar__footer">
            {sidebarOpen ? (
              <div className="dashboard-user-card">
                <div className="dashboard-user-card__avatar">{user.firstName?.slice(0, 1) || "U"}</div>
                <div className="dashboard-user-card__copy">
                  <strong>{user.fullName}</strong>
                  <span>{roleLabels[user.role]}</span>
                </div>
              </div>
            ) : null}

            <div className="dashboard-sidebar__actions">
              <button
                className="dashboard-icon-button"
                type="button"
                onClick={() => setSidebarOpen((value) => !value)}
                title={sidebarOpen ? "Kollaps meny" : "Åpne meny"}
              >
                <AppIcon name="menu" className="app-icon" />
              </button>
              <ThemeToggle />
              <button className="dashboard-logout" type="button" onClick={onLogout}>
                <AppIcon name="logout" className="app-icon" />
                {sidebarOpen ? <span>Logg ut</span> : null}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="main dashboard-main">
        <header className="topbar dashboard-topbar">
          <div className="dashboard-topbar__left">
            <div className="dashboard-topbar__home">
              <AppIcon name="home" className="app-icon" />
            </div>
            <div className="dashboard-topbar__titles">
              <p className="topbar__eyebrow">Intern kvalitet og styring</p>
              <h1 className="topbar__title">{currentPage?.label ?? "Dashboard"}</h1>
            </div>
          </div>

          <div className="dashboard-topbar__right">
            <div className="dashboard-notifications">
              <button
                className="dashboard-icon-button"
                type="button"
                title="Varsler"
                onClick={() => setNotificationsOpen((value) => !value)}
              >
                <AppIcon name="bell" className="app-icon" />
                {unreadCount > 0 ? <span className="dashboard-icon-button__badge">{unreadCount}</span> : null}
              </button>
              {notificationsOpen ? (
                <div className="dashboard-notifications__panel">
                  <div className="dashboard-notifications__header">
                    <strong>Varsler</strong>
                    <button className="btn-secondary" type="button" onClick={() => void handleReadAll()}>
                      Marker alle som lest
                    </button>
                  </div>
                  <div className="dashboard-notifications__list">
                    {notifications.length === 0 ? (
                      <p className="muted">Ingen varsler ennå.</p>
                    ) : (
                      notifications.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`dashboard-notification ${item.isRead ? "" : "dashboard-notification--unread"}`}
                          onClick={() => void handleNotificationClick(item)}
                        >
                          <strong>{item.title}</strong>
                          <span>{item.message}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <button className="dashboard-icon-button" type="button" title="Hjelp">
              <AppIcon name="help" className="app-icon" />
            </button>
            <div className="dashboard-profile-pill">
              <div className="dashboard-profile-pill__avatar">{user.firstName?.slice(0, 1) || "U"}</div>
              <div className="dashboard-profile-pill__copy">
                <strong>{user.fullName}</strong>
                <span>{roleLabels[user.role]}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="content dashboard-content">{children}</div>
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
    <Layout token={auth.token} user={profile} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/kpi" replace />} />
        <Route path="/login" element={<Navigate to="/kpi" replace />} />
        <Route path="/kpi" element={<KpiPage />} />
        <Route path="/incidents" element={<IncidentsPage token={auth.token} moduleView="list" />} />
        <Route path="/incidents/new" element={<IncidentsPage token={auth.token} moduleView="create" />} />
        <Route path="/crm/customers" element={<CrmCustomersPage token={auth.token} currentUser={profile} moduleView="customers" />} />
        <Route path="/crm/customers/new" element={<CrmCustomersPage token={auth.token} currentUser={profile} moduleView="create" />} />
        <Route path="/crm/activities" element={<CrmCustomersPage token={auth.token} currentUser={profile} moduleView="activities" />} />
        <Route path="/crm/messages" element={<CrmCustomersPage token={auth.token} currentUser={profile} moduleView="messages" />} />
        <Route path="/crm/issues" element={<CrmCustomersPage token={auth.token} currentUser={profile} moduleView="issues" />} />
        <Route path="/documents" element={<DocumentsPage moduleView="overview" />} />
        <Route path="/documents/library" element={<DocumentsPage moduleView="library" />} />
        <Route path="/surveys" element={<SurveysPage token={auth.token} moduleView="list" />} />
        <Route path="/surveys/new" element={<SurveysPage token={auth.token} moduleView="create" />} />
        <Route path="/inspections" element={<InspectionsPage token={auth.token} moduleView="list" />} />
        <Route path="/inspections/new" element={<InspectionsPage token={auth.token} moduleView="create" />} />
        <Route path="/profile" element={<ProfilePage user={profile} />} />
        <Route
          path="/companies"
          element={
            profile.role !== "superadmin" ? (
              <Navigate to="/profile" replace />
            ) : (
              <CompaniesPage token={auth.token} currentUser={profile} moduleView="list" />
            )
          }
        />
        <Route
          path="/companies/new"
          element={
            profile.role !== "superadmin" ? (
              <Navigate to="/profile" replace />
            ) : (
              <CompaniesPage token={auth.token} currentUser={profile} moduleView="create" />
            )
          }
        />
        <Route
          path="/departments"
          element={
            profile.role === "employee" || profile.role === "viewer" || profile.role === "manager" ? (
              <Navigate to="/profile" replace />
            ) : (
              <DepartmentsPage token={auth.token} currentUser={profile} moduleView="list" />
            )
          }
        />
        <Route
          path="/departments/new"
          element={
            profile.role === "employee" || profile.role === "viewer" || profile.role === "manager" ? (
              <Navigate to="/profile" replace />
            ) : (
              <DepartmentsPage token={auth.token} currentUser={profile} moduleView="create" />
            )
          }
        />
        <Route
          path="/incident-types"
          element={
            profile.role === "employee" || profile.role === "viewer" || profile.role === "manager" ? (
              <Navigate to="/profile" replace />
            ) : (
              <IncidentTypesPage token={auth.token} currentUser={profile} moduleView="list" />
            )
          }
        />
        <Route
          path="/incident-types/new"
          element={
            profile.role === "employee" || profile.role === "viewer" || profile.role === "manager" ? (
              <Navigate to="/profile" replace />
            ) : (
              <IncidentTypesPage token={auth.token} currentUser={profile} moduleView="create" />
            )
          }
        />
        <Route
          path="/users"
          element={
            profile.role === "employee" || profile.role === "viewer" ? (
              <Navigate to="/profile" replace />
            ) : (
              <UsersPage token={auth.token} currentUser={profile} moduleView="list" />
            )
          }
        />
        <Route
          path="/users/new"
          element={
            profile.role === "employee" || profile.role === "viewer" ? (
              <Navigate to="/profile" replace />
            ) : (
              <UsersPage token={auth.token} currentUser={profile} moduleView="create" />
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
