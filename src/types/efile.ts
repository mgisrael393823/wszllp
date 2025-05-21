export interface AuthenticateRequest {
  data: { username: string; password: string };
}

export interface AuthenticateResponse {
  message_code: number;
  item: { auth_token: string };
}

export interface EFileSubmission {
  reference_id: string;
  jurisdiction: string;
  case_category: string;
  case_type: string;
  // Add additional fields as required by API-INTEGRATION-GUIDE
}

export interface SubmissionResponse {
  message_code: number;
  item: {
    filings: { code: string; id: string; status: string }[];
    id: string;
    case_tracking_id: string;
  };
}

export interface StatusResponse {
  message_code: number;
  item: {
    jurisdiction: string;
    case_number: string;
    filings: { status: string; reviewer_comment: string }[];
  };
}
