import axios from 'axios';
import { EFileError, AuthenticationError, SubmissionError, ServerError } from './errors';

// Configuration for different request types
const DEFAULT_TIMEOUT = 30000; // 30 seconds for regular requests
const UPLOAD_TIMEOUT = 120000; // 2 minutes for file uploads
const MAX_CONTENT_SIZE = 50 * 1024 * 1024; // 50MB max for base64 encoded files

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_EFILE_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  maxContentLength: MAX_CONTENT_SIZE,
  maxBodyLength: MAX_CONTENT_SIZE,
  headers: {
    'clienttoken': import.meta.env.VITE_EFILE_CLIENT_TOKEN || 'EVICT87',
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for timeout and logging
apiClient.interceptors.request.use(
  config => {
    // Set longer timeout for submission endpoints
    if (config.url?.includes('/efile')) {
      config.timeout = UPLOAD_TIMEOUT;
    }
    
    // Log the request (sensitive in production, verbose in dev)
    const logLevel = import.meta.env.PROD ? 'info' : 'log';
    console[logLevel](
      '[E-File API Request]',
      config.method?.toUpperCase(),
      config.url,
      {
        headers: {
          ...config.headers,
          // Mask sensitive headers in logs
          authtoken: config.headers?.authtoken ? `${config.headers.authtoken.substring(0, 10)}...` : undefined,
          clienttoken: config.headers?.clienttoken ? `${config.headers.clienttoken.substring(0, 3)}***` : undefined,
        },
        params: config.params || {},
        // Don't log full request body in production
        hasBody: !!config.data,
      }
    );
    
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
      console.info(
        '[E-File API Response]',
        response.config.method?.toUpperCase(),
        response.config.url,
        response.status
      );
    }
    
    return response;
  },
  error => {
    // Enhanced error logging
    console.error(
      '[E-File API Error]',
      {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        responseData: error.response?.data,
        headers: {
          ...error.config?.headers,
          // Mask sensitive headers
          authtoken: error.config?.headers?.authtoken ? 'present' : 'missing',
          clienttoken: error.config?.headers?.clienttoken ? 'present' : 'missing',
        },
      }
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
        // Tyler API bug: Sometimes returns 500 with a 400 message_code
        if (data?.message_code === 400) {
          // Treat as a 400 error despite the 500 status
          return Promise.reject(new EFileError(data.message || 'Bad request', 400));
        }
        
        // Specific handling for actual server errors
        const errorMsg = data?.message || 'Server error encountered';
        const errorCode = data?.code || data?.message_code || 5001;
        
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