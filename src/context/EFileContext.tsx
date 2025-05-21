import React, { createContext, useReducer, useEffect } from 'react';
import { getStoredToken, isTokenExpired, storeToken } from '@/utils/efile/auth';

interface State {
  authToken: string | null;
  tokenExpires: number | null;
  envelopes: Record<string, string>;
}

type Action =
  | { type: 'SET_TOKEN'; token: string; expires: number }
  | { type: 'LOGOUT' }
  | { type: 'ADD_ENVELOPE'; caseId: string; envelopeId: string };

const initialState: State = { authToken: null, tokenExpires: null, envelopes: {} };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TOKEN':
      return { ...state, authToken: action.token, tokenExpires: action.expires };
    case 'LOGOUT':
      return { ...state, authToken: null, tokenExpires: null };
    case 'ADD_ENVELOPE':
      return { ...state, envelopes: { ...state.envelopes, [action.caseId]: action.envelopeId } };
    default:
      return state;
  }
}

export const EFileContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

export const EFileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const stored = getStoredToken();
    if (stored && !isTokenExpired(stored.expires)) {
      dispatch({ type: 'SET_TOKEN', token: stored.token, expires: stored.expires });
    }
  }, []);

  useEffect(() => {
    if (state.authToken && state.tokenExpires) {
      storeToken(state.authToken, (state.tokenExpires - Date.now()) / 1000);
    }
  }, [state.authToken, state.tokenExpires]);

  return (
    <EFileContext.Provider value={{ state, dispatch }}>{children}</EFileContext.Provider>
  );
};
