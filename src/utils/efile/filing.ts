import { apiClient } from './apiClient';
import type { EFileSubmission, SubmissionResponse, StatusResponse } from '@/types/efile';
import { retryable } from './retry';
import { mapMessageCode, SubmissionError, StatusError } from './errors';

/**
 * Submit an e-filing payload to the API.
 * @param submission Request payload following API-INTEGRATION-GUIDE
 * @param token Auth token from authenticate endpoint
 */
export async function submitFiling(
  submission: EFileSubmission,
  token: string,
  retries = 3,
) {
  const fn = async () => {
    const { data } = await apiClient.post<SubmissionResponse>(
      '/il/efile',
      { data: submission },
      { headers: { authtoken: token } },
    );
    if (data.message_code !== 0) {
      throw new SubmissionError(mapMessageCode(data.message_code), data.message_code);
    }
    return data;
  };
  return retryable(fn, { retries });
}

/**
 * Retrieve status for a submitted envelope.
 * @param envelopeId ID returned from submitFiling
 * @param token Auth token
 */
export async function getFilingStatus(
  envelopeId: string,
  token: string,
  retries = 3,
) {
  const fields =
    'client_matter_number,jurisdiction,case_number,case_tracking_id,case_category,case_type,' +
    'filings(file,status,stamped_document,reviewer_comment,status_reason)';
  const fn = async () => {
    const { data } = await apiClient.get<StatusResponse>(
      `/il/envelope/${envelopeId}?fields=${fields}`,
      { headers: { authtoken: token } },
    );
    if (data.message_code !== 0) {
      throw new StatusError(mapMessageCode(data.message_code), data.message_code);
    }
    return data;
  };
  return retryable(fn, { retries });
}
