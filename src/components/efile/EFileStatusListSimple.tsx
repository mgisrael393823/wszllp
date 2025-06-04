import React, { useContext, useState, useEffect } from 'react';
import { Plus, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, LogIn } from 'lucide-react';
import { EFileContext } from '../../context/EFileContext';
import EFileStatusItem from './EFileStatusItem';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { checkFilingStatus } from '../../utils/efile/filing';
import { ensureAuth } from '../../utils/efile/auth';
import { useToast } from '../../context/ToastContext';

interface RecentEnvelope {
  envelopeId: string;
  timestamp: number;
  isExternal: boolean;
}

const EFileStatusListSimple: React.FC = () => {
  const { state, dispatch } = useContext(EFileContext);
  const { showToast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [externalEnvelopeId, setExternalEnvelopeId] = useState('');
  const [isAddingExternal, setIsAddingExternal] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Get all envelope IDs and sort by most recent (for now, just show all)
  const envelopeIds = Object.keys(state.envelopes);
  
  // Load and save external envelopes to localStorage
  const [externalEnvelopes, setExternalEnvelopes] = useState<string[]>(() => {
    const stored = localStorage.getItem('efile_external_envelopes');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('efile_external_envelopes', JSON.stringify(externalEnvelopes));
  }, [externalEnvelopes]);

  // Combine all envelopes and limit to recent 10
  const allEnvelopes = [...new Set([...envelopeIds, ...externalEnvelopes])].slice(0, 10);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    try {
      const token = await ensureAuth(state.authToken, state.tokenExpires, dispatch);
      if (token) {
        showToast('Authentication successful', 'success');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      showToast('Authentication failed. Please check your credentials.', 'error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAddExternal = async () => {
    if (!externalEnvelopeId.trim()) {
      showToast('Please enter an envelope ID', 'error');
      return;
    }

    if (!state.authToken) {
      showToast('Please authenticate first', 'error');
      return;
    }

    setIsAddingExternal(true);
    try {
      // Add to context
      dispatch({ 
        type: 'ADD_ENVELOPE', 
        caseId: `external-${externalEnvelopeId}`, 
        envelopeId: externalEnvelopeId 
      });

      // Add to external list
      setExternalEnvelopes(prev => [externalEnvelopeId, ...prev].slice(0, 20));

      showToast('External filing added. Checking status...', 'info');
      setIsAddModalOpen(false);
      setExternalEnvelopeId('');
      
      // Status will be checked by the EFileStatusItem component
    } catch (error) {
      console.error('Error adding external filing:', error);
      showToast('Failed to add external filing', 'error');
    } finally {
      setIsAddingExternal(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'submitted':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Recent Filings (Last 10)</h3>
        <div className="flex gap-2">
          {!state.authToken && (
            <Button
              size="sm"
              variant="outline"
              icon={<LogIn size={14} />}
              onClick={handleAuthenticate}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            icon={<Plus size={14} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Track External Filing
          </Button>
        </div>
      </div>

      {/* Status list */}
      {allEnvelopes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="mx-auto mb-2" size={24} />
          <p>No filings to display</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {allEnvelopes.map(envelopeId => {
            const isExternal = externalEnvelopes.includes(envelopeId);
            const status = state.envelopes[envelopeId]?.status || 'checking';
            
            return (
              <li key={envelopeId} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className="font-mono text-sm">{envelopeId}</span>
                    {isExternal && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        External
                      </span>
                    )}
                  </div>
                  <EFileStatusItem envelopeId={envelopeId} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add external modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setExternalEnvelopeId('');
        }}
        title="Track External Filing"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setExternalEnvelopeId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddExternal}
              disabled={isAddingExternal || !state.authToken}
            >
              Add Filing
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter the envelope ID from a filing submitted outside this system.
          </p>
          <Input
            label="Envelope ID"
            value={externalEnvelopeId}
            onChange={(e) => setExternalEnvelopeId(e.target.value)}
            placeholder="e.g., 302358"
            required
          />
          {!state.authToken && (
            <p className="text-sm text-red-600">
              Please authenticate with Tyler first before adding external filings.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default EFileStatusListSimple;