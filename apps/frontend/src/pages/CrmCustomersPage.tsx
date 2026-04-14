import { useEffect, useMemo, useState } from "react";
import InfoHint from "../components/InfoHint";
import {
  createCrmActivity,
  createCrmContact,
  createCrmCustomer,
  createCrmIssue,
  createCrmNote,
  downloadFile,
  getCrmCustomerDetail,
  listCompanies,
  listCrmCustomers,
  listDepartments,
  listUsers,
  uploadCrmCustomerFiles,
  type AuthUser,
  type Company,
  type CrmActivityType,
  type CrmCustomer,
  type CrmCustomerDetail,
  type CrmCustomerStatus,
  type CrmIssueSeverity,
  type CrmIssueStatus,
  type Department,
  type FileAsset,
} from "../lib/api";

const customerStatuses: CrmCustomerStatus[] = ["PROSPEKT", "AKTIV", "INAKTIV"];
const activityTypes: CrmActivityType[] = ["BESOK", "TELEFON", "EPOST", "MOTE", "OPPFOLGING"];
const issueSeverities: CrmIssueSeverity[] = ["LAV", "MIDDELS", "HOY", "KRITISK"];
const tabs = ["oversikt", "kontakter", "aktiviteter", "avvik", "meldinger", "vedlegg"] as const;

type TabKey = (typeof tabs)[number];

type CustomerFormState = {
  name: string;
  organizationNumber: string;
  industry: string;
  status: CrmCustomerStatus;
  address: string;
  website: string;
  notes: string;
  ownerUserId: string;
  companyId: string;
  departmentId: string;
};

type ContactFormState = {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  isPrimary: boolean;
};

type ActivityFormState = {
  type: CrmActivityType;
  date: string;
  summary: string;
  details: string;
  contactId: string;
  ownerUserId: string;
};

type NoteFormState = {
  body: string;
};

type IssueFormState = {
  title: string;
  description: string;
  category: string;
  severity: CrmIssueSeverity;
  dueDate: string;
  ownerUserId: string;
};

const customerStatusLabels: Record<CrmCustomerStatus, string> = {
  PROSPEKT: "Prospekt",
  AKTIV: "Aktiv kunde",
  INAKTIV: "Inaktiv",
};

const activityLabels: Record<CrmActivityType, string> = {
  BESOK: "Besøk",
  TELEFON: "Telefon",
  EPOST: "E-post",
  MOTE: "Møte",
  OPPFOLGING: "Oppfølging",
};

const issueSeverityLabels: Record<CrmIssueSeverity, string> = {
  LAV: "Lav",
  MIDDELS: "Middels",
  HOY: "Høy",
  KRITISK: "Kritisk",
};

const issueStatusLabels: Record<CrmIssueStatus, string> = {
  APEN: "Åpen",
  PAGAR: "Pågår",
  LUKKET: "Lukket",
};

