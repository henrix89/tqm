import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { asyncHandler } from "../../core/asyncHandler";
import type { AuthenticatedRequest } from "../auth/types";
import { ActivityModel, ContactModel, CustomerModel, IssueModel, NoteModel } from "./models";
import { canReadCustomer, assertCanWriteCustomer, parseObjectId } from "./access";
import { createFileAsset, listAttachmentsForEntity } from "../files/service";
import { createCustomerNotifications } from "../notifications/service";
import {
  createActivitySchema,
  createContactSchema,
  createCustomerSchema,
  createIssueSchema,
  createNoteSchema,
  customerListQuerySchema,
  updateCustomerSchema,
} from "./schemas";

export const router = Router();

const attachmentUploadSchema = z.object({
  files: z
    .array(
      z.object({
        fileName: z.string().min(1),
        contentType: z.string().optional().default("application/octet-stream"),
        dataBase64: z.string().min(1),
      })
    )
    .min(1),
});

function mapCustomer(customer: any) {
  return {
    id: String(customer._id),
    name: customer.name,
    organizationNumber: customer.organizationNumber,
    industry: customer.industry,
    status: customer.status,
    address: customer.address,
    website: customer.website,
    notes: customer.notes,
    ownerUserId: String(customer.ownerUserId),
    companyId: String(customer.companyId),
    departmentId: customer.departmentId ? String(customer.departmentId) : null,
    sharedWithUserIds: (customer.sharedWithUserIds ?? []).map((item: Types.ObjectId) => String(item)),
    responsibilityAssignments: (customer.responsibilityAssignments ?? []).map((item: any) => ({
      scope: item.scope,
      departmentId: item.departmentId ? String(item.departmentId) : null,
      userIds: (item.userIds ?? []).map((userId: Types.ObjectId) => String(userId)),
    })),
    isActive: customer.isActive,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

function mapContact(item: any) {
  return {
    id: String(item._id),
    customerId: String(item.customerId),
    name: item.name,
    email: item.email,
    phone: item.phone,
    jobTitle: item.jobTitle,
    isPrimary: item.isPrimary,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapActivity(item: any) {
  return {
    id: String(item._id),
    customerId: String(item.customerId),
    contactId: item.contactId ? String(item.contactId) : null,
    type: item.type,
    date: item.date,
    summary: item.summary,
    details: item.details,
    ownerUserId: String(item.ownerUserId),
    notificationScope: item.notificationScope ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapNote(item: any) {
  return {
    id: String(item._id),
    customerId: String(item.customerId),
    body: item.body,
    authorUserId: String(item.authorUserId),
    notificationScope: item.notificationScope ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapIssue(item: any) {
  return {
    id: String(item._id),
    customerId: String(item.customerId),
    title: item.title,
    description: item.description,
    category: item.category,
    severity: item.severity,
    status: item.status,
    dueDate: item.dueDate,
    ownerUserId: item.ownerUserId ? String(item.ownerUserId) : null,
    notificationScope: item.notificationScope ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

const notificationScopeLabels = {
  SALES: "salg",
  TECHNICAL: "teknisk",
  ADMIN: "administrasjon",
} as const;

async function getCustomerForActor(actor: NonNullable<AuthenticatedRequest["auth"]>, customerId: string) {
  const customer = await CustomerModel.findById(customerId);
  if (!customer) return null;

  const allowed = canReadCustomer(actor, {
    companyId: String(customer.companyId),
    departmentId: customer.departmentId ? String(customer.departmentId) : null,
    ownerUserId: String(customer.ownerUserId),
    sharedWithUserIds: customer.sharedWithUserIds.map((item: Types.ObjectId) => String(item)),
  });

  if (!allowed) {
    const error = new Error("Access denied");
    (error as any).statusCode = 403;
    throw error;
  }

  return customer;
}

router.get(
  "/customers",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const query = customerListQuerySchema.parse(req.query);
    const actor = req.auth!;
    const filter: Record<string, unknown> = { isActive: true };

    if (actor.role === "superadmin") {
      if (query.companyId) filter.companyId = new Types.ObjectId(query.companyId);
    } else {
      filter.companyId = new Types.ObjectId(actor.companyId);
    }

    if (query.departmentId) filter.departmentId = new Types.ObjectId(query.departmentId);
    if (query.status) filter.status = query.status;
    if (query.ownerUserId) filter.ownerUserId = new Types.ObjectId(query.ownerUserId);
    if (query.q) filter.name = { $regex: query.q, $options: "i" };

    if (actor.role === "manager") {
      filter.departmentId = parseObjectId(actor.departmentId);
    }

    if (actor.role === "employee" || actor.role === "viewer") {
      filter.$or = [{ ownerUserId: new Types.ObjectId(actor.userId) }, { sharedWithUserIds: new Types.ObjectId(actor.userId) }];
    }

    const customers = await CustomerModel.find(filter).sort({ updatedAt: -1, name: 1 });
    res.json({ items: customers.map(mapCustomer) });
  })
);

router.post(
  "/customers",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = req.auth!;
    const body = createCustomerSchema.parse(req.body);
    const companyId = actor.role === "superadmin" ? body.companyId ?? actor.companyId : actor.companyId;
    const ownerUserId = body.ownerUserId ?? actor.userId;

    assertCanWriteCustomer(actor, {
      companyId,
      departmentId: body.departmentId ?? actor.departmentId,
      ownerUserId,
      sharedWithUserIds: body.sharedWithUserIds,
    });

    const created = await CustomerModel.create({
      name: body.name,
      organizationNumber: body.organizationNumber,
      industry: body.industry,
      status: body.status,
      address: body.address,
      website: body.website,
      notes: body.notes,
      ownerUserId: new Types.ObjectId(ownerUserId),
      companyId: new Types.ObjectId(companyId),
      departmentId: parseObjectId(body.departmentId ?? actor.departmentId),
      sharedWithUserIds: body.sharedWithUserIds.map((item) => new Types.ObjectId(item)),
      responsibilityAssignments: body.responsibilityAssignments.map((item) => ({
        scope: item.scope,
        departmentId: parseObjectId(item.departmentId),
        userIds: item.userIds.map((userId) => new Types.ObjectId(userId)),
      })),
      isActive: true,
    });

    res.status(201).json(mapCustomer(created));
  })
);

router.get(
  "/customers/:id",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = req.auth!;
    const customer = await getCustomerForActor(actor, req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const [contacts, activities, notes, issues, attachments] = await Promise.all([
      ContactModel.find({ customerId: customer._id }).sort({ isPrimary: -1, name: 1 }),
      ActivityModel.find({ customerId: customer._id }).sort({ date: -1, createdAt: -1 }),
      NoteModel.find({ customerId: customer._id }).sort({ createdAt: -1 }),
      IssueModel.find({ customerId: customer._id }).sort({ createdAt: -1 }),
      listAttachmentsForEntity("crm_customer", String(customer._id)),
    ]);

    res.json({
      customer: mapCustomer(customer),
      contacts: contacts.map(mapContact),
      activities: activities.map(mapActivity),
      notes: notes.map(mapNote),
      issues: issues.map(mapIssue),
      attachments,
    });
  })
);

router.patch(
  "/customers/:id",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = req.auth!;
    const body = updateCustomerSchema.parse(req.body);
    const customer = await CustomerModel.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    assertCanWriteCustomer(actor, {
      companyId: String(customer.companyId),
      departmentId: body.departmentId ?? (customer.departmentId ? String(customer.departmentId) : null),
      ownerUserId: body.ownerUserId ?? String(customer.ownerUserId),
      sharedWithUserIds: body.sharedWithUserIds ?? customer.sharedWithUserIds.map((item: Types.ObjectId) => String(item)),
    });

    if (body.name !== undefined) customer.name = body.name;
    if (body.organizationNumber !== undefined) customer.organizationNumber = body.organizationNumber;
    if (body.industry !== undefined) customer.industry = body.industry;
    if (body.status !== undefined) customer.status = body.status;
    if (body.address !== undefined) customer.address = body.address;
    if (body.website !== undefined) customer.website = body.website;
    if (body.notes !== undefined) customer.notes = body.notes;
    if (body.ownerUserId !== undefined) customer.ownerUserId = new Types.ObjectId(body.ownerUserId);
    if (body.departmentId !== undefined) customer.departmentId = parseObjectId(body.departmentId);
    if (body.sharedWithUserIds !== undefined) customer.sharedWithUserIds = body.sharedWithUserIds.map((item) => new Types.ObjectId(item));
    if (body.responsibilityAssignments !== undefined) {
      customer.responsibilityAssignments = body.responsibilityAssignments.map((item) => ({
        scope: item.scope,
        departmentId: parseObjectId(item.departmentId),
        userIds: item.userIds.map((userId) => new Types.ObjectId(userId)),
      })) as any;
    }
    if (body.isActive !== undefined) customer.isActive = body.isActive;
    await customer.save();

    res.json(mapCustomer(customer));
  })
);

router.post(
  "/customers/:id/contacts",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = req.auth!;
    const body = createContactSchema.parse(req.body);
    const customer = await getCustomerForActor(actor, req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    assertCanWriteCustomer(actor, {
      companyId: String(customer.companyId),
      departmentId: customer.departmentId ? String(customer.departmentId) : null,
      ownerUserId: String(customer.ownerUserId),
      sharedWithUserIds: customer.sharedWithUserIds.map((item: Types.ObjectId) => String(item)),
    });

    const created = await ContactModel.create({
      customerId: customer._id,
      companyId: customer.companyId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      jobTitle: body.jobTitle,
      isPrimary: body.isPrimary,
    });

    res.status(201).json(mapContact(created));
  })
);

router.post(
  "/customers/:id/activities",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = req.auth!;
    const body = createActivitySchema.parse(req.body);
    const customer = await getCustomerForActor(actor, req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    assertCanWriteCustomer(actor, {
      companyId: String(customer.companyId),
      departmentId: customer.departmentId ? String(customer.departmentId) : null,
      ownerUserId: String(customer.ownerUserId),
      sharedWithUserIds: customer.sharedWithUserIds.map((item: Types.ObjectId) => String(item)),
    });

    const ownerUserId = body.ownerUserId ?? actor.userId;
    const created = await ActivityModel.create({
      customerId: customer._id,
      companyId: customer.companyId,
      contactId: parseObjectId(body.contactId),
      type: body.type,
      date: new Date(body.date),
      summary: body.summary,
      details: body.details,
      ownerUserId: new Types.ObjectId(ownerUserId),
      notificationScope: body.notificationScope ?? null,
    });

    if (body.notificationScope) {
      await createCustomerNotifications({
        actorUserId: actor.userId,
        customer: {
          id: String(customer._id),
          companyId: String(customer.companyId),
          name: customer.name,
          responsibilityAssignments: customer.responsibilityAssignments?.map((item: any) => ({
            scope: item.scope,
            departmentId: item.departmentId ? String(item.departmentId) : null,
            userIds: (item.userIds ?? []).map((userId: Types.ObjectId) => String(userId)),
          })),
        },
        scope: body.notificationScope,
        type: "customer_activity",
        title: `Ny aktivitet på ${customer.name}`,
        message: `${actor.userId === ownerUserId ? "En aktivitet" : "En oppdatering"} ble registrert for ${customer.name}.`,
      });
    }

    res.status(201).json(mapActivity(created));
  })
);

router.post(
  "/customers/:id/notes",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = req.auth!;
    const body = createNoteSchema.parse(req.body);
    const customer = await getCustomerForActor(actor, req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    assertCanWriteCustomer(actor, {
      companyId: String(customer.companyId),
      departmentId: customer.departmentId ? String(customer.departmentId) : null,
      ownerUserId: String(customer.ownerUserId),
      sharedWithUserIds: customer.sharedWithUserIds.map((item: Types.ObjectId) => String(item)),
    });

    const created = await NoteModel.create({
      customerId: customer._id,
      companyId: customer.companyId,
      body: body.body,
      authorUserId: new Types.ObjectId(actor.userId),
      notificationScope: body.notificationScope ?? null,
    });

    if (body.notificationScope) {
      await createCustomerNotifications({
        actorUserId: actor.userId,
        customer: {
          id: String(customer._id),
          companyId: String(customer.companyId),
          name: customer.name,
          responsibilityAssignments: customer.responsibilityAssignments?.map((item: any) => ({
            scope: item.scope,
            departmentId: item.departmentId ? String(item.departmentId) : null,
            userIds: (item.userIds ?? []).map((userId: Types.ObjectId) => String(userId)),
          })),
        },
        scope: body.notificationScope,
        type: "customer_note",
        title: `Ny melding på ${customer.name}`,
        message: `Det er lagt inn en ny melding til ${notificationScopeLabels[body.notificationScope]} for kunden.`,
      });
    }

    res.status(201).json(mapNote(created));
  })
);

