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

/** Map message codes from the e-filing API to human readable messages */
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
    case 3001:
      return 'Envelope not found';
    default:
      return 'Unexpected error';
  }
}
