import React, { useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EFileContext } from '@/context/EFileContext';
import { getFilingStatus } from '@/utils/efile';

interface Props {
  envelopeId: string;
}

/**
 * Displays status for a single envelope and polls the API until it is submitted.
 */
const EFileStatusItem: React.FC<Props> = ({ envelopeId }) => {
  const { state, dispatch } = useContext(EFileContext);
  const info = state.envelopes[envelopeId];

  const { data } = useQuery({
    queryKey: ['efile-status', envelopeId],
    queryFn: () => getFilingStatus(envelopeId, state.authToken as string),
    enabled: !!state.authToken,
    refetchInterval: data => (data?.item.filings?.some(f => f.status !== 'submitting') ? false : 5000),
  });

  useEffect(() => {
    if (data) {
      const filing = data.item.filings[0];
      dispatch({
        type: 'UPDATE_ENVELOPE_STATUS',
        envelopeId,
        status: filing.status,
        stampedDocument: filing.stamped_document,
        reviewerComment: filing.reviewer_comment,
      });
    }
  }, [data, dispatch, envelopeId]);

  const status = data?.item.filings[0].status || info.status;

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
