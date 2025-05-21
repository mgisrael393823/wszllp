/**
 * Base class for e-filing related errors.
 */
export class EFileError extends Error {
  code?: number;
  constructor(message: string, code?: number) {
    super(message);
    this.code = code;
    this.name = 'EFileError';
  }
}

export class AuthenticationError extends EFileError {
  constructor(message = 'Authentication failed', code?: number) {
    super(message, code);
    this.name = 'AuthenticationError';
  }
}

export class SubmissionError extends EFileError {
  constructor(message = 'Submission failed', code?: number) {
    super(message, code);
    this.name = 'SubmissionError';
  }
}

export class StatusError extends EFileError {
  constructor(message = 'Failed to retrieve status', code?: number) {
    super(message, code);
    this.name = 'StatusError';
  }
}

export class PermissionError extends EFileError {
  constructor(message = 'Permission denied', code?: number) {
    super(message, code);
    this.name = 'PermissionError';
  }
}

export class OfflineError extends EFileError {
  constructor(message = 'Cannot connect to server', code?: number) {
    super(message, code);
    this.name = 'OfflineError';
  }
}

/**
 * Specific error class for server-side 500 errors.
 * Used to differentiate infrastructure issues from client-side problems.
 */
export class ServerError extends EFileError {
  constructor(message = 'Internal server error', code?: number) {
    super(message, code);
    this.name = 'ServerError';
  }

  /**
   * Checks if the error is potentially recoverable
   * @returns boolean indicating if retry is advisable
   */
  isRecoverable(): boolean {
    // Server errors with specific codes may be unrecoverable
    return this.code !== 5002 && this.code !== 5003;
  }
}

/**
 * Translate API message codes to human readable strings.
 */
export function mapMessageCode(code: number): string {
  switch (code) {
    case 0:
      return 'Success';
    case 1001:
      return 'Invalid credentials';
    case 1002:
      return 'Token expired';
    case 2001:
      return 'Invalid filing data';
    case 2002:
      return 'Missing required field';
    case 2003:
      return 'Invalid document format';
    case 2004:
      return 'Document exceeds size limit';
    case 3001:
      return 'Envelope not found';
    case 3002:
      return 'Filing not found';
    case 4001:
      return 'Payment required';
    case 5001:
      return 'Server error';
    case 5002:
      return 'Service unavailable';
    case 5003:
      return 'Database error';
    case 5004:
      return 'File processing error';
    default:
      return 'Unexpected error';
  }
}