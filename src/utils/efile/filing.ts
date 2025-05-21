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
