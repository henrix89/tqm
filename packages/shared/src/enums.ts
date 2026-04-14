export type IncidentCategory = "HMS" | "LEVERANSE" | "TEKNISK" | "KUNDE" | "INTERN_PROSESS";
export type IncidentSeverity = "LAV" | "MIDDELS" | "HØY" | "KRITISK";
export type IncidentStatus = "ÅPEN" | "PÅGÅR" | "LUKKET" | "AVVIST";

export type DocumentCategory = "HMS" | "RUTINER" | "TEKNISK_DOK" | "PRODUKTINFO" | "KURS_OPPLÆRING";

export type SurveyType = "KUNDETILFREDSHET" | "INTERN_FEEDBACK" | "ANNET";
export type SurveyQuestionType = "SINGLE" | "MULTI" | "RATING" | "TEXT" | "NUMBER" | "DATE";
export type SurveyStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

export type InspectionStatus = "ÅPEN" | "LUKKET";
export type FindingSeverity = "LAV" | "MIDDELS" | "HØY" | "KRITISK";
export type FindingStatus = "ÅPEN" | "PÅGÅR" | "LUKKET";

