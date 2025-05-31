export interface AuthenticateRequest {
  data: { username: string; password: string };
}

export interface AuthenticateResponse {
  message_code: number;
  item: { auth_token: string };
}

export interface EFileDocument {
  code: string;
  description: string;
  file: string; // Base64 encoded file content
  file_name: string;
  doc_type: string;
  optional_services?: OptionalService[]; // Optional services for the filing
}

export interface CrossReference {
  code: string;                   // Reference type code (e.g., "190860" for CASE_NUMBER)
  number: string;                 // Reference number/value
}

export interface CaseParty {
  id: string;                     // Party ID
  type: string;                   // Party type code
  business_name?: string;         // Business name (if business)
  is_business: string;            // "true" or "false"
  first_name?: string;            // First name (if individual)
  last_name?: string;             // Last name (if individual)
  address_line_1?: string;        // Address line 1
  address_line_2?: string;        // Address line 2
  city?: string;                  // City
  state?: string;                 // State
  zip_code?: string;              // ZIP code
  lead_attorney?: string;         // Lead attorney
}

export interface OptionalService {
  quantity: string;               // Service quantity
  code: string;                   // Service code
}

export interface EFileSubmission {
  reference_id: string;           // Client-generated unique ID
  jurisdiction: string;           // Format: "{county}:cvd1" or "cook:M1" (Phase B)
  case_category: string;          // Category code (e.g., "7" for evictions)
  case_type: string;              // Case type code (not case number)
  case_parties?: CaseParty[];     // Phase A: Array of case parties
  filings: EFileDocument[];       // Array of documents to file
  filing_type?: string;           // Filing type ("EFile")
  payment_account_id: string;     // Payment account ID
  filing_attorney_id: string;     // Attorney ID
  filing_party_id: string;        // Party ID
  amount_in_controversy?: string; // Phase A: Amount in controversy
  show_amount_in_controversy?: string; // Phase A: "true" or "false"
  service_contacts?: string[];    // Optional service contacts
  service_type?: string;          // Optional service type
  is_initial_filing?: boolean;    // Whether this is an initial filing
  cross_references?: CrossReference[]; // For subsequent filings - references to existing cases
}

export interface EFileDocumentStatus {
  code: string;                  // Document code
  id: string;                    // Document ID
  status: string;                // Document status
  reviewer_comment?: string;     // Comments from reviewer
  stamped_document?: string;     // URL to stamped document
}

export interface SubmissionResponse {
  message_code: number;
  item: {
    filings: EFileDocumentStatus[];
    id: string;                  // Envelope ID
    case_tracking_id: string;    // Case tracking ID
    submission_date?: string;    // Date of submission
  };
}

export interface StatusResponse {
  message_code: number;
  item: {
    id: string;                  // Envelope ID
    jurisdiction: string;        // Jurisdiction
    case_number: string;         // Case number
    status: string;              // Overall status
    filings: EFileDocumentStatus[];
    filing_date?: string;        // Date of filing
    payment_status?: string;     // Payment status
    rejection_reason?: string;   // Reason for rejection
  };
}
