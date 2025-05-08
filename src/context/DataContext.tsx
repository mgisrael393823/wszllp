import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Case, Hearing, Document, ServiceLog, Invoice, PaymentPlan, Contact, ZoomLink, AuditLog
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
  auditLogs: AuditLog[];
}

// Define the types of actions that can be dispatched
type Action =
  | { type: 'LOAD_DATA'; payload: AppState }
  | { type: 'ADD_CASE'; payload: Case }
  | { type: 'UPDATE_CASE'; payload: Case }
  | { type: 'DELETE_CASE'; payload: string }
  | { type: 'ADD_HEARING'; payload: Hearing }
  | { type: 'UPDATE_HEARING'; payload: Hearing }
  | { type: 'DELETE_HEARING'; payload: string }
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'UPDATE_DOCUMENT'; payload: Document }
  | { type: 'DELETE_DOCUMENT'; payload: string }
  | { type: 'ADD_SERVICE_LOG'; payload: ServiceLog }
  | { type: 'UPDATE_SERVICE_LOG'; payload: ServiceLog }
  | { type: 'DELETE_SERVICE_LOG'; payload: string }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'UPDATE_INVOICE'; payload: Invoice }
  | { type: 'DELETE_INVOICE'; payload: string }
  | { type: 'ADD_PAYMENT_PLAN'; payload: PaymentPlan }
  | { type: 'UPDATE_PAYMENT_PLAN'; payload: PaymentPlan }
  | { type: 'DELETE_PAYMENT_PLAN'; payload: string }
  | { type: 'ADD_CONTACT'; payload: Contact }
  | { type: 'UPDATE_CONTACT'; payload: Contact }
  | { type: 'DELETE_CONTACT'; payload: string }
  | { type: 'ADD_ZOOM_LINK'; payload: ZoomLink }
  | { type: 'UPDATE_ZOOM_LINK'; payload: ZoomLink }
  | { type: 'DELETE_ZOOM_LINK'; payload: string }
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
          c.contactId === action.payload.contactId ? { ...action.payload, updatedAt: now } : c
        ),
      };
      auditLog = createAuditLog('Contact', action.payload.contactId, 'Update', 'Contact updated');
      break;

    case 'DELETE_CONTACT':
      newState = {
        ...state,
        contacts: state.contacts.filter(c => c.contactId !== action.payload),
      };
      auditLog = createAuditLog('Contact', action.payload, 'Delete', 'Contact deleted');
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