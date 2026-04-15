const stats = [
  { label: "Active Users", value: "128", tone: "blue", icon: "users" },
  { label: "Open Incidents", value: "7", tone: "red", icon: "incident" },
  { label: "Upcoming Safety Rounds", value: "3", tone: "orange", icon: "shield" },
  { label: "Pending Surveys", value: "2", tone: "green", icon: "document" },
];

const registrations = [
  "Lise Nordli",
  "Steinar Berg",
  "Tom Eriksen",
  "Eva Holm",
  "Roger Nilsen",
];

const incidentLegend = [
  { label: "Open", value: 7, tone: "blue" },
  { label: "In Progress", value: 12, tone: "green" },
  { label: "Closed", value: 54, tone: "orange" },
  { label: "New", value: 4, tone: "red" },
  { label: "Overdue", value: 2, tone: "red" },
  { label: "Critical", value: 1, tone: "orange" },
];

const surveys = [
  { title: "Employee Satisfaction", status: "Ongoing" },
  { title: "Office Safety Check", status: "Scheduled" },
  { title: "HMS Compliance", status: "Completed" },
];

const activities = [
  { user: "Steinar Berg", action: "Reported Incident", date: "Today" },
  { user: "Julie Larsen", action: "Uploaded Document", date: "Yesterday" },
  { user: "Lars Olsen", action: "Updated KPI Report", date: "2 days ago" },
  { user: "Eva Holm", action: "Deactivated User", date: "3 days ago" },
];

function StatIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-icon">
      {name === "users" ? (
        <>
          <path d="M16.5 19a4.5 4.5 0 0 0-9 0" />
          <circle cx="12" cy="9" r="3" />
          <path d="M19 18a3.5 3.5 0 0 0-2.8-3.4" />
          <path d="M16.2 6.6a3 3 0 0 1 0 4.8" />
        </>
      ) : null}
      {name === "incident" ? (
        <>
          <path d="M12 4 21 19H3Z" />
          <path d="M12 9v4.5" />
          <path d="M12 16.5h.01" />
        </>
      ) : null}
      {name === "shield" ? (
        <>
          <path d="M12 3 5 6v5c0 4.4 2.7 8.4 7 10 4.3-1.6 7-5.6 7-10V6Z" />
          <path d="m9.5 12 1.8 1.8L15 10.2" />
        </>
      ) : null}
      {name === "document" ? (
        <>
          <path d="M6 3.5h8l4 4v13H6z" />
          <path d="M14 3.5v4h4" />
          <path d="M9 12h6M9 16h6" />
        </>
      ) : null}
    </svg>
  );
}

export default function KpiPage() {
  return (
    <div className="page dashboard-page">
      <section className="dashboard-stats">
        {stats.map((item) => (
          <article key={item.label} className="dashboard-stat-card">
            <div className={`dashboard-stat-card__icon dashboard-stat-card__icon--${item.tone}`}>
              <StatIcon name={item.icon} />
            </div>
            <div className="dashboard-stat-card__content">
              <span className="dashboard-stat-card__label">{item.label}</span>
              <strong className="dashboard-stat-card__value">{item.value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid dashboard-grid--top">
        <article className="dashboard-panel">
          <header className="dashboard-panel__header">
            <h2>User Management</h2>
          </header>

          <div className="dashboard-panel__actions">
            <button className="btn" type="button">
              Add User
            </button>
            <button className="btn-secondary" type="button">
              Manage Departments
            </button>
          </div>

          <div className="dashboard-panel__content dashboard-panel__content--split">
            <div className="dashboard-summary-list">
              <div className="dashboard-summary-list__item">
                <strong>Total Users: 128</strong>
              </div>
              <div className="dashboard-summary-list__item">Active: 120</div>
              <div className="dashboard-summary-list__item">Inactive: 8</div>
            </div>

            <div className="dashboard-mini-panel">
              <h3>Recent Registrations</h3>
              <div className="dashboard-people-list">
                {registrations.map((name) => (
                  <div key={name} className="dashboard-person">
                    <div className="dashboard-person__avatar">{name[0]}</div>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="dashboard-panel">
          <header className="dashboard-panel__header">
            <h2>Incident Overview</h2>
          </header>

          <div className="dashboard-chart">
            <div className="dashboard-donut">
              <div className="dashboard-donut__inner" />
              <div className="dashboard-donut__value dashboard-donut__value--top">7</div>
              <div className="dashboard-donut__value dashboard-donut__value--right">12</div>
              <div className="dashboard-donut__value dashboard-donut__value--bottom">22</div>
              <div className="dashboard-donut__value dashboard-donut__value--left">54</div>
            </div>

            <div className="dashboard-legend">
              {incidentLegend.map((item) => (
                <div key={`${item.label}-${item.value}`} className="dashboard-legend__item">
                  <span className={`dashboard-legend__dot dashboard-legend__dot--${item.tone}`} />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid--bottom">
        <article className="dashboard-panel">
          <header className="dashboard-panel__header">
            <h2>Latest Surveys</h2>
            <span className="dashboard-panel__menu">...</span>
          </header>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Survey</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((item) => (
                <tr key={item.title}>
                  <td>{item.title}</td>
                  <td className="dashboard-table__status">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="dashboard-panel">
          <header className="dashboard-panel__header">
            <h2>Recent Activity</h2>
            <span className="dashboard-panel__menu">...</span>
          </header>
          <table className="dashboard-table dashboard-table--activity">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((item) => (
                <tr key={`${item.user}-${item.action}`}>
                  <td className="dashboard-table__link">{item.user}</td>
                  <td>{item.action}</td>
                  <td>{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </div>
  );
}
