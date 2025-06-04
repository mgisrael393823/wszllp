import React, { createContext, useReducer, useEffect } from 'react';
import { getStoredToken, isTokenExpired, storeToken } from '@/utils/efile/auth';

interface EnvelopeInfo {
  caseId: string;
  status: string;
  stampedDocument?: string;
  reviewerComment?: string;
  addedAt?: string;
  isExternal?: boolean;
}

interface FormDataDraft {
  jurisdiction: string;
  county: string;
  caseNumber: string;
  attorneyId: string;
  files: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
  }>;
}

interface DraftInfo {
  draftId: string;
  formData: FormDataDraft;
  savedAt: string;
  caseId: string;
  autoSaved: boolean;
}

interface State {
  authToken: string | null;
  tokenExpires: number | null;
  envelopes: Record<string, EnvelopeInfo>;
  drafts: Record<string, DraftInfo>;
  userPermissions: string[];
}

type Action =
  | { type: 'SET_TOKEN'; token: string; expires: number }
  | { type: 'LOGOUT' }
  | { type: 'ADD_ENVELOPE'; caseId: string; envelopeId: string }
  | {
      type: 'UPDATE_ENVELOPE_STATUS';
      envelopeId: string;
      status: string;
      stampedDocument?: string;
      reviewerComment?: string;
    }
  | { type: 'SAVE_DRAFT'; draft: DraftInfo }
  | { type: 'DELETE_DRAFT'; draftId: string }
  | { type: 'PURGE_EXPIRED_DRAFTS' };

const initialState: State = { 
  authToken: null, 
  tokenExpires: null, 
  envelopes: {},
  drafts: {},
  userPermissions: ['efile:submit', 'efile:view', 'efile:download'] 
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TOKEN':
      return { ...state, authToken: action.token, tokenExpires: action.expires };
    case 'LOGOUT':
      return { ...state, authToken: null, tokenExpires: null };
    case 'ADD_ENVELOPE':
      return {
        ...state,
        envelopes: {
          ...state.envelopes,
          [action.envelopeId]: { caseId: action.caseId, status: 'submitting' },
        },
      };
    case 'UPDATE_ENVELOPE_STATUS':
      return {
        ...state,
        envelopes: {
          ...state.envelopes,
          [action.envelopeId]: {
            ...state.envelopes[action.envelopeId],
            status: action.status,
            stampedDocument: action.stampedDocument,
            reviewerComment: action.reviewerComment,
          },
        },
      };
    case 'SAVE_DRAFT':
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [action.draft.draftId]: action.draft
        }
      };
    case 'DELETE_DRAFT':
      const { [action.draftId]: _, ...remainingDrafts } = state.drafts;
      return {
        ...state,
        drafts: remainingDrafts
      };
    case 'PURGE_EXPIRED_DRAFTS':
      // Filter out drafts older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const updatedDrafts = Object.entries(state.drafts).reduce((acc, [id, draft]) => {
        const draftDate = new Date(draft.savedAt);
        if (draftDate >= sevenDaysAgo) {
          acc[id] = draft;
        }
        return acc;
      }, {} as Record<string, DraftInfo>);
      
      return {
        ...state,
        drafts: updatedDrafts
      };
    default:
      return state;
  }
}

export const EFileContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

// Function to store drafts in localStorage
const storeDrafts = (drafts: Record<string, DraftInfo>) => {
  try {
    localStorage.setItem('efile_drafts', JSON.stringify(drafts));
  } catch (error) {
    console.error('Error storing efile drafts:', error);
  }
};

// Function to retrieve drafts from localStorage
const getStoredDrafts = (): Record<string, DraftInfo> => {
  try {
    const drafts = localStorage.getItem('efile_drafts');
    return drafts ? JSON.parse(drafts) : {};
  } catch (error) {
    console.error('Error retrieving efile drafts:', error);
    return {};
  }
};

export const EFileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    drafts: getStoredDrafts()
  });

  useEffect(() => {
    const stored = getStoredToken();
    if (stored && !isTokenExpired(stored.expires)) {
      dispatch({ type: 'SET_TOKEN', token: stored.token, expires: stored.expires });
    }
    
    // Purge expired drafts on load
    dispatch({ type: 'PURGE_EXPIRED_DRAFTS' });
  }, []);

  useEffect(() => {
    if (state.authToken && state.tokenExpires) {
      storeToken(state.authToken, (state.tokenExpires - Date.now()) / 1000);
    }
  }, [state.authToken, state.tokenExpires]);
  
  // Store drafts whenever they change
  useEffect(() => {
    storeDrafts(state.drafts);
  }, [state.drafts]);

  return (
    <EFileContext.Provider value={{ state, dispatch }}>{children}</EFileContext.Provider>
  );
};
