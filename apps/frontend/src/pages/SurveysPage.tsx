import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  createSurvey,
  createSurveyQuestion,
  getSurveyDetail,
  listDepartments,
  listSurveys,
  publishSurvey,
  submitSurveyResponse,
  type Department,
  type Survey,
  type SurveyDetail,
  type SurveyQuestionType,
} from "../lib/api";

const questionTypes: SurveyQuestionType[] = ["TEXT", "SCALE", "YES_NO"];
const questionTypeLabels: Record<SurveyQuestionType, string> = {
  TEXT: "Fritekst",
  SCALE: "Skala 1-5",
  YES_NO: "Ja / Nei",
};

const surveyStatusLabels: Record<string, string> = {
  DRAFT: "Utkast",
  PUBLISHED: "Publisert",
  CLOSED: "Lukket",
};

export default function SurveysPage({
  token,
  moduleView = "list",
}: {
  token: string;
  moduleView?: "list" | "create";
}) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [detail, setDetail] = useState<SurveyDetail | null>(null);
  const [selectedSurveyId, setSelectedSurveyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [surveyForm, setSurveyForm] = useState({
    title: "",
    description: "",
    isAnonymous: true,
    departmentId: "",
  });
  const [questionForm, setQuestionForm] = useState({
    text: "",
    type: "TEXT" as SurveyQuestionType,
    required: true,
  });
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});
  const showList = moduleView === "list";
  const showCreate = moduleView === "create";

  async function refreshSurveys(preferredId?: string) {
    setLoading(true);
    setError(null);
    try {
      const [surveyResult, departmentResult] = await Promise.all([listSurveys(token), listDepartments(token)]);
      setSurveys(surveyResult.items);
      setDepartments(departmentResult.items);
      const nextId =
        preferredId && surveyResult.items.some((item) => item.id === preferredId)
          ? preferredId
          : surveyResult.items[0]?.id ?? "";
      setSelectedSurveyId(nextId);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke laste undersøkelser");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(surveyId: string) {
    if (!surveyId) {
      setDetail(null);
      return;
    }

    setDetailLoading(true);
    try {
      const nextDetail = await getSurveyDetail(token, surveyId);
      setDetail(nextDetail);
      setAnswerDraft(Object.fromEntries(nextDetail.questions.map((question) => [question.id, ""])));
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke laste undersøkelsen");
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    refreshSurveys();
  }, [token]);

  useEffect(() => {
    loadDetail(selectedSurveyId);
  }, [selectedSurveyId, token]);

  async function handleCreateSurvey(event: React.FormEvent) {
    event.preventDefault();
    setSaving("survey");

    try {
      const created = await createSurvey(token, {
        ...surveyForm,
        departmentId: surveyForm.departmentId || null,
      });
      setSurveyForm({ title: "", description: "", isAnonymous: true, departmentId: "" });
      await refreshSurveys(created.id);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke opprette undersøkelse");
    } finally {
      setSaving(null);
    }
  }

  async function handleAddQuestion(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedSurveyId) return;

    setSaving("question");
    try {
      await createSurveyQuestion(token, selectedSurveyId, questionForm);
      setQuestionForm({ text: "", type: "TEXT", required: true });
      await loadDetail(selectedSurveyId);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke legge til spørsmål");
    } finally {
      setSaving(null);
    }
  }

  async function handlePublish() {
    if (!selectedSurveyId) return;

    setSaving("publish");
    try {
      await publishSurvey(token, selectedSurveyId);
      await loadDetail(selectedSurveyId);
      await refreshSurveys(selectedSurveyId);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke publisere undersøkelsen");
    } finally {
      setSaving(null);
    }
  }

  async function handleSubmitResponse(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedSurveyId || !detail) return;

    setSaving("response");
    try {
      await submitSurveyResponse(token, selectedSurveyId, {
        answers: detail.questions.map((question) => ({
          questionId: question.id,
          value: answerDraft[question.id] || "",
        })),
      });
      await loadDetail(selectedSurveyId);
    } catch (err: any) {
      setError(err?.message ?? "Kunne ikke sende svar");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="page">
      <section className="page-hero page-hero--tight">
        <div className="page-intro">
          <p className="section-label">Spørreundersøkelser</p>
          <h2 className="page-hero__title">Lag, publiser og følg opp undersøkelser i samme arbeidsflate.</h2>
          <p>Modulen håndterer utkast, spørsmål, svar og responsoversikt uten dummy-data.</p>
        </div>
        <div className="hero-panel hero-panel--compact">
          <p className="section-label">Antall</p>
          <h3>{surveys.length}</h3>
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}

      <section className="crm-module-nav">
        <NavLink to="/surveys" className="crm-module-nav__link">
          Undersøkelsesliste
        </NavLink>
        <NavLink to="/surveys/new" className="crm-module-nav__link">
          Ny undersøkelse
        </NavLink>
      </section>

      <section className="crm-layout">
        <aside className="crm-sidebar">
          {showList ? <article className="card">
            <div className="card-headline">
              <h2>Undersøkelser</h2>
            </div>
            <div className="crm-customer-list">
              {loading ? (
                <div className="empty-state">
                  <h3>Laster undersøkelser</h3>
                </div>
              ) : surveys.length === 0 ? (
                <div className="empty-state">
                  <h3>Ingen undersøkelser ennå</h3>
                  <p>Opprett den første i panelet under.</p>
                </div>
              ) : (
                surveys.map((survey) => (
                  <button
                    key={survey.id}
                    type="button"
                    className={`crm-customer-item ${selectedSurveyId === survey.id ? "crm-customer-item--active" : ""}`}
                    onClick={() => setSelectedSurveyId(survey.id)}
                  >
                    <span className="crm-customer-item__title">{survey.title}</span>
                    <span className="crm-customer-item__meta">
                      <span className="chip">{surveyStatusLabels[survey.status]}</span>
                      <span className="muted">{survey.responseCount} svar</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </article> : null}

          {showCreate ? <article className="card">
            <div className="card-headline">
              <h2>Ny undersøkelse</h2>
            </div>
            <form className="incident-form compact-form" onSubmit={handleCreateSurvey}>
              <div className="field">
                <label htmlFor="survey-title">Tittel</label>
                <input
                  id="survey-title"
                  value={surveyForm.title}
                  onChange={(event) => setSurveyForm({ ...surveyForm, title: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="survey-description">Beskrivelse</label>
                <textarea
                  id="survey-description"
                  value={surveyForm.description}
                  onChange={(event) => setSurveyForm({ ...surveyForm, description: event.target.value })}
                />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="survey-department">Avdeling</label>
                  <select
                    id="survey-department"
                    value={surveyForm.departmentId}
                    onChange={(event) => setSurveyForm({ ...surveyForm, departmentId: event.target.value })}
                  >
                    <option value="">Hele firmaet</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="crm-checkbox">
                  <input
                    type="checkbox"
                    checked={surveyForm.isAnonymous}
                    onChange={(event) => setSurveyForm({ ...surveyForm, isAnonymous: event.target.checked })}
                  />
                  <span>Anonyme svar</span>
                </label>
              </div>
              <button className="btn" type="submit" disabled={saving === "survey"}>
                {saving === "survey" ? "Lagrer..." : "Opprett undersøkelse"}
              </button>
            </form>
          </article> : null}
        </aside>

        <div className="crm-detail">
          {!selectedSurveyId ? (
            <article className="card empty-state">
              <h3>Velg en undersøkelse</h3>
            </article>
          ) : detailLoading || !detail ? (
            <article className="card empty-state">
              <h3>Laster undersøkelse</h3>
            </article>
          ) : (
            <>
              <article className="card">
                <div className="section-header">
                  <div className="page-intro">
                    <p className="section-label">Detaljer</p>
                    <h2>{detail.title}</h2>
                    <p>{detail.description || "Ingen beskrivelse lagt inn."}</p>
                    <div className="hero-badges">
                      <span className="hero-badge">{surveyStatusLabels[detail.status]}</span>
                      <span className="hero-badge">{detail.questionCount} spørsmål</span>
                      <span className="hero-badge">{detail.responseCount} svar</span>
                    </div>
                  </div>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => void handlePublish()}
                    disabled={detail.status !== "DRAFT" || saving === "publish"}
                  >
                    {saving === "publish" ? "Publiserer..." : "Publiser"}
                  </button>
                </div>
              </article>

              <section className="crm-split">
                <article className="card">
                  <div className="card-headline">
                    <h2>Spørsmål</h2>
                  </div>
                  <div className="incident-list">
                    {detail.questions.length === 0 ? (
                      <div className="empty-state">
                        <h3>Ingen spørsmål ennå</h3>
                      </div>
                    ) : (
                      detail.questions.map((question) => (
                        <article key={question.id} className="incident-card">
                          <div className="incident-card__head">
                            <div className="page-intro">
                              <h3>{question.text}</h3>
                              <p>{questionTypeLabels[question.type]}</p>
                            </div>
                            <span className="chip">{question.required ? "Påkrevd" : "Valgfritt"}</span>
                          </div>
                        </article>
                      ))
                    )}
                  </div>

                  <form className="incident-form compact-form" onSubmit={handleAddQuestion}>
                    <h3>Nytt spørsmål</h3>
                    <div className="field">
                      <label htmlFor="question-text">Spørsmålstekst</label>
                      <input
                        id="question-text"
                        value={questionForm.text}
                        onChange={(event) => setQuestionForm({ ...questionForm, text: event.target.value })}
                        required
                      />
                    </div>
                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor="question-type">Type</label>
                        <select
                          id="question-type"
                          value={questionForm.type}
                          onChange={(event) =>
                            setQuestionForm({
                              ...questionForm,
                              type: event.target.value as SurveyQuestionType,
                            })
                          }
                        >
                          {questionTypes.map((type) => (
                            <option key={type} value={type}>
                              {questionTypeLabels[type]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <label className="crm-checkbox">
                        <input
                          type="checkbox"
                          checked={questionForm.required}
                          onChange={(event) => setQuestionForm({ ...questionForm, required: event.target.checked })}
                        />
                        <span>Påkrevd</span>
                      </label>
                    </div>
                    <button className="btn" type="submit" disabled={saving === "question"}>
                      {saving === "question" ? "Lagrer..." : "Legg til spørsmål"}
                    </button>
                  </form>
                </article>

                <article className="card">
                  <div className="card-headline">
                    <h2>Test besvarelse</h2>
                  </div>
                  <form className="incident-form compact-form" onSubmit={handleSubmitResponse}>
                    {detail.questions.length === 0 ? (
                      <div className="empty-state">
                        <h3>Legg til spørsmål først</h3>
                      </div>
                    ) : (
                      detail.questions.map((question) => (
                        <div key={question.id} className="field">
                          <label htmlFor={`answer-${question.id}`}>{question.text}</label>
                          {question.type === "TEXT" ? (
                            <textarea
                              id={`answer-${question.id}`}
                              value={answerDraft[question.id] ?? ""}
                              onChange={(event) =>
                                setAnswerDraft({ ...answerDraft, [question.id]: event.target.value })
                              }
                            />
                          ) : (
                            <select
                              id={`answer-${question.id}`}
                              value={answerDraft[question.id] ?? ""}
                              onChange={(event) =>
                                setAnswerDraft({ ...answerDraft, [question.id]: event.target.value })
                              }
                            >
                              <option value="">Velg svar</option>
                              {question.type === "YES_NO" ? (
                                <>
                                  <option value="Ja">Ja</option>
                                  <option value="Nei">Nei</option>
                                </>
                              ) : (
                                ["1", "2", "3", "4", "5"].map((value) => (
                                  <option key={value} value={value}>
                                    {value}
                                  </option>
                                ))
                              )}
                            </select>
                          )}
                        </div>
                      ))
                    )}
                    <button className="btn" type="submit" disabled={!detail.questions.length || saving === "response"}>
                      {saving === "response" ? "Sender..." : "Send testbesvarelse"}
                    </button>
                  </form>

                  <div className="incident-list">
                    {detail.responses.map((response) => (
                      <article key={response.id} className="incident-card">
                        <div className="incident-card__head">
                          <div className="page-intro">
                            <h3>Besvarelse</h3>
                            <p>{new Date(response.submittedAt).toLocaleString("nb-NO")}</p>
                          </div>
                          <span className="chip">{response.responderId ? "Identifisert" : "Anonym"}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </article>
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
