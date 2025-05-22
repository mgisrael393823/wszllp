import axios from 'axios';
import { EFileError, AuthenticationError, SubmissionError, ServerError } from './errors';

const isBrowser = typeof window !== 'undefined';

// Configuration for different request types
const DEFAULT_TIMEOUT = 30000; // 30 seconds for regular requests
const UPLOAD_TIMEOUT = 120000; // 2 minutes for file uploads
const MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10MB max file size

const BASE_URL = isBrowser
  ? import.meta.env.VITE_EFILE_BASE_URL
  : process.env.VITE_EFILE_BASE_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  maxContentLength: MAX_CONTENT_SIZE,
  maxBodyLength: MAX_CONTENT_SIZE,
});

// Add a unique request ID to each request for tracking
let requestCounter = 0;
apiClient.interceptors.request.use(
  config => {
    // Add a request ID and timestamp for logging
    config.headers = config.headers || {};
    config.headers['x-request-id'] = `req-${Date.now()}-${++requestCounter}`;
    config.headers['x-request-start'] = Date.now();
    
    // Set longer timeout for submission endpoints
    if (config.url?.includes('/efile')) {
      config.timeout = UPLOAD_TIMEOUT;
    }
    
    // Log the request if in development
    if (import.meta.env.DEV) {
      console.info(
        '[E-File API Request]',
        config.method?.toUpperCase(),
        config.url,
        config.params || {}
      );
    }
    
    return config;
  },
  error => {
    console.error('[E-File API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => {
    // Log the response if in development
    if (import.meta.env.DEV) {
      const requestTime = response.config.headers['x-request-start'];
      const duration = requestTime ? Date.now() - Number(requestTime) : 0;
      
      console.info(
        '[E-File API Response]',
        response.config.method?.toUpperCase(),
        response.config.url,
        `(${duration}ms)`,
        response.status
      );
    }
    
    return response;
  },
  error => {
    // Log the error
    console.error(
      '[E-File API Error]',
      error.config?.method?.toUpperCase(),
      error.config?.url,
      error.response?.status,
      error.message
    );
    
    if (error.response) {
      // API responded with an error status
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401 || status === 403) {
        return Promise.reject(
          new AuthenticationError(
            data?.message || 'Authentication failed',
            status
          )
        );
      }
      
      if (status === 500) {
        // Specific handling for server errors
        const errorMsg = data?.message || 'Server error encountered';
        const errorCode = data?.code || 5001;
        
        // Check if this was a file submission endpoint
        if (error.config?.url?.includes('/efile')) {
          return Promise.reject(
            new SubmissionError(
              `Server error during submission: ${errorMsg}`, 
              errorCode
            )
          );
        }
        
        return Promise.reject(new ServerError(errorMsg, errorCode));
      }
      
      const msg = data?.message || 'Request failed';
      return Promise.reject(new EFileError(msg, status));
    }
    
    if (error.request) {
      // Request made but no response received
      return Promise.reject(
        new EFileError(
          'No response from server. Please check your network connection.',
          0
        )
      );
    }
    
    // Something else caused the error
    return Promise.reject(new EFileError(error.message));
  }
);