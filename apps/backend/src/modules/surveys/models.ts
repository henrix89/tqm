import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const surveyStatuses = ["DRAFT", "PUBLISHED", "CLOSED"] as const;
export const surveyQuestionTypes = ["TEXT", "SCALE", "YES_NO"] as const;

const surveyQuestionSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    type: { type: String, enum: surveyQuestionTypes, required: true },
    required: { type: Boolean, default: true },
  },
  { _id: true }
);

const surveySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    status: { type: String, enum: surveyStatuses, default: "DRAFT" },
    isAnonymous: { type: Boolean, default: true },
    companyId: { type: String, required: true, index: true },
    departmentId: { type: String, default: null, index: true },
    createdBy: { type: String, required: true },
    publishedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    questions: { type: [surveyQuestionSchema], default: [] },
  },
  { timestamps: true, collection: "surveys" }
);

const surveyResponseSchema = new Schema(
  {
    surveyId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    responderId: { type: String, default: null },
    answers: {
      type: [
        {
          questionId: { type: String, required: true },
          value: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: { createdAt: "submittedAt", updatedAt: false }, collection: "survey_responses" }
);

export type SurveyDocument = InferSchemaType<typeof surveySchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type SurveyResponseDocument = InferSchemaType<typeof surveyResponseSchema> & {
  _id: mongoose.Types.ObjectId;
  submittedAt: Date;
};

export const SurveyModel = mongoose.models.Survey || mongoose.model("Survey", surveySchema);
export const SurveyResponseModel =
  mongoose.models.SurveyResponse || mongoose.model("SurveyResponse", surveyResponseSchema);
