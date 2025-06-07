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
    
    // Handle non-zero message codes (like 400 for "Envelope does not exist")
    if (response.message_code === 400) {
      return {
        status: 'not_found',
        error: response.message || 'Envelope does not exist',
        stampedDocument: undefined,
        reviewerComment: response.message || 'Envelope not found in Tyler system',
        statusReason: 'envelope_not_found',
        caseNumber: undefined,
        caseTrackingId: undefined,
        parties: undefined
      };
    }
    
    // Handle other error codes
    return {
      status: 'error',
      error: response.message || 'Unknown error occurred',
      stampedDocument: undefined,
      reviewerComment: response.message || 'Error retrieving status',
      statusReason: 'api_error',
      caseNumber: undefined,
      caseTrackingId: undefined,
      parties: undefined
    };
  } catch (error: any) {
    console.error('Error checking filing status:', error);
    
    // Handle different types of errors more gracefully
    if (error.response?.status === 400 || error.code === 400) {
      const errorData = error.response?.data;
      return {
        status: 'not_found',
        error: errorData?.message || error.message || 'Envelope does not exist',
        stampedDocument: undefined,
        reviewerComment: errorData?.message || error.message || 'Envelope not found in Tyler system',
        statusReason: 'envelope_not_found',
        caseNumber: undefined,
        caseTrackingId: undefined,
        parties: undefined
      };
    }
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        status: 'auth_error',
        error: 'Authentication failed',
        stampedDocument: undefined,
        reviewerComment: 'Please re-authenticate with Tyler',
        statusReason: 'authentication_failed',
        caseNumber: undefined,
        caseTrackingId: undefined,
        parties: undefined
      };
    }
    
    if (error.response?.status >= 500) {
      return {
        status: 'server_error',
        error: 'Tyler API server error',
        stampedDocument: undefined,
        reviewerComment: 'Tyler API is experiencing issues. Please try again later.',
        statusReason: 'server_error',
        caseNumber: undefined,
        caseTrackingId: undefined,
        parties: undefined
      };
    }
    
    // Network or other errors
    return {
      status: 'network_error',
      error: error.message || 'Network error',
      stampedDocument: undefined,
      reviewerComment: 'Unable to connect to Tyler API. Please check your connection.',
      statusReason: 'network_error',
      caseNumber: undefined,
      caseTrackingId: undefined,
      parties: undefined
    };
  }
}
