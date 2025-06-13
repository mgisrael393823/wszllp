import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Case, Hearing, Document, ServiceLog, Invoice, PaymentPlan, Contact, ZoomLink, AuditLog,
  Workflow, WorkflowTask, DocumentTemplate, DocumentGeneration, CalendarEvent, CalendarIntegration,
  Notification, NotificationSettings
} from '../types/schema';

// Define the shape of our application state
interface AppState {
  cases: Case[];
  hearings: Hearing[];
  documents: Document[];
  serviceLogs: ServiceLog[];
  invoices: Invoice[];
  paymentPlans: PaymentPlan[];
  contacts: Contact[];
  zoomLinks: ZoomLink[];
  workflows: Workflow[];
  workflowTasks: WorkflowTask[];
  documentTemplates: DocumentTemplate[];
  documentGenerations: DocumentGeneration[];
  calendarEvents: CalendarEvent[];
  calendarIntegrations: CalendarIntegration[];
  notifications: Notification[];
  notificationSettings: NotificationSettings;
  auditLogs: AuditLog[];
}

// Define the types of actions that can be dispatched
type Action =
  | { type: 'LOAD_DATA'; payload: AppState }
  | { type: 'ADD_CASE'; payload: Case }
  | { type: 'UPDATE_CASE'; payload: Case }
  | { type: 'DELETE_CASE'; payload: string }
  | { type: 'ADD_CASES'; payload: Case[] }
  | { type: 'ADD_HEARING'; payload: Hearing }
  | { type: 'UPDATE_HEARING'; payload: Hearing }
  | { type: 'DELETE_HEARING'; payload: string }
  | { type: 'ADD_HEARINGS'; payload: Hearing[] }
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'UPDATE_DOCUMENT'; payload: Document }
  | { type: 'ADD_DOCUMENTS'; payload: Document[] }
  | { type: 'ADD_CONTACT'; payload: Contact }
  | { type: 'UPDATE_CONTACT'; payload: { id: string, contact: Contact } }
  | { type: 'DELETE_CONTACT'; payload: string }
  | { type: 'ADD_CONTACTS'; payload: Contact[] }
  | { type: 'DELETE_DOCUMENT'; payload: string }
  | { type: 'ADD_SERVICE_LOG'; payload: ServiceLog }
  | { type: 'UPDATE_SERVICE_LOG'; payload: ServiceLog }
  | { type: 'DELETE_SERVICE_LOG'; payload: string }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'UPDATE_INVOICE'; payload: Invoice }
  | { type: 'ADD_INVOICES'; payload: Invoice[] }
  | { type: 'DELETE_INVOICE'; payload: string }
  | { type: 'ADD_PAYMENT_PLAN'; payload: PaymentPlan }
  | { type: 'UPDATE_PAYMENT_PLAN'; payload: PaymentPlan }
  | { type: 'DELETE_PAYMENT_PLAN'; payload: string }
  // Contact actions are defined below
  | { type: 'ADD_ZOOM_LINK'; payload: ZoomLink }
  | { type: 'UPDATE_ZOOM_LINK'; payload: ZoomLink }
  | { type: 'DELETE_ZOOM_LINK'; payload: string }
  | { type: 'ADD_WORKFLOW'; payload: Workflow }
  | { type: 'UPDATE_WORKFLOW'; payload: Workflow }
  | { type: 'DELETE_WORKFLOW'; payload: string }
  | { type: 'ADD_WORKFLOW_TASK'; payload: WorkflowTask }
  | { type: 'UPDATE_WORKFLOW_TASK'; payload: WorkflowTask }
  | { type: 'DELETE_WORKFLOW_TASK'; payload: string }
  | { type: 'COMPLETE_WORKFLOW_TASK'; payload: string }
  | { type: 'ADD_DOCUMENT_TEMPLATE'; payload: DocumentTemplate }
  | { type: 'UPDATE_DOCUMENT_TEMPLATE'; payload: DocumentTemplate }
  | { type: 'DELETE_DOCUMENT_TEMPLATE'; payload: string }
  | { type: 'ADD_DOCUMENT_GENERATION'; payload: DocumentGeneration }
  | { type: 'UPDATE_DOCUMENT_GENERATION'; payload: DocumentGeneration }
  | { type: 'DELETE_DOCUMENT_GENERATION'; payload: string }
  | { type: 'GENERATE_DOCUMENT_FROM_TEMPLATE'; payload: { templateId: string, caseId: string, variables: Record<string, string> } }
  | { type: 'ADD_CALENDAR_EVENT'; payload: CalendarEvent }
  | { type: 'UPDATE_CALENDAR_EVENT'; payload: CalendarEvent }
  | { type: 'DELETE_CALENDAR_EVENT'; payload: string }
  | { type: 'SYNC_HEARING_TO_CALENDAR'; payload: { hearingId: string, calendarIntegrationId?: string } }
  | { type: 'ADD_CALENDAR_INTEGRATION'; payload: CalendarIntegration }
  | { type: 'UPDATE_CALENDAR_INTEGRATION'; payload: CalendarIntegration }
  | { type: 'DELETE_CALENDAR_INTEGRATION'; payload: string }
  | { type: 'SYNC_ALL_HEARINGS'; payload: { calendarIntegrationId?: string } }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'UPDATE_NOTIFICATION'; payload: Notification }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' }
  | { type: 'UPDATE_NOTIFICATION_SETTINGS'; payload: NotificationSettings }
  | { type: 'GENERATE_HEARING_NOTIFICATIONS' }
  | { type: 'GENERATE_DEADLINE_NOTIFICATIONS' }
  | { type: 'ADD_AUDIT_LOG'; payload: AuditLog };

