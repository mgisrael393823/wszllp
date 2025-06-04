import React, { useContext, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EFileContext } from '@/context/EFileContext';
import { useToast } from '@/context/ToastContext';
import { getFilingStatus } from '@/utils/efile';

interface Props {
  envelopeId: string;
}

/**
 * Displays status for a single envelope and polls the API until it is submitted.
 */
const EFileStatusItem: React.FC<Props> = ({ envelopeId }) => {
  const { state, dispatch } = useContext(EFileContext);
  const { addToast } = useToast();
  const info = state.envelopes[envelopeId] || { status: 'checking', caseId: `external-${envelopeId}` };
  const lastStatus = useRef(info?.status || 'checking');

  const { data, error } = useQuery({
    queryKey: ['efile-status', envelopeId],
    queryFn: () => getFilingStatus(envelopeId, state.authToken as string),
    enabled: !!state.authToken && !!envelopeId,
    refetchInterval: data => (data?.item?.filings?.some(f => f.status !== 'submitting') ? false : 5000),
    retry: 2,
    onError: (err) => {
      console.error('Error fetching filing status:', err);
      // Only show error for external filings that aren't found
      if (info.caseId?.startsWith('external-')) {
        addToast({
          type: 'error',
          message: `Filing ${envelopeId} not found. Please check the envelope ID.`,
        });
      }
    }
  });

  useEffect(() => {
    if (data?.item?.filings?.[0]) {
      const filing = data.item.filings[0];
      
      // Update status in context
      dispatch({
        type: 'UPDATE_ENVELOPE_STATUS',
        envelopeId,
        status: filing.status,
        stampedDocument: filing.stamped_document,
        reviewerComment: filing.reviewer_comment,
      });
      
      // Show toast notification when status changes
      if (lastStatus.current !== filing.status) {
        if (filing.status === 'submitted') {
          addToast({
            type: 'success',
            title: 'Filing Accepted',
            message: `Envelope ${envelopeId} has been accepted by the court.${filing.stamped_document ? ' Stamped document is available for download.' : ''}`,
            duration: 8000
          });
        } else if (filing.status === 'rejected') {
          addToast({
            type: 'error',
            title: 'Filing Rejected',
            message: filing.reviewer_comment || `Envelope ${envelopeId} has been rejected by the court.`,
            duration: 10000
          });
        } else if (filing.status === 'processing') {
          addToast({
            type: 'info',
            title: 'Filing Processing',
            message: `Envelope ${envelopeId} is being processed by the court.`,
            duration: 5000
          });
        }
        
        lastStatus.current = filing.status;
      }
    }
  }, [data, dispatch, envelopeId, addToast]);

  const status = data?.item?.filings?.[0]?.status || info.status;

  return (
    <li className="mt-2 text-sm text-gray-700">
      {info.caseId} – Envelope {envelopeId} – {status}
      {info.stampedDocument && (
        <a href={info.stampedDocument} className="text-primary-600 ml-2" download>
          Download Stamped
        </a>
      )}
      {info.reviewerComment && (
        <span className="ml-2 text-error-600">{info.reviewerComment}</span>
      )}
    </li>
  );
};

export default EFileStatusItem;
