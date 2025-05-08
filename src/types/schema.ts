import { z } from 'zod';

// Base schemas
export const caseSchema = z.object({
  caseId: z.string(),
  plaintiff: z.string().min(1).max(100),
  defendant: z.string().min(1).max(100),
  address: z.string().min(1).max(200),
  status: z.enum(['Intake', 'Active', 'Closed']),
  intakeDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const hearingSchema = z.object({
  hearingId: z.string(),
  caseId: z.string(),
  courtName: z.string().min(1).max(100),
  hearingDate: z.string(),
  outcome: z.string().max(500).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const documentSchema = z.object({
  docId: z.string(),
  caseId: z.string(),
  type: z.enum(['Complaint', 'Summons', 'Affidavit', 'Motion', 'Order', 'Other']),
  fileURL: z.string(),
  status: z.enum(['Pending', 'Served', 'Failed']),
  serviceDate: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const serviceLogSchema = z.object({
  logId: z.string(),
  docId: z.string(),
  method: z.enum(['Sheriff', 'SPS']),
  attemptDate: z.string(),
  result: z.enum(['Success', 'Failed']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const invoiceSchema = z.object({
  invoiceId: z.string(),
  caseId: z.string(),
  amount: z.number().min(0),
  issueDate: z.string(),
  dueDate: z.string(),
  paid: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const paymentPlanSchema = z.object({
  planId: z.string(),
  invoiceId: z.string(),
  installmentDate: z.string(),
  amount: z.number().min(0),
  paid: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const contactSchema = z.object({
  contactId: z.string(),
  name: z.string().min(1).max(100),
  role: z.enum(['Attorney', 'Paralegal', 'PM']),
  email: z.string().email(),
  phone: z.string().regex(/^\d{3}-\d{3}-\d{4}$/, { message: "Phone must be in format xxx-xxx-xxxx" }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const zoomLinkSchema = z.object({
  linkId: z.string(),
  caseId: z.string(),
  url: z.string().url(),
  meetingDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types
export type Case = z.infer<typeof caseSchema>;
export type Hearing = z.infer<typeof hearingSchema>;
export type Document = z.infer<typeof documentSchema>;
export type ServiceLog = z.infer<typeof serviceLogSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type PaymentPlan = z.infer<typeof paymentPlanSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type ZoomLink = z.infer<typeof zoomLinkSchema>;

// Audit log schema
export const auditLogSchema = z.object({
  id: z.string(),
  entityType: z.enum(['Case', 'Hearing', 'Document', 'ServiceLog', 'Invoice', 'PaymentPlan', 'Contact', 'ZoomLink']),
  entityId: z.string(),
  action: z.enum(['Create', 'Update', 'Delete']),
  timestamp: z.string(),
  details: z.string(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;