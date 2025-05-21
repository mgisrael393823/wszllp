import { AppState, Action } from '../DataContext';
import { AuditLog } from '../../types/schema';

export function caseReducer(
  state: AppState,
  action: Action,
  now: string,
  createAuditLog: (entity: AuditLog['entityType'], id: string, action: AuditLog['action'], details: string) => AuditLog
): { state: AppState; auditLog: AuditLog | null } | null {
  let newState = state;
  let auditLog: AuditLog | null = null;

  switch (action.type) {
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
      const caseId = action.payload;
      newState = {
        ...state,
        cases: state.cases.filter(c => c.caseId !== caseId),
        hearings: state.hearings.filter(h => h.caseId !== caseId),
        documents: state.documents.filter(d => d.caseId !== caseId),
        invoices: state.invoices.filter(i => i.caseId !== caseId),
        zoomLinks: state.zoomLinks.filter(z => z.caseId !== caseId),
      };

      const affectedDocIds = state.documents.filter(d => d.caseId === caseId).map(d => d.docId);
      const affectedInvoiceIds = state.invoices.filter(i => i.caseId === caseId).map(i => i.invoiceId);

      newState = {
        ...newState,
        serviceLogs: state.serviceLogs.filter(sl => !affectedDocIds.includes(sl.docId)),
        paymentPlans: state.paymentPlans.filter(pp => !affectedInvoiceIds.includes(pp.invoiceId)),
      };

      auditLog = createAuditLog('Case', caseId, 'Delete', 'Case deleted with all related records');
      break;

    default:
      return null;
  }

  return { state: newState, auditLog };
}