// Create a context with initial empty state
const initialState: AppState = {
  cases: [],
  hearings: [],
  documents: [],
  serviceLogs: [],
  invoices: [],
  paymentPlans: [],
  contacts: [],
  zoomLinks: [],
  workflows: [],
  workflowTasks: [],
  documentTemplates: [],
  documentGenerations: [],
  calendarEvents: [],
  calendarIntegrations: [],
  notifications: [],
  notificationSettings: {
    hearingReminders: true,
    deadlineReminders: true,
    documentUpdates: true,
    workflowUpdates: true,
    systemAnnouncements: true,
    emailNotifications: false,
    advanceHearingReminder: 24,
    advanceDeadlineReminder: 48,
  },
  auditLogs: [],
};

// Helper function to create audit log
const createAuditLog = (
  entityType: AuditLog['entityType'],
  entityId: string,
  action: AuditLog['action'],
  details: string
): AuditLog => ({
  id: uuidv4(),
  entityType,
  entityId,
  action,
  timestamp: new Date().toISOString(),
  details,
});

// The reducer function to handle state updates
const dataReducer = (state: AppState, action: Action): AppState => {
  const now = new Date().toISOString();
  let newState = { ...state };
  let auditLog: AuditLog | null = null;

  switch (action.type) {
    case 'LOAD_DATA':
      return action.payload;

    // Case actions
    case 'ADD_CASE':
      newState = {
        ...state,
        cases: [...state.cases, action.payload],
      };
      auditLog = createAuditLog('Case', action.payload.caseId, 'Create', 'Case created');
      break;

    case 'UPDATE_CASE':
      newState = {
        ...state,
        cases: state.cases.map(c => 
          c.caseId === action.payload.caseId ? { ...action.payload, updatedAt: now } : c
        ),
      };
      auditLog = createAuditLog('Case', action.payload.caseId, 'Update', 'Case updated');
      break;

    case 'DELETE_CASE':
      // Handle cascade delete
      const caseId = action.payload;
      newState = {
        ...state,
        cases: state.cases.filter(c => c.caseId !== caseId),
        hearings: state.hearings.filter(h => h.caseId !== caseId),
        documents: state.documents.filter(d => d.caseId !== caseId),
        invoices: state.invoices.filter(i => i.caseId !== caseId),
        zoomLinks: state.zoomLinks.filter(z => z.caseId !== caseId),
      };
      
      // Also remove child records of documents and invoices
      const affectedDocIds = state.documents.filter(d => d.caseId === caseId).map(d => d.docId);
      const affectedInvoiceIds = state.invoices.filter(i => i.caseId === caseId).map(i => i.invoiceId);
      
      newState.serviceLogs = state.serviceLogs.filter(sl => !affectedDocIds.includes(sl.docId));
      newState.paymentPlans = state.paymentPlans.filter(pp => !affectedInvoiceIds.includes(pp.invoiceId));
      
      auditLog = createAuditLog('Case', caseId, 'Delete', 'Case deleted with all related records');
      break;

    // Bulk Case actions
    case 'ADD_CASES':
      const newCases = action.payload.map(caseItem => ({
        ...caseItem,
        createdAt: caseItem.createdAt || now,
        updatedAt: caseItem.updatedAt || now
      }));
      
      newState = {
        ...state,
        cases: [...state.cases, ...newCases],
      };
      
      auditLog = createAuditLog('Case', 'bulk', 'Create', 
        `Bulk import: ${newCases.length} cases added`);
      break;

    // Hearing actions
    case 'ADD_HEARING':
      newState = {
        ...state,
        hearings: [...state.hearings, action.payload],
      };
      auditLog = createAuditLog('Hearing', action.payload.hearingId, 'Create', 'Hearing created');
      break;

    case 'UPDATE_HEARING':
      newState = {
        ...state,
        hearings: state.hearings.map(h => 
          h.hearingId === action.payload.hearingId ? { ...action.payload, updatedAt: now } : h
        ),
      };
      auditLog = createAuditLog('Hearing', action.payload.hearingId, 'Update', 'Hearing updated');
      break;

    case 'DELETE_HEARING':
      newState = {
        ...state,
        hearings: state.hearings.filter(h => h.hearingId !== action.payload),
      };
      auditLog = createAuditLog('Hearing', action.payload, 'Delete', 'Hearing deleted');
      break;

    // Bulk Hearing actions  
    case 'ADD_HEARINGS':
      const newHearings = action.payload.map(hearing => ({
        ...hearing,
        createdAt: hearing.createdAt || now,
        updatedAt: hearing.updatedAt || now
      }));
      
      newState = {
        ...state,
        hearings: [...state.hearings, ...newHearings],
      };
      
      auditLog = createAuditLog('Hearing', 'bulk', 'Create',
        `Bulk import: ${newHearings.length} hearings added`);
      break;

    // Document actions
    case 'ADD_DOCUMENT':
      newState = {
        ...state,
        documents: [...state.documents, action.payload],
      };
      auditLog = createAuditLog('Document', action.payload.docId, 'Create', 'Document created');
      break;

    case 'UPDATE_DOCUMENT':
      newState = {
        ...state,
        documents: state.documents.map(d => 
          d.docId === action.payload.docId ? { ...action.payload, updatedAt: now } : d
        ),
      };
      auditLog = createAuditLog('Document', action.payload.docId, 'Update', 'Document updated');
      break;

    case 'DELETE_DOCUMENT':
      const docId = action.payload;
      newState = {
        ...state,
        documents: state.documents.filter(d => d.docId !== docId),
        serviceLogs: state.serviceLogs.filter(sl => sl.docId !== docId),
      };
      auditLog = createAuditLog('Document', docId, 'Delete', 'Document and related logs deleted');
      break;

    // Bulk Document actions
    case 'ADD_DOCUMENTS':
      const newDocuments = action.payload.map(doc => ({
        ...doc,
        createdAt: doc.createdAt || now,
        updatedAt: doc.updatedAt || now
      }));
      
      newState = {
        ...state,
        documents: [...state.documents, ...newDocuments],
      };
      
      auditLog = createAuditLog('Document', 'bulk', 'Create',
        `Bulk import: ${newDocuments.length} documents added`);
      break;

    // Service Log actions  
    case 'ADD_SERVICE_LOG':
      newState = {
        ...state,
        serviceLogs: [...state.serviceLogs, action.payload],
      };
      auditLog = createAuditLog('ServiceLog', action.payload.logId, 'Create', 'Service log created');
      break;

    case 'UPDATE_SERVICE_LOG':
      newState = {
        ...state,
        serviceLogs: state.serviceLogs.map(sl => 
          sl.logId === action.payload.logId ? { ...action.payload, updatedAt: now } : sl
        ),
      };
      auditLog = createAuditLog('ServiceLog', action.payload.logId, 'Update', 'Service log updated');
      break;

    case 'DELETE_SERVICE_LOG':
      newState = {
        ...state,
        serviceLogs: state.serviceLogs.filter(sl => sl.logId !== action.payload),
      };
      auditLog = createAuditLog('ServiceLog', action.payload, 'Delete', 'Service log deleted');
      break;

    // Invoice actions
    case 'ADD_INVOICE':
      newState = {
        ...state,
        invoices: [...state.invoices, action.payload],
      };
      auditLog = createAuditLog('Invoice', action.payload.invoiceId, 'Create', 'Invoice created');
      break;

    case 'UPDATE_INVOICE':
      newState = {
        ...state,
        invoices: state.invoices.map(i => 
          i.invoiceId === action.payload.invoiceId ? { ...action.payload, updatedAt: now } : i
        ),
      };
      auditLog = createAuditLog('Invoice', action.payload.invoiceId, 'Update', 'Invoice updated');
      break;

    case 'DELETE_INVOICE':
      const invoiceId = action.payload;
      newState = {
        ...state,
        invoices: state.invoices.filter(i => i.invoiceId !== invoiceId),
        paymentPlans: state.paymentPlans.filter(pp => pp.invoiceId !== invoiceId),
      };
      auditLog = createAuditLog('Invoice', invoiceId, 'Delete', 'Invoice and payment plans deleted');
      break;

    // Bulk Invoice actions
    case 'ADD_INVOICES':
      const newInvoices = action.payload.map(invoice => ({
        ...invoice,
        createdAt: invoice.createdAt || now,
        updatedAt: invoice.updatedAt || now
      }));
      
      newState = {
        ...state,
        invoices: [...state.invoices, ...newInvoices],
      };
      
      auditLog = createAuditLog('Invoice', 'bulk', 'Create',
        `Bulk import: ${newInvoices.length} invoices added`);
      break;

    // Payment Plan actions
    case 'ADD_PAYMENT_PLAN':
      newState = {
        ...state,
        paymentPlans: [...state.paymentPlans, action.payload],
      };
      auditLog = createAuditLog('PaymentPlan', action.payload.planId, 'Create', 'Payment plan created');
      break;

    case 'UPDATE_PAYMENT_PLAN':
      newState = {
        ...state,
        paymentPlans: state.paymentPlans.map(pp => 
          pp.planId === action.payload.planId ? { ...action.payload, updatedAt: now } : pp
        ),
      };
      auditLog = createAuditLog('PaymentPlan', action.payload.planId, 'Update', 'Payment plan updated');
      break;

    case 'DELETE_PAYMENT_PLAN':
      newState = {
        ...state,
        paymentPlans: state.paymentPlans.filter(pp => pp.planId !== action.payload),
      };
      auditLog = createAuditLog('PaymentPlan', action.payload, 'Delete', 'Payment plan deleted');
      break;

    // Contact actions
    case 'ADD_CONTACT':
      newState = {
        ...state,
        contacts: [...state.contacts, action.payload],
      };
      auditLog = createAuditLog('Contact', action.payload.contactId, 'Create', 'Contact created');
      break;

    case 'UPDATE_CONTACT':
      newState = {
        ...state,
        contacts: state.contacts.map(c => 
          c.contactId === action.payload.id ? { ...action.payload.contact, updatedAt: now } : c
        ),
      };
      auditLog = createAuditLog('Contact', action.payload.id, 'Update', 'Contact updated');
      break;

    case 'DELETE_CONTACT':
      newState = {
        ...state,
        contacts: state.contacts.filter(c => c.contactId !== action.payload),
      };
      auditLog = createAuditLog('Contact', action.payload, 'Delete', 'Contact deleted');
      break;

    // Bulk Contact actions
    case 'ADD_CONTACTS':
      const newContacts = action.payload.map(contact => ({
        ...contact,
        createdAt: contact.createdAt || now,
        updatedAt: contact.updatedAt || now
      }));
      
      newState = {
        ...state,
        contacts: [...state.contacts, ...newContacts],
      };
      
      auditLog = createAuditLog('Contact', 'bulk', 'Create',
        `Bulk import: ${newContacts.length} contacts added`);
      break;

    // Zoom Link actions
    case 'ADD_ZOOM_LINK':
      newState = {
        ...state,
        zoomLinks: [...state.zoomLinks, action.payload],
      };
      auditLog = createAuditLog('ZoomLink', action.payload.linkId, 'Create', 'Zoom link created');
      break;

    case 'UPDATE_ZOOM_LINK':
      newState = {
        ...state,
        zoomLinks: state.zoomLinks.map(z => 
          z.linkId === action.payload.linkId ? { ...action.payload, updatedAt: now } : z
        ),
      };
      auditLog = createAuditLog('ZoomLink', action.payload.linkId, 'Update', 'Zoom link updated');
      break;

    case 'DELETE_ZOOM_LINK':
      newState = {
        ...state,
        zoomLinks: state.zoomLinks.filter(z => z.linkId !== action.payload),
      };
      auditLog = createAuditLog('ZoomLink', action.payload, 'Delete', 'Zoom link deleted');
      break;
      
    // Workflow actions
    case 'ADD_WORKFLOW':
      newState = {
        ...state,
        workflows: [...state.workflows, action.payload],
      };
      auditLog = createAuditLog('Workflow', action.payload.workflowId, 'Create', `Workflow "${action.payload.name}" created`);
      break;
      
    case 'UPDATE_WORKFLOW':
      newState = {
        ...state,
        workflows: state.workflows.map(w => 
          w.workflowId === action.payload.workflowId ? { ...action.payload, updatedAt: now } : w
        ),
      };
      auditLog = createAuditLog('Workflow', action.payload.workflowId, 'Update', `Workflow "${action.payload.name}" updated`);
      break;
      
    case 'DELETE_WORKFLOW':
      const workflowId = action.payload;
      const workflowToDelete = state.workflows.find(w => w.workflowId === workflowId);
      newState = {
        ...state,
        workflows: state.workflows.filter(w => w.workflowId !== workflowId),
        workflowTasks: state.workflowTasks.filter(t => t.workflowId !== workflowId),
      };
      auditLog = createAuditLog('Workflow', workflowId, 'Delete', `Workflow "${workflowToDelete?.name || 'Unknown'}" deleted with all tasks`);
      break;
      
    // Workflow Task actions
    case 'ADD_WORKFLOW_TASK':
      newState = {
        ...state,
        workflowTasks: [...state.workflowTasks, action.payload],
      };
      auditLog = createAuditLog('WorkflowTask', action.payload.taskId, 'Create', `Task "${action.payload.name}" created`);
      break;
      
    case 'UPDATE_WORKFLOW_TASK':
      newState = {
        ...state,
        workflowTasks: state.workflowTasks.map(t => 
          t.taskId === action.payload.taskId ? { ...action.payload, updatedAt: now } : t
        ),
      };
      auditLog = createAuditLog('WorkflowTask', action.payload.taskId, 'Update', `Task "${action.payload.name}" updated`);
      break;
      
    case 'DELETE_WORKFLOW_TASK':
      const taskId = action.payload;
      const taskToDelete = state.workflowTasks.find(t => t.taskId === taskId);
      newState = {
        ...state,
        workflowTasks: state.workflowTasks.filter(t => t.taskId !== taskId),
      };
      auditLog = createAuditLog('WorkflowTask', taskId, 'Delete', `Task "${taskToDelete?.name || 'Unknown'}" deleted`);
      break;
      
    case 'COMPLETE_WORKFLOW_TASK':
      const taskToComplete = state.workflowTasks.find(t => t.taskId === action.payload);
      if (!taskToComplete) return state;
      
      newState = {
        ...state,
        workflowTasks: state.workflowTasks.map(t => 
          t.taskId === action.payload 
            ? { ...t, isComplete: true, completedAt: now, updatedAt: now } 
            : t
        ),
      };
      
      // Check if all tasks in the workflow are complete
      const relatedTasks = newState.workflowTasks.filter(t => t.workflowId === taskToComplete.workflowId);
      const allTasksComplete = relatedTasks.every(t => t.isComplete);
      
      if (allTasksComplete) {
        // Mark the workflow as complete if all tasks are done
        newState.workflows = newState.workflows.map(w => 
          w.workflowId === taskToComplete.workflowId
            ? { ...w, isActive: false, completedAt: now, updatedAt: now }
            : w
        );
        
        const completedWorkflow = newState.workflows.find(w => w.workflowId === taskToComplete.workflowId);
        auditLog = createAuditLog('Workflow', taskToComplete.workflowId, 'Complete', 
          `Workflow "${completedWorkflow?.name || 'Unknown'}" completed with all tasks`);
      } else {
        auditLog = createAuditLog('WorkflowTask', action.payload, 'Complete', 
          `Task "${taskToComplete.name}" marked as complete`);
      }
      break;

    // Document Template actions
    case 'ADD_DOCUMENT_TEMPLATE':
      newState = {
        ...state,
        documentTemplates: [...state.documentTemplates, action.payload],
      };
      auditLog = createAuditLog('DocumentTemplate', action.payload.templateId, 'Create', 
        `Document template "${action.payload.name}" created`);
      break;
      
    case 'UPDATE_DOCUMENT_TEMPLATE':
      newState = {
        ...state,
        documentTemplates: state.documentTemplates.map(t => 
          t.templateId === action.payload.templateId ? { ...action.payload, updatedAt: now } : t
        ),
      };
      auditLog = createAuditLog('DocumentTemplate', action.payload.templateId, 'Update', 
        `Document template "${action.payload.name}" updated`);
      break;
      
    case 'DELETE_DOCUMENT_TEMPLATE':
      const templateId = action.payload;
      const templateToDelete = state.documentTemplates.find(t => t.templateId === templateId);
      
      // Check if template is in use by any document generations
      const isTemplateInUse = state.documentGenerations.some(g => g.templateId === templateId);
      
      if (isTemplateInUse) {
        // Don't delete the template, just mark it as inactive
        newState = {
          ...state,
          documentTemplates: state.documentTemplates.map(t => 
            t.templateId === templateId ? { ...t, isActive: false, updatedAt: now } : t
          ),
        };
        auditLog = createAuditLog('DocumentTemplate', templateId, 'Update', 
          `Document template "${templateToDelete?.name || 'Unknown'}" marked as inactive (in use)`);
      } else {
        // Delete the template completely
        newState = {
          ...state,
          documentTemplates: state.documentTemplates.filter(t => t.templateId !== templateId),
        };
        auditLog = createAuditLog('DocumentTemplate', templateId, 'Delete', 
          `Document template "${templateToDelete?.name || 'Unknown'}" deleted`);
      }
      break;
      
    // Document Generation actions
    case 'ADD_DOCUMENT_GENERATION':
      newState = {
        ...state,
        documentGenerations: [...state.documentGenerations, action.payload],
      };
      auditLog = createAuditLog('DocumentGeneration', action.payload.generationId, 'Create', 
        `Document "${action.payload.documentName}" generated from template`);
      break;
      
    case 'UPDATE_DOCUMENT_GENERATION':
      newState = {
        ...state,
        documentGenerations: state.documentGenerations.map(g => 
          g.generationId === action.payload.generationId ? { ...action.payload, updatedAt: now } : g
        ),
      };
      auditLog = createAuditLog('DocumentGeneration', action.payload.generationId, 'Update', 
        `Generated document "${action.payload.documentName}" updated`);
      break;
      
    case 'DELETE_DOCUMENT_GENERATION':
      const generationId = action.payload;
      const generationToDelete = state.documentGenerations.find(g => g.generationId === generationId);
      
      newState = {
        ...state,
        documentGenerations: state.documentGenerations.filter(g => g.generationId !== generationId),
      };
      
      // If the generation is linked to a document, don't delete the actual document
      auditLog = createAuditLog('DocumentGeneration', generationId, 'Delete', 
        `Generated document "${generationToDelete?.documentName || 'Unknown'}" deleted`);
      break;
      
    case 'GENERATE_DOCUMENT_FROM_TEMPLATE':
      // Get the template
      const template = state.documentTemplates.find(t => t.templateId === action.payload.templateId);
      if (!template) return state;
      
      // Get the case
      const selectedCase = state.cases.find(c => c.caseId === action.payload.caseId);
      if (!selectedCase) return state;
      
      // Process template with variables
      let processedContent = template.content;
      const variables = action.payload.variables;
      
      // Replace template variables with actual values
      if (template.variables && variables) {
        template.variables.forEach(variable => {
          const value = variables[variable] || '';
          const regex = new RegExp(`{{${variable}}}`, 'g');
          processedContent = processedContent.replace(regex, value);
        });
      }
      
      // Also inject case variables regardless of whether they're in the template variables
      const caseVariables = {
        'caseId': selectedCase.caseId,
        'plaintiff': selectedCase.plaintiff,
        'defendant': selectedCase.defendant,
        'address': selectedCase.address,
        'status': selectedCase.status,
        'intakeDate': selectedCase.intakeDate,
        'createdAt': selectedCase.createdAt,
      };
      
      for (const [key, value] of Object.entries(caseVariables)) {
        const regex = new RegExp(`{{case.${key}}}`, 'g');
        processedContent = processedContent.replace(regex, value);
      }
      
      // Create document generation record
      const documentName = variables.documentName || `${template.name} - ${selectedCase.plaintiff} v. ${selectedCase.defendant}`;
      const newGeneration: DocumentGeneration = {
        generationId: uuidv4(),
        templateId: template.templateId,
        caseId: selectedCase.caseId,
        documentName,
        documentType: template.category as DocumentGeneration['documentType'],
        variables: variables,
        status: 'Draft',
        createdAt: now,
        updatedAt: now,
      };
      
      // Create the actual document
      const newDocument: Document = {
        docId: uuidv4(),
        caseId: selectedCase.caseId,
        type: template.category as Document['type'],
        fileURL: `generated://${newGeneration.generationId}`, // Placeholder URL
        status: 'Pending',
        createdAt: now,
        updatedAt: now,
      };
      
      // Link the document to the generation
      newGeneration.docId = newDocument.docId;
      
      newState = {
        ...state,
        documentGenerations: [...state.documentGenerations, newGeneration],
        documents: [...state.documents, newDocument],
      };
      
      auditLog = createAuditLog('DocumentGeneration', newGeneration.generationId, 'Create', 
        `Document "${documentName}" generated from template "${template.name}"`);
      break;
    
    // Calendar Event actions
    case 'ADD_CALENDAR_EVENT':
      newState = {
        ...state,
        calendarEvents: [...state.calendarEvents, action.payload],
      };
      auditLog = createAuditLog('CalendarEvent', action.payload.eventId, 'Create', 
        `Calendar event "${action.payload.title}" created`);
      break;
      
    case 'UPDATE_CALENDAR_EVENT':
      newState = {
        ...state,
        calendarEvents: state.calendarEvents.map(e => 
          e.eventId === action.payload.eventId ? { ...action.payload, updatedAt: now } : e
        ),
      };
      auditLog = createAuditLog('CalendarEvent', action.payload.eventId, 'Update', 
        `Calendar event "${action.payload.title}" updated`);
      break;
      
    case 'DELETE_CALENDAR_EVENT':
      const eventId = action.payload;
      const eventToDelete = state.calendarEvents.find(e => e.eventId === eventId);
      
      newState = {
        ...state,
        calendarEvents: state.calendarEvents.filter(e => e.eventId !== eventId),
      };
      
      auditLog = createAuditLog('CalendarEvent', eventId, 'Delete', 
        `Calendar event "${eventToDelete?.title || 'Unknown'}" deleted`);
      break;
      
    // Calendar Integration actions
    case 'ADD_CALENDAR_INTEGRATION':
      newState = {
        ...state,
        calendarIntegrations: [...state.calendarIntegrations, action.payload],
      };
      auditLog = createAuditLog('CalendarIntegration', action.payload.integrationId, 'Create', 
        `Calendar integration "${action.payload.providerName}" created`);
      break;
      
    case 'UPDATE_CALENDAR_INTEGRATION':
      newState = {
        ...state,
        calendarIntegrations: state.calendarIntegrations.map(i => 
          i.integrationId === action.payload.integrationId ? { ...action.payload, updatedAt: now } : i
        ),
      };
      auditLog = createAuditLog('CalendarIntegration', action.payload.integrationId, 'Update', 
        `Calendar integration "${action.payload.providerName}" updated`);
      break;
      
    case 'DELETE_CALENDAR_INTEGRATION':
      const integrationId = action.payload;
      const integrationToDelete = state.calendarIntegrations.find(i => i.integrationId === integrationId);
      
      newState = {
        ...state,
        calendarIntegrations: state.calendarIntegrations.filter(i => i.integrationId !== integrationId),
      };
      
      auditLog = createAuditLog('CalendarIntegration', integrationId, 'Delete', 
        `Calendar integration "${integrationToDelete?.providerName || 'Unknown'}" deleted`);
      break;
      
    // Calendar event creation from hearing
    case 'SYNC_HEARING_TO_CALENDAR':
      const { hearingId, calendarIntegrationId } = action.payload;
      const hearing = state.hearings.find(h => h.hearingId === hearingId);
      
      if (!hearing) return state;
      
      const caseData = state.cases.find(c => c.caseId === hearing.caseId);
      if (!caseData) return state;
      
      // Check if an event already exists for this hearing
      const existingEvent = state.calendarEvents.find(e => e.hearingId === hearingId);
      
      // Get the active calendar integration if not specified
      let integration = null;
      if (calendarIntegrationId) {
        integration = state.calendarIntegrations.find(i => i.integrationId === calendarIntegrationId);
      } else {
        integration = state.calendarIntegrations.find(i => i.isActive);
      }
      
      // Create event title from case info
      const eventTitle = `Hearing: ${caseData.plaintiff} v. ${caseData.defendant}`;
      
      // Calculate end time (1 hour after start by default)
      const startTime = new Date(hearing.hearingDate);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);
      
      if (existingEvent) {
        // Update existing event
        const updatedEvent: CalendarEvent = {
          ...existingEvent,
          title: eventTitle,
          description: `Court hearing for case ${caseData.caseId}`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          location: hearing.courtName,
          syncStatus: integration ? 'Pending' : 'Manual',
          updatedAt: now,
        };
        
        newState = {
          ...state,
          calendarEvents: state.calendarEvents.map(e => 
            e.eventId === existingEvent.eventId ? updatedEvent : e
          ),
        };
        
        auditLog = createAuditLog('CalendarEvent', existingEvent.eventId, 'Update', 
          `Calendar event for hearing "${hearing.courtName}" updated`);
      } else {
        // Create new event
        const newEvent: CalendarEvent = {
          eventId: uuidv4(),
          title: eventTitle,
          description: `Court hearing for case ${caseData.caseId}`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          location: hearing.courtName,
          caseId: caseData.caseId,
          hearingId: hearing.hearingId,
          eventType: 'Hearing',
          isAllDay: false,
          syncStatus: integration ? 'Pending' : 'Manual',
          createdAt: now,
          updatedAt: now,
        };
        
        newState = {
          ...state,
          calendarEvents: [...state.calendarEvents, newEvent],
        };
        
        auditLog = createAuditLog('CalendarEvent', newEvent.eventId, 'Create', 
          `Calendar event for hearing "${hearing.courtName}" created`);
      }
      break;
      
    // Sync all hearings to calendar
    case 'SYNC_ALL_HEARINGS':
      // Get all future hearings
      const futureHearings = state.hearings.filter(h => new Date(h.hearingDate) > new Date());
      
      if (futureHearings.length === 0) return state;
      
      // Get the active calendar integration
      let activeIntegration = null;
      if (action.payload.calendarIntegrationId) {
        activeIntegration = state.calendarIntegrations.find(
          i => i.integrationId === action.payload.calendarIntegrationId
        );
      } else {
        activeIntegration = state.calendarIntegrations.find(i => i.isActive);
      }
      
      // Create or update events for each hearing
      const updatedEvents = [...state.calendarEvents];
      const newEvents: CalendarEvent[] = [];
      let syncCount = 0;
      
      for (const hearing of futureHearings) {
        const caseData = state.cases.find(c => c.caseId === hearing.caseId);
        if (!caseData) continue;
        
        // Check if an event already exists for this hearing
        const existingEventIndex = updatedEvents.findIndex(e => e.hearingId === hearing.hearingId);
        
        // Create event title from case info
        const eventTitle = `Hearing: ${caseData.plaintiff} v. ${caseData.defendant}`;
        
        // Calculate end time (1 hour after start by default)
        const startTime = new Date(hearing.hearingDate);
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 1);
        
        if (existingEventIndex >= 0) {
          // Update existing event
          updatedEvents[existingEventIndex] = {
            ...updatedEvents[existingEventIndex],
            title: eventTitle,
            description: `Court hearing for case ${caseData.caseId}`,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            location: hearing.courtName,
            syncStatus: activeIntegration ? 'Pending' : 'Manual',
            updatedAt: now,
          };
        } else {
          // Create new event
          newEvents.push({
            eventId: uuidv4(),
            title: eventTitle,
            description: `Court hearing for case ${caseData.caseId}`,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            location: hearing.courtName,
            caseId: caseData.caseId,
            hearingId: hearing.hearingId,
            eventType: 'Hearing',
            isAllDay: false,
            syncStatus: activeIntegration ? 'Pending' : 'Manual',
            createdAt: now,
            updatedAt: now,
          });
        }
        
        syncCount++;
      }
      
      if (syncCount === 0) return state;
      
      newState = {
        ...state,
        calendarEvents: [...updatedEvents, ...newEvents],
      };
      
      auditLog = createAuditLog(
        'CalendarEvent', 
        'batch', 
        'Create', 
        `Synced ${syncCount} hearings to calendar`
      );
      break;

    // Notification actions
    case 'ADD_NOTIFICATION':
      newState = {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
      break;
      
    case 'UPDATE_NOTIFICATION':
      newState = {
        ...state,
        notifications: state.notifications.map(n => 
          n.notificationId === action.payload.notificationId ? { ...action.payload, updatedAt: now } : n
        ),
      };
      break;
      
    case 'DELETE_NOTIFICATION':
      newState = {
        ...state,
        notifications: state.notifications.filter(n => n.notificationId !== action.payload),
      };
      break;
      
    case 'CLEAR_ALL_NOTIFICATIONS':
      newState = {
        ...state,
        notifications: [],
      };
      break;
      
    case 'UPDATE_NOTIFICATION_SETTINGS':
      newState = {
        ...state,
        notificationSettings: action.payload,
      };
      break;
      
    case 'GENERATE_HEARING_NOTIFICATIONS':
      // Get settings
      const hearingSettings = state.notificationSettings;
      if (!hearingSettings.hearingReminders) return state;
      
      // Get future hearings within the reminder window
      const now = new Date();
      const reminderHours = hearingSettings.advanceHearingReminder;
      const reminderWindow = new Date(now.getTime() + (reminderHours * 60 * 60 * 1000));
      
      const upcomingHearings = state.hearings.filter(hearing => {
        const hearingDate = new Date(hearing.hearingDate);
        // Filter hearings that:
        // 1. Are in the future
        // 2. Are within the reminder window
        // 3. Don't already have a notification for them
        return (
          hearingDate > now && 
          hearingDate <= reminderWindow &&
          !state.notifications.some(n => 
            n.entityType === 'Hearing' && 
            n.entityId === hearing.hearingId &&
            new Date(n.createdAt) > new Date(new Date().getTime() - (24 * 60 * 60 * 1000)) // Created in last 24 hours
          )
        );
      });
      
      if (upcomingHearings.length === 0) return state;
      
      // Create notifications for each upcoming hearing
      const hearingNotifications: Notification[] = [];
      
      for (const hearing of upcomingHearings) {
        const caseData = state.cases.find(c => c.caseId === hearing.caseId);
        if (!caseData) continue;
        
        const hearingDate = new Date(hearing.hearingDate);
        const hearingTime = hearingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const hearingDateFormatted = hearingDate.toLocaleDateString();
        
        const hoursUntil = Math.round((hearingDate.getTime() - now.getTime()) / (60 * 60 * 1000));
        
        hearingNotifications.push({
          notificationId: uuidv4(),
          title: `Upcoming Hearing: ${caseData.plaintiff} v. ${caseData.defendant}`,
          message: `You have a hearing scheduled for ${hearingDateFormatted} at ${hearingTime} (in ${hoursUntil} hours) at ${hearing.courtName}.`,
          type: 'Hearing',
          priority: hoursUntil < 24 ? 'High' : 'Medium',
          isRead: false,
          entityType: 'Hearing',
          entityId: hearing.hearingId,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      }
      
      if (hearingNotifications.length === 0) return state;
      
      newState = {
        ...state,
        notifications: [...state.notifications, ...hearingNotifications],
      };
      
      auditLog = createAuditLog(
        'System', 
        'batch', 
        'Create', 
        `Generated ${hearingNotifications.length} hearing notifications`
      );
      break;
      
    case 'GENERATE_DEADLINE_NOTIFICATIONS':
      // Get settings
      const deadlineSettings = state.notificationSettings;
      if (!deadlineSettings.deadlineReminders) return state;
      
      // Get all workflow tasks with due dates
      const currentDate = new Date();
      const deadlineReminderHours = deadlineSettings.advanceDeadlineReminder;
      const deadlineWindow = new Date(currentDate.getTime() + (deadlineReminderHours * 60 * 60 * 1000));
      
      const upcomingDeadlines = state.workflowTasks.filter(task => {
        if (!task.dueDate || task.isComplete) return false;
        
        const dueDate = new Date(task.dueDate);
        // Filter tasks that:
        // 1. Are not complete
        // 2. Have a due date
        // 3. Due date is in the future
        // 4. Due date is within reminder window
        // 5. Don't already have a notification for them
        return (
          dueDate > currentDate && 
          dueDate <= deadlineWindow &&
          !state.notifications.some(n => 
            n.entityType === 'Workflow' && 
            n.entityId === task.taskId &&
            new Date(n.createdAt) > new Date(new Date().getTime() - (24 * 60 * 60 * 1000)) // Created in last 24 hours
          )
        );
      });
      
      if (upcomingDeadlines.length === 0) return state;
      
      // Create notifications for each upcoming deadline
      const deadlineNotifications: Notification[] = [];
      
      for (const task of upcomingDeadlines) {
        const workflow = state.workflows.find(w => w.workflowId === task.workflowId);
        if (!workflow) continue;
        
        const caseData = state.cases.find(c => c.caseId === workflow.caseId);
        if (!caseData) continue;
        
        const dueDate = new Date(task.dueDate!);
        const dueDateFormatted = dueDate.toLocaleDateString();
        
        const hoursUntil = Math.round((dueDate.getTime() - currentDate.getTime()) / (60 * 60 * 1000));
        
        deadlineNotifications.push({
          notificationId: uuidv4(),
          title: `Upcoming Deadline: ${task.name}`,
          message: `Task "${task.name}" for case ${caseData.plaintiff} v. ${caseData.defendant} is due on ${dueDateFormatted} (in ${hoursUntil} hours).`,
          type: 'Deadline',
          priority: hoursUntil < 24 ? 'High' : 'Medium',
          isRead: false,
          entityType: 'Workflow',
          entityId: task.taskId,
          createdAt: currentDate.toISOString(),
          updatedAt: currentDate.toISOString(),
        });
      }
      
      if (deadlineNotifications.length === 0) return state;
      
      newState = {
        ...state,
        notifications: [...state.notifications, ...deadlineNotifications],
      };
      
      auditLog = createAuditLog(
        'System', 
        'batch', 
        'Create', 
        `Generated ${deadlineNotifications.length} deadline notifications`
      );
      break;

    case 'ADD_AUDIT_LOG':
      return {
        ...state,
        auditLogs: [...state.auditLogs, action.payload],
      };

    default:
      return state;
  }

  // Add audit log entry if one was created
  if (auditLog) {
    newState = {
      ...newState,
      auditLogs: [...newState.auditLogs, auditLog],
    };
  }

  return newState;
};

// Create a context for the data
const DataContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

// Create a provider component
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Load initial data from localStorage
  useEffect(() => {
    const loadData = () => {
      const savedData = localStorage.getItem('legalCaseData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          dispatch({ type: 'LOAD_DATA', payload: parsedData });
        } catch (error) {
          console.error('Failed to parse saved data:', error);
        }
      }
    };

    loadData();
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('legalCaseData', JSON.stringify(state));
  }, [state]);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use the data context
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};