router.post(
  "/customers/:id/issues",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = req.auth!;
    const body = createIssueSchema.parse(req.body);
    const customer = await getCustomerForActor(actor, req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    assertCanWriteCustomer(actor, {
      companyId: String(customer.companyId),
      departmentId: customer.departmentId ? String(customer.departmentId) : null,
      ownerUserId: String(customer.ownerUserId),
      sharedWithUserIds: customer.sharedWithUserIds.map((item: Types.ObjectId) => String(item)),
    });

    const created = await IssueModel.create({
      customerId: customer._id,
      companyId: customer.companyId,
      title: body.title,
      description: body.description,
      category: body.category,
      severity: body.severity,
      status: body.status,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      ownerUserId: parseObjectId(body.ownerUserId),
      notificationScope: body.notificationScope,
    });

    await createCustomerNotifications({
      actorUserId: actor.userId,
      customer: {
        id: String(customer._id),
        companyId: String(customer.companyId),
        name: customer.name,
        responsibilityAssignments: customer.responsibilityAssignments?.map((item: any) => ({
          scope: item.scope,
          departmentId: item.departmentId ? String(item.departmentId) : null,
          userIds: (item.userIds ?? []).map((userId: Types.ObjectId) => String(userId)),
        })),
      },
      scope: body.notificationScope,
      type: "customer_issue",
      title: `Nytt kundeavvik på ${customer.name}`,
      message: `Et kundeavvik ble registrert og sendt til riktig ansvarsområde.`,
    });

    res.status(201).json(mapIssue(created));
  })
);

router.get(
  "/customers/:id/attachments",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = req.auth!;
    const customer = await getCustomerForActor(actor, req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const attachments = await listAttachmentsForEntity("crm_customer", String(customer._id));
    res.json({ items: attachments });
  })
);

router.post(
  "/customers/:id/attachments",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = req.auth!;
    const body = attachmentUploadSchema.parse(req.body);
    const customer = await getCustomerForActor(actor, req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    assertCanWriteCustomer(actor, {
      companyId: String(customer.companyId),
      departmentId: customer.departmentId ? String(customer.departmentId) : null,
      ownerUserId: String(customer.ownerUserId),
      sharedWithUserIds: customer.sharedWithUserIds.map((item: Types.ObjectId) => String(item)),
    });

    const created = await Promise.all(
      body.files.map((file) =>
        createFileAsset({
          kind: "crm_customer",
          entityId: String(customer._id),
          companyId: String(customer.companyId),
          fileName: file.fileName,
          contentType: file.contentType,
          dataBase64: file.dataBase64,
          uploadedBy: actor.userId,
        })
      )
    );

    res.status(201).json({ items: created });
  })
);