const tabLabels: Record<TabKey, string> = {
  oversikt: "Oversikt",
  kontakter: "Kontaktpersoner",
  aktiviteter: "Aktiviteter",
  avvik: "Avvik",
  meldinger: "Meldinger",
  vedlegg: "Vedlegg",
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return "Ikke satt";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getInitialCustomerForm(currentUser: AuthUser): CustomerFormState {
  return {
    name: "",
    organizationNumber: "",
    industry: "",
    status: "PROSPEKT",
    address: "",
    website: "",
    notes: "",
    ownerUserId: currentUser.id,
    companyId: currentUser.companyId,
    departmentId: currentUser.departmentId ?? "",
  };
}

function getInitialContactForm(): ContactFormState {
  return {
    name: "",
    email: "",
    phone: "",
    jobTitle: "",
    isPrimary: false,
  };
}

function getInitialActivityForm(currentUser: AuthUser): ActivityFormState {
  return {
    type: "BESOK",
    date: todayIsoDate(),
    summary: "",
    details: "",
    contactId: "",
    ownerUserId: currentUser.id,
  };
}

function getInitialNoteForm(): NoteFormState {
  return { body: "" };
}

function getInitialIssueForm(currentUser: AuthUser): IssueFormState {
  return {
    title: "",
    description: "",
    category: "",
    severity: "LAV",
    dueDate: "",
    ownerUserId: currentUser.id,
  };
}

export default function CrmCustomersPage({
  token,
  currentUser,
}: {
  token: string;
  currentUser: AuthUser;
}) {
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [detail, setDetail] = useState<CrmCustomerDetail | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CrmCustomerStatus | "">("");
  const [activeTab, setActiveTab] = useState<TabKey>("oversikt");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [customerForm, setCustomerForm] = useState<CustomerFormState>(() => getInitialCustomerForm(currentUser));
  const [contactForm, setContactForm] = useState<ContactFormState>(() => getInitialContactForm());
  const [activityForm, setActivityForm] = useState<ActivityFormState>(() => getInitialActivityForm(currentUser));
  const [noteForm, setNoteForm] = useState<NoteFormState>(() => getInitialNoteForm());
  const [issueForm, setIssueForm] = useState<IssueFormState>(() => getInitialIssueForm(currentUser));
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  const userNames = useMemo(() => new Map(users.map((item) => [item.id, item.fullName])), [users]);
  const companyNames = useMemo(() => new Map(companies.map((item) => [item.id, item.name])), [companies]);
  const departmentNames = useMemo(() => new Map(departments.map((item) => [item.id, item.name])), [departments]);

  const visibleDepartments = useMemo(
    () => departments.filter((item) => currentUser.role === "superadmin" || item.companyId === customerForm.companyId),
    [currentUser.role, customerForm.companyId, departments]
  );

  const visibleOwners = useMemo(
    () => users.filter((item) => currentUser.role === "superadmin" || item.companyId === customerForm.companyId),
    [currentUser.role, customerForm.companyId, users]
  );

  const activeCustomer = detail?.customer ?? null;

  async function loadReferenceData() {
    try {
      const [userResult, companyResult, departmentResult] = await Promise.all([
        listUsers(token),
        listCompanies(token),
        listDepartments(token),
      ]);

      setUsers(userResult.items);
      setCompanies(companyResult.items);
      setDepartments(departmentResult.items);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke laste oppslagsdata");
    }
  }

  async function refreshCustomers(preferredId?: string) {
    setLoading(true);
    setError(null);

    try {
      const customerResult = await listCrmCustomers(token, {
        q: search,
        status: statusFilter || undefined,
      });

      setCustomers(customerResult.items);

      const nextId =
        preferredId && customerResult.items.some((item) => item.id === preferredId)
          ? preferredId
          : customerResult.items[0]?.id || "";

      setSelectedCustomerId(nextId);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke laste CRM-data");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(customerId: string) {
    if (!customerId) {
      setDetail(null);
      return;
    }

    setDetailLoading(true);
    setError(null);

    try {
      setDetail(await getCrmCustomerDetail(token, customerId));
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke laste kundedetaljer");
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadReferenceData();
  }, [token]);

  useEffect(() => {
    refreshCustomers();
  }, [token, search, statusFilter]);

  useEffect(() => {
    loadDetail(selectedCustomerId);
  }, [selectedCustomerId, token]);

  async function submitCustomer(event: React.FormEvent) {
    event.preventDefault();
    setSaving("customer");

    try {
      const created = await createCrmCustomer(token, {
        ...customerForm,
        departmentId: customerForm.departmentId || null,
      });

      setCustomerForm(getInitialCustomerForm(currentUser));
      await refreshCustomers(created.id);
      setActiveTab("oversikt");
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke opprette kunde");
    } finally {
      setSaving(null);
    }
  }

  async function submitContact(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCustomerId) return;

    setSaving("contact");

    try {
      await createCrmContact(token, selectedCustomerId, contactForm);
      setContactForm(getInitialContactForm());
      await loadDetail(selectedCustomerId);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke opprette kontaktperson");
    } finally {
      setSaving(null);
    }
  }

  async function submitActivity(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCustomerId) return;

    setSaving("activity");

    try {
      await createCrmActivity(token, selectedCustomerId, {
        ...activityForm,
        contactId: activityForm.contactId || null,
      });

      setActivityForm(getInitialActivityForm(currentUser));
      await loadDetail(selectedCustomerId);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke registrere aktivitet");
    } finally {
      setSaving(null);
    }
  }

  async function submitNote(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCustomerId) return;

    setSaving("note");

    try {
      await createCrmNote(token, selectedCustomerId, noteForm);
      setNoteForm(getInitialNoteForm());
      await loadDetail(selectedCustomerId);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke lagre melding");
    } finally {
      setSaving(null);
    }
  }

  async function submitIssue(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCustomerId) return;

    setSaving("issue");

    try {
      await createCrmIssue(token, selectedCustomerId, {
        ...issueForm,
        dueDate: issueForm.dueDate || null,
        ownerUserId: issueForm.ownerUserId || null,
      });

      setIssueForm(getInitialIssueForm(currentUser));
      await loadDetail(selectedCustomerId);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke opprette kundeavvik");
    } finally {
      setSaving(null);
    }
  }

  async function submitAttachments(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCustomerId || attachmentFiles.length === 0) return;

    setSaving("attachment");

    try {
      await uploadCrmCustomerFiles(token, selectedCustomerId, attachmentFiles);
      setAttachmentFiles([]);
      await loadDetail(selectedCustomerId);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke laste opp vedlegg");
    } finally {
      setSaving(null);
    }
  }

  async function handleDownload(file: FileAsset) {
    try {
      const blob = await downloadFile(token, file.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke laste ned fil");
    }
  }

  return (
    <div className="page">
      <section className="page-hero page-hero--tight">
        <div className="page-intro">
          <p className="section-label">CRM</p>
          <div className="header-inline">
            <h2 className="page-hero__title">Kunder og oppfølging</h2>
            <InfoHint text="CRM samler kunder, kontaktpersoner, aktiviteter, meldinger og kundeavvik i samme arbeidsflate." />
          </div>
        </div>
        <div className="hero-panel hero-panel--compact">
          <p className="section-label">Kunder</p>
          <h3>{customers.length}</h3>
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}

      <section className="crm-layout">
        <aside className="crm-sidebar">
          <article className="card">
            <div className="card-headline">
              <h2>Kunderegister</h2>
              <InfoHint text="Velg en kunde i listen for å se hele kundekortet med historikk og oppfølging." />
            </div>

            <div className="crm-filters">
              <div className="field">
                <label htmlFor="crm-search">Søk</label>
                <input
                  id="crm-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Søk på kundenavn"
                />
              </div>

              <div className="field">
                <label htmlFor="crm-status">Status</label>
                <select
                  id="crm-status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as CrmCustomerStatus | "")}
                >
                  <option value="">Alle</option>
                  {customerStatuses.map((status) => (
                    <option key={status} value={status}>
                      {customerStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="crm-customer-list">
              {loading ? (
                <div className="empty-state">
                  <h3>Laster kunder</h3>
                  <p>Henter kunderegisteret og klargjør arbeidsflaten.</p>
                </div>
              ) : null}

              {!loading && customers.length === 0 ? (
                <div className="empty-state">
                  <h3>Ingen kunder funnet</h3>
                  <p>Opprett den første kunden i panelet under.</p>
                </div>
              ) : null}

              {!loading
                ? customers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className={`crm-customer-item ${selectedCustomerId === customer.id ? "crm-customer-item--active" : ""}`}
                      onClick={() => setSelectedCustomerId(customer.id)}
                    >
                      <span className="crm-customer-item__title">{customer.name}</span>
                      <span className="crm-customer-item__meta">
                        <span className="chip">{customerStatusLabels[customer.status]}</span>
                        <span className="muted">{userNames.get(customer.ownerUserId) || "Ukjent ansvarlig"}</span>
                      </span>
                    </button>
                  ))
                : null}
            </div>
          </article>

          <article className="card">
            <div className="card-headline">
              <h2>Ny kunde</h2>
              <InfoHint text="Registrer kunden med ansvarlig bruker, firma og eventuell avdeling. Mer detaljert oppfølging kan legges til etterpå." />
            </div>

            <form className="incident-form compact-form" onSubmit={submitCustomer}>
              <div className="field">
                <label htmlFor="crm-customer-name">Kundenavn</label>
                <input
                  id="crm-customer-name"
                  value={customerForm.name}
                  onChange={(event) => setCustomerForm({ ...customerForm, name: event.target.value })}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="crm-customer-org">Organisasjonsnummer</label>
                  <input
                    id="crm-customer-org"
                    value={customerForm.organizationNumber}
                    onChange={(event) => setCustomerForm({ ...customerForm, organizationNumber: event.target.value })}
                  />
                </div>

                <div className="field">
                  <label htmlFor="crm-customer-industry">Bransje</label>
                  <input
                    id="crm-customer-industry"
                    value={customerForm.industry}
                    onChange={(event) => setCustomerForm({ ...customerForm, industry: event.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="crm-customer-status-create">Status</label>
                  <select
                    id="crm-customer-status-create"
                    value={customerForm.status}
                    onChange={(event) =>
                      setCustomerForm({
                        ...customerForm,
                        status: event.target.value as CrmCustomerStatus,
                      })
                    }
                  >
                    {customerStatuses.map((status) => (
                      <option key={status} value={status}>
                        {customerStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="crm-customer-owner">Ansvarlig</label>
                  <select
                    id="crm-customer-owner"
                    value={customerForm.ownerUserId}
                    onChange={(event) => setCustomerForm({ ...customerForm, ownerUserId: event.target.value })}
                  >
                    {visibleOwners.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="crm-customer-company">Firma</label>
                  <select
                    id="crm-customer-company"
                    value={customerForm.companyId}
                    disabled={currentUser.role !== "superadmin"}
                    onChange={(event) =>
                      setCustomerForm({
                        ...customerForm,
                        companyId: event.target.value,
                        departmentId: "",
                      })
                    }
                  >
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="crm-customer-department">Avdeling</label>
                  <select
                    id="crm-customer-department"
                    value={customerForm.departmentId}
                    onChange={(event) => setCustomerForm({ ...customerForm, departmentId: event.target.value })}
                  >
                    <option value="">Ingen avdeling</option>
                    {visibleDepartments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="crm-customer-address">Adresse</label>
                <input
                  id="crm-customer-address"
                  value={customerForm.address}
                  onChange={(event) => setCustomerForm({ ...customerForm, address: event.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="crm-customer-website">Nettside</label>
                <input
                  id="crm-customer-website"
                  value={customerForm.website}
                  onChange={(event) => setCustomerForm({ ...customerForm, website: event.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="crm-customer-notes">Notater</label>
                <textarea
                  id="crm-customer-notes"
                  value={customerForm.notes}
                  onChange={(event) => setCustomerForm({ ...customerForm, notes: event.target.value })}
                />
              </div>

              <button className="btn" type="submit" disabled={saving === "customer"}>
                {saving === "customer" ? "Lagrer..." : "Opprett kunde"}
              </button>
            </form>
          </article>
        </aside>

        <div className="crm-detail">
          {!selectedCustomerId ? (
            <article className="card empty-state">
              <h3>Velg en kunde</h3>
              <p>Kundekortet vises her når du velger en post fra listen.</p>
            </article>
          ) : null}

          {selectedCustomerId && (detailLoading || !detail) ? (
            <article className="card empty-state">
              <h3>Laster kundedetaljer</h3>
              <p>Henter kontaktpersoner, aktiviteter, meldinger og kundeavvik.</p>
            </article>
          ) : null}

          {activeCustomer ? (
            <article className="card">
              <div className="crm-customer-header">
                <div className="page-intro">
                  <p className="section-label">Kunde</p>
                  <h2>{activeCustomer.name}</h2>
                  <div className="hero-badges">
                    <span className="hero-badge">{customerStatusLabels[activeCustomer.status]}</span>
                    <span className="hero-badge">
                      {companyNames.get(activeCustomer.companyId) || "Ukjent firma"}
                    </span>
                    <span className="hero-badge">
                      {activeCustomer.departmentId
                        ? departmentNames.get(activeCustomer.departmentId) || "Ukjent avdeling"
                        : "Ingen avdeling"}
                    </span>
                  </div>
                </div>

                <div className="crm-summary-grid">
                  <div className="metric-card">
                    <p className="meta-label">Kontakter</p>
                    <span className="metric-card__value">{detail.contacts.length}</span>
                  </div>
                  <div className="metric-card">
                    <p className="meta-label">Aktiviteter</p>
                    <span className="metric-card__value">{detail.activities.length}</span>
                  </div>
                  <div className="metric-card">
                    <p className="meta-label">Avvik</p>
                    <span className="metric-card__value">{detail.issues.length}</span>
                  </div>
                </div>
              </div>

              <div className="crm-tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`crm-tab ${activeTab === tab ? "crm-tab--active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tabLabels[tab]}
                  </button>
                ))}
              </div>

              {activeTab === "oversikt" ? (
                <div className="crm-pane">
                  <div className="crm-overview-grid">
                    <div className="placeholder-card">
                      <h3>Kundeinfo</h3>
                      <p>Organisasjonsnummer: {activeCustomer.organizationNumber || "Ikke satt"}</p>
                      <p>Bransje: {activeCustomer.industry || "Ikke satt"}</p>
                      <p>Ansvarlig: {userNames.get(activeCustomer.ownerUserId) || "Ukjent"}</p>
                    </div>

                    <div className="placeholder-card">
                      <h3>Kontaktgrunnlag</h3>
                      <p>Adresse: {activeCustomer.address || "Ikke satt"}</p>
                      <p>Nettside: {activeCustomer.website || "Ikke satt"}</p>
                      <p>Notater: {activeCustomer.notes || "Ingen notater registrert"}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === "kontakter" ? (
                <div className="crm-pane crm-split">
                  <div className="incident-list">
                    {detail.contacts.length === 0 ? (
                      <div className="empty-state">
                        <h3>Ingen kontaktpersoner</h3>
                        <p>Legg inn primærkontakt og andre nøkkelpersoner for kunden.</p>
                      </div>
                    ) : (
                      detail.contacts.map((contact) => (
                        <article key={contact.id} className="incident-card">
                          <div className="incident-card__head">
                            <div className="page-intro">
                              <h3>{contact.name}</h3>
                              <p>{contact.jobTitle || "Ingen stillingstittel"}</p>
                            </div>
                            {contact.isPrimary ? (
                              <span className="status-pill" data-tone="DONE">
                                Primærkontakt
                              </span>
                            ) : null}
                          </div>

                          <div className="incident-card__footer">
                            <span className="muted">{contact.email || "Ingen e-post"}</span>
                            <span className="muted">{contact.phone || "Ingen telefon"}</span>
                          </div>
                        </article>
                      ))
                    )}
                  </div>

                  <form className="incident-form compact-form" onSubmit={submitContact}>
                    <h3>Ny kontaktperson</h3>

                    <div className="field">
                      <label htmlFor="crm-contact-name">Navn</label>
                      <input
                        id="crm-contact-name"
                        value={contactForm.name}
                        onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })}
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="crm-contact-email">E-post</label>
                      <input
                        id="crm-contact-email"
                        type="email"
                        value={contactForm.email}
                        onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })}
                      />
                    </div>

                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor="crm-contact-phone">Telefon</label>
                        <input
                          id="crm-contact-phone"
                          value={contactForm.phone}
                          onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="crm-contact-title">Stilling</label>
                        <input
                          id="crm-contact-title"
                          value={contactForm.jobTitle}
                          onChange={(event) => setContactForm({ ...contactForm, jobTitle: event.target.value })}
                        />
                      </div>
                    </div>

                    <label className="crm-checkbox">
                      <input
                        type="checkbox"
                        checked={contactForm.isPrimary}
                        onChange={(event) =>
                          setContactForm({
                            ...contactForm,
                            isPrimary: event.target.checked,
                          })
                        }
                      />
                      <span>Primærkontakt</span>
                    </label>

                    <button className="btn" type="submit" disabled={saving === "contact"}>
                      {saving === "contact" ? "Lagrer..." : "Legg til kontakt"}
                    </button>
                  </form>
                </div>
              ) : null}

              {activeTab === "aktiviteter" ? (
                <div className="crm-pane crm-split">
                  <div className="incident-list">
                    {detail.activities.length === 0 ? (
                      <div className="empty-state">
                        <h3>Ingen aktiviteter</h3>
                        <p>Loggfør møter, telefoner, e-poster og oppfølging løpende.</p>
                      </div>
                    ) : (
                      detail.activities.map((activity) => (
                        <article key={activity.id} className="incident-card">
                          <div className="incident-card__head">
                            <div className="page-intro">
                              <h3>{activity.summary}</h3>
                              <p>{activity.details || "Ingen detaljer registrert"}</p>
                            </div>
                            <span className="chip">{activityLabels[activity.type]}</span>
                          </div>

                          <div className="incident-card__footer">
                            <span className="muted">{formatDate(activity.date)}</span>
                            <span className="muted">
                              {userNames.get(activity.ownerUserId) || "Ukjent ansvarlig"}
                            </span>
                          </div>
                        </article>
                      ))
                    )}
                  </div>

                  <form className="incident-form compact-form" onSubmit={submitActivity}>
                    <h3>Ny aktivitet</h3>

                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor="crm-activity-type">Type</label>
                        <select
                          id="crm-activity-type"
                          value={activityForm.type}
                          onChange={(event) =>
                            setActivityForm({
                              ...activityForm,
                              type: event.target.value as CrmActivityType,
                            })
                          }
                        >
                          {activityTypes.map((type) => (
                            <option key={type} value={type}>
                              {activityLabels[type]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label htmlFor="crm-activity-date">Dato</label>
                        <input
                          id="crm-activity-date"
                          type="date"
                          value={activityForm.date}
                          onChange={(event) => setActivityForm({ ...activityForm, date: event.target.value })}
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label htmlFor="crm-activity-summary">Tittel</label>
                      <input
                        id="crm-activity-summary"
                        value={activityForm.summary}
                        onChange={(event) => setActivityForm({ ...activityForm, summary: event.target.value })}
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="crm-activity-details">Referat</label>
                      <textarea
                        id="crm-activity-details"
                        value={activityForm.details}
                        onChange={(event) => setActivityForm({ ...activityForm, details: event.target.value })}
                      />
                    </div>

                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor="crm-activity-contact">Kontaktperson</label>
                        <select
                          id="crm-activity-contact"
                          value={activityForm.contactId}
                          onChange={(event) => setActivityForm({ ...activityForm, contactId: event.target.value })}
                        >
                          <option value="">Ingen valgt</option>
                          {detail.contacts.map((contact) => (
                            <option key={contact.id} value={contact.id}>
                              {contact.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label htmlFor="crm-activity-owner">Ansvarlig</label>
                        <select
                          id="crm-activity-owner"
                          value={activityForm.ownerUserId}
                          onChange={(event) => setActivityForm({ ...activityForm, ownerUserId: event.target.value })}
                        >
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button className="btn" type="submit" disabled={saving === "activity"}>
                      {saving === "activity" ? "Lagrer..." : "Registrer aktivitet"}
                    </button>
                  </form>
                </div>
              ) : null}

              {activeTab === "avvik" ? (
                <div className="crm-pane crm-split">
                  <div className="incident-list">
                    {detail.issues.length === 0 ? (
                      <div className="empty-state">
                        <h3>Ingen kundeavvik</h3>
                        <p>Registrer avvik som gjelder kunden, og bruk disse i oppfølgingen.</p>
                      </div>
                    ) : (
                      detail.issues.map((issue) => (
                        <article key={issue.id} className="incident-card">
                          <div className="incident-card__head">
                            <div className="page-intro">
                              <h3>{issue.title}</h3>
                              <p>{issue.description || "Ingen beskrivelse registrert"}</p>
                            </div>

                            <span
                              className="status-pill"
                              data-tone={
                                issue.status === "LUKKET"
                                  ? "DONE"
                                  : issue.status === "PAGAR"
                                    ? "PROGRESS"
                                    : "OPEN"
                              }
                            >
                              {issueStatusLabels[issue.status]}
                            </span>
                          </div>

                          <div className="incident-card__meta">
                            <span className="chip">{issueSeverityLabels[issue.severity]}</span>
                            <span className="chip">{issue.category || "Ingen kategori"}</span>
                          </div>

                          <div className="incident-card__footer">
                            <span className="muted">
                              {issue.dueDate ? formatDate(issue.dueDate) : "Ingen frist"}
                            </span>
                            <span className="muted">
                              {issue.ownerUserId
                                ? userNames.get(issue.ownerUserId) || "Ukjent ansvarlig"
                                : "Ingen ansvarlig"}
                            </span>
                          </div>
                        </article>
                      ))
                    )}
                  </div>

                  <form className="incident-form compact-form" onSubmit={submitIssue}>
                    <h3>Nytt kundeavvik</h3>

                    <div className="field">
                      <label htmlFor="crm-issue-title">Tittel</label>
                      <input
                        id="crm-issue-title"
                        value={issueForm.title}
                        onChange={(event) => setIssueForm({ ...issueForm, title: event.target.value })}
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="crm-issue-description">Beskrivelse</label>
                      <textarea
                        id="crm-issue-description"
                        value={issueForm.description}
                        onChange={(event) => setIssueForm({ ...issueForm, description: event.target.value })}
                      />
                    </div>

                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor="crm-issue-category">Kategori</label>
                        <input
                          id="crm-issue-category"
                          value={issueForm.category}
                          onChange={(event) => setIssueForm({ ...issueForm, category: event.target.value })}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="crm-issue-severity">Alvorlighet</label>
                        <select
                          id="crm-issue-severity"
                          value={issueForm.severity}
                          onChange={(event) =>
                            setIssueForm({
                              ...issueForm,
                              severity: event.target.value as CrmIssueSeverity,
                            })
                          }
                        >
                          {issueSeverities.map((severity) => (
                            <option key={severity} value={severity}>
                              {issueSeverityLabels[severity]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor="crm-issue-due">Frist</label>
                        <input
                          id="crm-issue-due"
                          type="date"
                          value={issueForm.dueDate}
                          onChange={(event) => setIssueForm({ ...issueForm, dueDate: event.target.value })}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="crm-issue-owner">Ansvarlig</label>
                        <select
                          id="crm-issue-owner"
                          value={issueForm.ownerUserId}
                          onChange={(event) => setIssueForm({ ...issueForm, ownerUserId: event.target.value })}
                        >
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button className="btn" type="submit" disabled={saving === "issue"}>
                      {saving === "issue" ? "Lagrer..." : "Registrer kundeavvik"}
                    </button>
                  </form>
                </div>
              ) : null}

              {activeTab === "meldinger" ? (
                <div className="crm-pane crm-split">
                  <div className="incident-list">
                    {detail.notes.length === 0 ? (
                      <div className="empty-state">
                        <h3>Ingen meldinger</h3>
                        <p>Bruk meldingsloggen til korte notater, interne avklaringer og historikk.</p>
                      </div>
                    ) : (
                      detail.notes.map((note) => (
                        <article key={note.id} className="incident-card">
                          <div className="incident-card__footer">
                            <span className="muted">
                              {userNames.get(note.authorUserId) || "Ukjent bruker"}
                            </span>
                            <span className="muted">{formatDate(note.createdAt)}</span>
                          </div>
                          <p>{note.body}</p>
                        </article>
                      ))
                    )}
                  </div>

                  <form className="incident-form compact-form" onSubmit={submitNote}>
                    <h3>Ny melding</h3>

                    <div className="field">
                      <label htmlFor="crm-note-body">Melding</label>
                      <textarea
                        id="crm-note-body"
                        value={noteForm.body}
                        onChange={(event) => setNoteForm({ body: event.target.value })}
                        required
                      />
                    </div>

                    <button className="btn" type="submit" disabled={saving === "note"}>
                      {saving === "note" ? "Lagrer..." : "Legg til melding"}
                    </button>
                  </form>
                </div>
              ) : null}

              {activeTab === "vedlegg" ? (
                <div className="crm-pane crm-split">
                  <div className="incident-list">
                    {detail.attachments.length === 0 ? (
                      <div className="empty-state">
                        <h3>Ingen vedlegg</h3>
                        <p>Last opp bilder, tilbud, referater eller annen dokumentasjon knyttet til kunden.</p>
                      </div>
                    ) : (
                      detail.attachments.map((file) => (
                        <article key={file.id} className="incident-card">
                          <div className="incident-card__head">
                            <div className="page-intro">
                              <h3>{file.fileName}</h3>
                              <p>{file.contentType}</p>
                            </div>
                            <button className="btn-secondary" type="button" onClick={() => void handleDownload(file)}>
                              Last ned
                            </button>
                          </div>

                          <div className="incident-card__footer">
                            <span className="muted">{Math.max(1, Math.round(file.sizeBytes / 1024))} KB</span>
                            <span className="muted">{formatDate(file.uploadedAt)}</span>
                          </div>
                        </article>
                      ))
                    )}
                  </div>

                  <form className="incident-form compact-form" onSubmit={submitAttachments}>
                    <h3>Last opp vedlegg</h3>

                    <div className="field">
                      <label htmlFor="crm-attachments">Filer</label>
                      <input
                        id="crm-attachments"
                        type="file"
                        multiple
                        onChange={(event) => setAttachmentFiles(Array.from(event.target.files ?? []))}
                      />
                      <p className="field-hint">Støtter bilder, PDF-er og vanlig dokumentasjon opp til 5 MB per fil.</p>
                    </div>

                    {attachmentFiles.length ? (
                      <div className="badge-row">
                        {attachmentFiles.map((file) => (
                          <span key={`${file.name}-${file.size}`} className="chip">
                            {file.name}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <button className="btn" type="submit" disabled={saving === "attachment" || attachmentFiles.length === 0}>
                      {saving === "attachment" ? "Laster opp..." : "Last opp vedlegg"}
                    </button>
                  </form>
                </div>
              ) : null}
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}
