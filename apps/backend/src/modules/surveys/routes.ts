import { Router } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import type { AuthenticatedRequest } from "../auth/types";
import { SurveyModel, SurveyResponseModel } from "./models";
import { createSurveyQuestionSchema, createSurveySchema, submitSurveyResponseSchema } from "./schemas";

export const router = Router();

function mapSurvey(item: any, responseCount = 0) {
  return {
    id: String(item._id),
    title: item.title,
    description: item.description,
    status: item.status,
    isAnonymous: item.isAnonymous,
    companyId: item.companyId,
    departmentId: item.departmentId,
    createdBy: item.createdBy,
    questionCount: item.questions?.length ?? 0,
    responseCount,
    publishedAt: item.publishedAt,
    closedAt: item.closedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = req.auth!;
    const filter: Record<string, unknown> =
      actor.role === "superadmin" ? {} : { companyId: actor.companyId };

    if (actor.role === "manager") {
      filter.departmentId = actor.departmentId;
    }

    const surveys = await SurveyModel.find(filter).sort({ createdAt: -1 });
    const counts = await SurveyResponseModel.aggregate<{ _id: string; count: number }>([
      { $match: { surveyId: { $in: surveys.map((item) => String(item._id)) } } },
      { $group: { _id: "$surveyId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((row) => [row._id, row.count]));

    res.json({ items: surveys.map((item) => mapSurvey(item, countMap.get(String(item._id)) ?? 0)) });
  })
);

router.post(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = req.auth!;
    const body = createSurveySchema.parse(req.body);

    const created = await SurveyModel.create({
      title: body.title,
      description: body.description,
      isAnonymous: body.isAnonymous,
      companyId: actor.companyId,
      departmentId: actor.role === "manager" ? actor.departmentId : body.departmentId ?? null,
      createdBy: actor.userId,
      questions: [],
    });

    res.status(201).json(mapSurvey(created));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const survey = await SurveyModel.findById(req.params.id);
    if (!survey) return res.status(404).json({ error: "Not found" });

    const responseCount = await SurveyResponseModel.countDocuments({ surveyId: String(survey._id) });
    const responses = await SurveyResponseModel.find({ surveyId: String(survey._id) }).sort({ submittedAt: -1 });

    res.json({
      ...mapSurvey(survey, responseCount),
      questions: (survey.questions ?? []).map((question: any) => ({
        id: String(question._id),
        text: question.text,
        type: question.type,
        required: question.required,
      })),
      responses: responses.map((item) => ({
        id: String(item._id),
        responderId: item.responderId,
        answers: item.answers,
        submittedAt: item.submittedAt,
      })),
    });
  })
);

router.get(
  "/:id/questions",
  asyncHandler(async (req, res) => {
    const survey = await SurveyModel.findById(req.params.id);
    if (!survey) return res.status(404).json({ error: "Not found" });

    res.json({
      items: (survey.questions ?? []).map((question: any) => ({
        id: String(question._id),
        text: question.text,
        type: question.type,
        required: question.required,
      })),
    });
  })
);

router.post(
  "/:id/questions",
  asyncHandler(async (req, res) => {
    const body = createSurveyQuestionSchema.parse(req.body);
    const survey = await SurveyModel.findById(req.params.id);
    if (!survey) return res.status(404).json({ error: "Not found" });

    survey.questions.push(body as any);
    await survey.save();

    const question = survey.questions[survey.questions.length - 1] as any;
    res.status(201).json({
      id: String(question._id),
      text: question.text,
      type: question.type,
      required: question.required,
    });
  })
);

router.post(
  "/:id/publish",
  asyncHandler(async (req, res) => {
    const survey = await SurveyModel.findById(req.params.id);
    if (!survey) return res.status(404).json({ error: "Not found" });

    survey.status = "PUBLISHED";
    survey.publishedAt = new Date();
    await survey.save();

    res.json({ ok: true, status: survey.status, publishedAt: survey.publishedAt });
  })
);

router.post(
  "/:id/submit",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = submitSurveyResponseSchema.parse(req.body);
    const survey = await SurveyModel.findById(req.params.id);
    if (!survey) return res.status(404).json({ error: "Not found" });

    const actor = req.auth!;
    const created = await SurveyResponseModel.create({
      surveyId: String(survey._id),
      companyId: survey.companyId,
      responderId: survey.isAnonymous ? null : actor.userId,
      answers: body.answers,
    });

    res.status(201).json({
      id: String(created._id),
      submittedAt: created.submittedAt,
    });
  })
);
