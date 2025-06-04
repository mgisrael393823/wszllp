import { apiClient } from './apiClient';
import type { EFileSubmission, SubmissionResponse, StatusResponse } from '@/types/efile';

/**
 * Submit an e-filing payload to the API.
 * @param submission Request payload following API-INTEGRATION-GUIDE
 * @param token Auth token from authenticate endpoint
 */
export async function submitFiling(submission: EFileSubmission, token: string) {
  const { data } = await apiClient.post<SubmissionResponse>(
    '/il/efile',
    { data: submission },
    { headers: { authtoken: token } },
  );
  return data;
}

/**
 * Retrieve status for a submitted envelope.
 * @param envelopeId ID returned from submitFiling
 * @param token Auth token
 */
export async function getFilingStatus(envelopeId: string, token: string) {
  const fields =
    'client_matter_number,jurisdiction,case_number,case_tracking_id,case_category,case_type,' +
    'filings(file,status,stamped_document,reviewer_comment,status_reason)';
  const { data } = await apiClient.get<StatusResponse>(
    `/il/envelope/${envelopeId}?fields=${fields}`,
    { headers: { authtoken: token } },
  );
  return data;
}

/**
 * Check filing status and return formatted data for the UI
 * @param envelopeId ID to check
 * @param token Auth token
 */
export async function checkFilingStatus(envelopeId: string, token: string) {
  try {
    const response = await getFilingStatus(envelopeId, token);
    
    if (response.message_code === 0 && response.item) {
      const filing = response.item.filings?.[0];
      return {
        status: filing?.status || 'unknown',
        stampedDocument: filing?.stamped_document,
        reviewerComment: filing?.reviewer_comment,
        statusReason: filing?.status_reason,
        caseNumber: response.item.case_number,
        caseTrackingId: response.item.case_tracking_id,
        // Could add party info if available in the response
        parties: undefined
      };
    }
    return null;
  } catch (error) {
    console.error('Error checking filing status:', error);
    return null;
  }
}
