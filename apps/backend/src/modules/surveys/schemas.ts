import { z } from "zod";
import { surveyQuestionTypes } from "./models";

export const createSurveySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(""),
  isAnonymous: z.boolean().optional().default(true),
  departmentId: z.string().nullable().optional(),
});

export const createSurveyQuestionSchema = z.object({
  text: z.string().min(1),
  type: z.enum(surveyQuestionTypes),
  required: z.boolean().optional().default(true),
});

export const submitSurveyResponseSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        value: z.string().min(1),
      })
    )
    .min(1),
});
