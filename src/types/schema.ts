import { z } from 'zod';

// Base schemas

// Workflow task types
export const workflowTaskTypeEnum = z.enum([
  'FileDocument', 
  'ScheduleHearing', 
  'SendNotice', 
  'CreateInvoice', 
  'UpdateStatus',
  'SendReminder'
]);

// Notification schema
export const notificationSchema = z.object({
  notificationId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(['Deadline', 'Hearing', 'Document', 'System', 'Alert']),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  isRead: z.boolean().default(false),
  entityType: z.enum(['Case', 'Hearing', 'Document', 'Calendar', 'Workflow', 'System']).optional(),
  entityId: z.string().optional(),
  dismissedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Notification settings schema
export const notificationSettingsSchema = z.object({
  hearingReminders: z.boolean().default(true),
  deadlineReminders: z.boolean().default(true),
  documentUpdates: z.boolean().default(true),
  workflowUpdates: z.boolean().default(true),
  systemAnnouncements: z.boolean().default(true),
  emailNotifications: z.boolean().default(false),
  advanceHearingReminder: z.number().default(24),
  advanceDeadlineReminder: z.number().default(48),
});

export const caseSchema = z.object({
  caseId: z.string(),
  plaintiff: z.string().min(1).max(100),
  defendant: z.string().min(1).max(100),
  address: z.string().min(1).max(200),
  status: z.enum(['SPS NOT SERVED', 'SPS PENDING', 'SEND TO SPS', 'SPS SERVED']),
  dateFiled: z.string().optional(),
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
  role: z.enum(['Attorney', 'Paralegal', 'PM', 'Client', 'Other']),
  email: z.string().email(),
  phone: z.string(),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
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
  entityType: z.enum(['Case', 'Hearing', 'Document', 'ServiceLog', 'Invoice', 'PaymentPlan', 'Contact', 'ZoomLink', 'Workflow', 'WorkflowTask']),
  entityId: z.string(),
  action: z.enum(['Create', 'Update', 'Delete', 'Complete', 'Trigger']),
  timestamp: z.string(),
  details: z.string(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

// Workflow Task schema
export const workflowTaskSchema = z.object({
  taskId: z.string(),
  workflowId: z.string(),
  type: workflowTaskTypeEnum,
  name: z.string(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  isComplete: z.boolean(),
  completedAt: z.string().optional(),
  order: z.number(),
  dependsOn: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Workflow schema
export const workflowSchema = z.object({
  workflowId: z.string(),
  caseId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isTemplate: z.boolean().default(false),
  isActive: z.boolean().default(true),
  triggerType: z.enum(['Manual', 'OnCaseCreation', 'OnStatusChange', 'OnDocumentFiled', 'OnHearingScheduled']).optional(),
  completedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Document Template schema
export const documentTemplateSchema = z.object({
  templateId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.enum(['Complaint', 'Summons', 'Notice', 'Motion', 'Order', 'Letter', 'Agreement', 'Other']),
  content: z.string(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Document Generation schema
export const documentGenerationSchema = z.object({
  generationId: z.string(),
  templateId: z.string(),
  caseId: z.string(),
  documentName: z.string(),
  documentType: z.enum(['Complaint', 'Summons', 'Affidavit', 'Motion', 'Order', 'Other']),
  variables: z.record(z.string(), z.string()).optional(),
  status: z.enum(['Draft', 'Final', 'Filed']).default('Draft'),
  docId: z.string().optional(), // Link to the final document in the documents collection
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Calendar Event Schema
export const calendarEventSchema = z.object({
  eventId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().optional(),
  caseId: z.string().optional(),
  hearingId: z.string().optional(),
  eventType: z.enum(['Hearing', 'Meeting', 'Deadline', 'Reminder', 'Other']),
  isAllDay: z.boolean().default(false),
  recurrence: z.enum(['None', 'Daily', 'Weekly', 'Monthly', 'Yearly']).optional(),
  syncStatus: z.enum(['Pending', 'Synced', 'Failed', 'Manual']).default('Manual'),
  externalEventId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Calendar Integration Schema
export const calendarIntegrationSchema = z.object({
  integrationId: z.string(),
  userId: z.string(),
  providerType: z.enum(['Google', 'Outlook', 'iCloud', 'Other']),
  providerName: z.string(),
  authToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiry: z.string().optional(),
  calendarId: z.string().optional(),
  isActive: z.boolean().default(true),
  lastSyncTime: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types
export type WorkflowTask = z.infer<typeof workflowTaskSchema>;
export type Workflow = z.infer<typeof workflowSchema>;
export type DocumentTemplate = z.infer<typeof documentTemplateSchema>;
export type DocumentGeneration = z.infer<typeof documentGenerationSchema>;
export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type CalendarIntegration = z.infer<typeof calendarIntegrationSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;